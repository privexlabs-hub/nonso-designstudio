'use client';
/* Visual editor for graphics (positioned elements) and documents (flowing blocks). Port of Editor.dc.html.
   The canvas is painted imperatively from the shared HTML renderer (same output as previews and exports);
   panels are React. Edits autosave to localStorage['ns:doc:<id>'] and are indexed in 'ns:index'. */
import { Component, cloneElement, createRef, isValidElement, type ChangeEvent, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { Icon } from '@/components/ds';
import { FitPreview } from '@/components/shell/FitPreview';
import { clone, copy, esc, palettes, store, swatches, uid } from '@/lib/core';
import { toast } from '@/lib/toast';
import { getTheme, toggleTheme } from '@/lib/theme';
import * as G from '@/lib/graphics';
import * as D from '@/lib/docs';
import * as R from '@/lib/render';
import * as X from '@/lib/export';
import { docKey, findTemplate, fresh as freshDoc, type CatalogItem } from '@/lib/catalog';
import type { AnyDoc, Block, BlockType, DocDoc, DPage, El, GPage, GraphicDoc, PageLayout, PaletteKey, VAlign, Align } from '@/lib/types';
import { DragList } from './DragList';
import css from './Editor.module.css';

type Tab = 'edit' | 'page' | 'doc' | 'export';
type Panel = 'pages' | 'canvas' | 'inspect';
type Sel = { page: number; id: string | null };
type Item = El | Block;
type Patch = Record<string, unknown>;
interface State {
  ready: boolean; err: string | null; theme: string; doc: AnyDoc | null; sel: Sel; tab: Tab; zoom: 'fit' | number; narrow: boolean; mp: Panel;
  fmt: string; scope: 'current' | 'all'; scale: number; quality: number; busy: string | null; exportMsg: string | null; exportOk: boolean;
  overflow: number[]; saved: boolean; addPageKey: string; addBlockType: BlockType; customW: number; customH: number; cw: number; ch: number; preview: boolean; hv: number;
}
type Drag = { mode: 'move' | 'resize'; sx: number; sy: number; x: number; y: number; w: number; h: number; id: string; page: number; moved: boolean; pid: number };

const INLINE_BLOCKS = ['eyebrow', 'title', 'subtitle', 'h1', 'h2', 'h3', 'lead', 'para', 'note', 'byline', 'contact'];
const BLOCK_SAMPLE: Record<string, string> = { eyebrow: 'Eyebrow', title: 'Title', subtitle: 'Subtitle', h1: 'Heading', h2: 'Heading', h3: 'Heading', lead: 'Lead paragraph.', para: 'Paragraph text.', quote: 'Pull quote.', callout: 'Callout text.', note: 'Note.', list: 'First item\nSecond item', table: 'Column | Column\nValue | Value', image: '', gallery: 'Caption\nCaption\nCaption', stats: '[00] | label\n[00] | label', chart: 'Label | 40\nLabel | 25', timeline: 'When | What\nWhen | What', kv: 'Key | Value', steps: 'Step | Description\nStep | Description', columns: 'Left\nText\n---\nRight\nText', toc: 'Contents', takeaways: 'Takeaway\nTakeaway', exercise: 'Prompt.', byline: 'By [Author] · [Date]', cta: 'Message.', logo: '', divider: '', spacer: '', signature: '[Name]\n[Role]', contact: '[Phone]\n[Email]' };
const EXPORT_NOTES: Record<string, string> = { png: 'Lossless image at the artwork’s exact pixel size (× resolution).', jpeg: 'Smaller file; white background.', svg: 'Vector wrapper around HTML (foreignObject) with embedded fonts — opens in browsers; design tools may not support it.', pdf: 'One page per page/slide, exact layout. Text is rasterised at 2× for print quality.', pdfprint: 'Opens your browser’s print dialog with vector text. Choose “Save as PDF”; enable background graphics.', pptx: 'Native PowerPoint. Text is editable; tables, charts and complex blocks are embedded as images.', docx: 'Editable Word file with brand styles, page breaks, tables, images and page numbers. Install Cormorant Garamond and Jost (Assets) for exact fonts. Dark page backgrounds are not carried over.', epub: 'EPUB 3 with navigation, embedded fonts and cover image. Reflowable: page layouts become chapters.', emailhtml: 'Table-based HTML with inline styles for email clients. Replace image placeholders and [link] with hosted URLs.', html: 'Self-contained HTML with embedded fonts; prints one page per sheet.', md: 'Structured Markdown of all text.', txt: 'Plain text of all content.' };

export class Editor extends Component<object, State> {
  state: State = { ready: false, err: null, theme: 'light', doc: null, sel: { page: 0, id: null }, tab: 'edit', zoom: 'fit', narrow: false, mp: 'canvas', fmt: 'png', scope: 'all', scale: 1, quality: 0.92, busy: null, exportMsg: null, exportOk: true, overflow: [], saved: true, addPageKey: 'blank', addBlockType: 'para', customW: 1080, customH: 1080, cw: 800, ch: 600, preview: false, hv: 0 };
  canvasRef = createRef<HTMLDivElement>(); fileRef = createRef<HTMLInputElement>();
  hist: string[] = []; fut: string[] = [];
  tpl: CatalogItem | null = null; key = ''; pageTpls: { v: string; l: string }[] | null = null;
  host: HTMLDivElement | null = null; ov: HTMLDivElement | null = null; handle: HTMLDivElement | null = null;
  _key: string | null = null; _sv?: ReturnType<typeof setTimeout>; _ro?: ResizeObserver;
  editing: { pi: number; id: string } | null = null; drag: Drag | null = null; imgTarget = 'item';
  lastTap = { t: 0, id: '' }; pinch: { d: number; z: number } | null = null;

  /* ---------- lifecycle ---------- */
  componentDidMount() {
    window.addEventListener('ns-theme', this.onTheme); window.addEventListener('resize', this.onResize); window.addEventListener('keydown', this.onKey); window.addEventListener('hashchange', this.onHash);
    this.onResize();
    const c = this.canvasRef.current;
    if (c) {
      this.host = document.createElement('div'); this.host.className = css.host;
      this.ov = document.createElement('div'); this.ov.className = css.overlay;
      this.handle = document.createElement('div'); this.handle.setAttribute('data-handle', '1'); this.handle.title = 'Drag to resize'; this.handle.className = css.handle;
      this.ov.appendChild(this.handle); c.appendChild(this.host); c.appendChild(this.ov);
      c.addEventListener('pointerdown', this.onDown); c.addEventListener('dblclick', this.onDbl);
      c.addEventListener('touchstart', this.onTouchStart, { passive: false }); c.addEventListener('touchmove', this.onTouchMove, { passive: false }); c.addEventListener('touchend', this.onTouchEnd);
      this._ro = new ResizeObserver(() => { const w = c.clientWidth, h = c.clientHeight; if (Math.abs(w - this.state.cw) > 2 || Math.abs(h - this.state.ch) > 2) this.setState({ cw: w, ch: h }, () => { this.paint(); this.center(this.state.sel.page, 'auto'); }); });
      this._ro.observe(c);
    }
    this.setState({ theme: getTheme() });
    this.init();
  }
  componentWillUnmount() {
    clearTimeout(this._sv); this.flushSave();
    window.removeEventListener('ns-theme', this.onTheme); window.removeEventListener('resize', this.onResize); window.removeEventListener('keydown', this.onKey); window.removeEventListener('hashchange', this.onHash);
    window.removeEventListener('pointermove', this.onMove); this._ro?.disconnect();
  }
  componentDidUpdate() { this.paint(); }
  onTheme = (e: Event) => this.setState({ theme: (e as CustomEvent<string>).detail });
  onResize = () => { const narrow = window.innerWidth < 900; if (narrow !== this.state.narrow) this.setState({ narrow }); };
  onHash = () => { this.flushSave(); this.hist = []; this.fut = []; this._key = null; this.setState({ sel: { page: 0, id: null }, zoom: 'fit', overflow: [], err: null, tab: 'edit', exportMsg: null }, () => this.init()); };

  init() {
    const q = new URLSearchParams((location.hash || '').replace(/^#/, '')); const id = q.get('t') || 'sq-announcement';
    const tpl = findTemplate(id);
    if (!tpl) { this.setState({ ready: true, err: 'Template “' + id + '” was not found. It may have been renamed.' }); return; }
    this.tpl = tpl; this.key = docKey(id);
    let doc = store.get<AnyDoc | null>(this.key, null); const slots: Record<string, string> = {};
    const title = q.get('title'), sub = q.get('subtitle');
    if (title) slots.title = title; if (sub != null && sub !== '') slots.body = sub;
    if (Object.keys(slots).length || !doc || doc.kind !== tpl.kind) { if (doc) this.hist.push(JSON.stringify(doc)); doc = freshDoc(tpl, slots); store.set(this.key, doc); this.index(doc); }
    try { if (title) history.replaceState(null, '', location.pathname + location.search + '#t=' + encodeURIComponent(id)); } catch { /* ignore */ }
    this.pageTpls = doc.kind === 'doc' ? Object.entries(D.lib[doc.type] || D.lib.email).map(([k, f]) => ({ v: k, l: f().name })) : null;
    document.title = doc.name + ' — Editor — Nonso Stitches';
    this.setState({ ready: true, doc, fmt: X.formatsFor(doc)[0][0], customW: doc.kind === 'graphic' ? doc.W : 1080, customH: doc.kind === 'graphic' ? doc.H : 1080, addPageKey: 'blank', hv: this.state.hv + 1 }, () => { this.paint(true); setTimeout(() => this.center(0, 'auto'), 30); });
  }
  fresh(slots: Record<string, string>) { return freshDoc(this.tpl!, slots); }
  index(doc: AnyDoc) { const ix = store.get<Record<string, { name: string; updated: number; kind: string }>>('ns:index', {}); ix[doc.tpl] = { name: doc.name, updated: Date.now(), kind: doc.kind }; store.set('ns:index', ix); }

  /* ---------- state helpers ---------- */
  pushHist = () => { const d = this.state.doc; if (!d) return; const s = JSON.stringify(d); if (this.hist[this.hist.length - 1] !== s) { this.hist.push(s); if (this.hist.length > 80) this.hist.shift(); this.fut = []; this.setState({ hv: this.state.hv + 1 }); } };
  setDoc(doc: AnyDoc, cb?: () => void) {
    this.setState({ doc, saved: false }, cb); clearTimeout(this._sv);
    this._sv = setTimeout(() => this.flushSave(), 400);
  }
  flushSave() { const d = this.state.doc; if (!d || this.state.saved || !this.key) return; d.updated = Date.now(); if (store.set(this.key, d)) { this.index(d); this.setState({ saved: true }); } }
  mut<T>(fn: (d: AnyDoc) => T): T { this.pushHist(); const d = clone(this.state.doc!); const r = fn(d); this.setDoc(d); return r; }
  undo = () => { if (!this.hist.length || !this.state.doc) return; this.fut.push(JSON.stringify(this.state.doc)); const d = JSON.parse(this.hist.pop()!) as AnyDoc; this.setDoc(d); this.fixSel(d); };
  redo = () => { if (!this.fut.length || !this.state.doc) return; this.hist.push(JSON.stringify(this.state.doc)); const d = JSON.parse(this.fut.pop()!) as AnyDoc; this.setDoc(d); this.fixSel(d); };
  fixSel(d: AnyDoc) { const s = this.state.sel; const page = Math.min(s.page, d.pages.length - 1); const p = d.pages[page];
    const exists = !!s.id && (d.kind === 'graphic' ? ((p as GPage).els || []).some(e => e.id === s.id) : (p as DPage).blocks.some(b => b.id === s.id));
    this.setState({ sel: { page, id: exists ? s.id : null }, hv: this.state.hv + 1 }); }
  page(): GPage | DPage | null { const d = this.state.doc; return d ? d.pages[this.state.sel.page] || null : null; }
  item(): Item | null { const p = this.page(); const id = this.state.sel.id; if (!p || !id) return null; return this.state.doc!.kind === 'graphic' ? ((p as GPage).els || []).find(e => e.id === id) || null : (p as DPage).blocks.find(b => b.id === id) || null; }
  patchItem(patch: Patch, pi?: number, id?: string | null) {
    const d = this.state.doc!; const page = pi == null ? this.state.sel.page : pi; const iid = id || this.state.sel.id; const k = d.kind === 'graphic' ? 'els' : 'blocks';
    const nd = { ...d, pages: (d.pages as (GPage | DPage)[]).map((p, j) => j !== page ? p : { ...p, [k]: ((p as unknown as Record<string, Item[]>)[k] || []).map(x => x.id === iid ? { ...x, ...patch } : x) }) } as AnyDoc;
    this.setDoc(nd);
  }
  patchPage(patch: Patch, pi?: number) { const d = this.state.doc!; const page = pi == null ? this.state.sel.page : pi; this.setDoc({ ...d, pages: (d.pages as (GPage | DPage)[]).map((p, j) => j !== page ? p : { ...p, ...patch }) } as AnyDoc); }
  patchDoc(patch: Patch) { this.setDoc({ ...this.state.doc!, ...patch } as AnyDoc); }
  setSel(sel: Sel, tab?: Tab) { this.setState({ sel, tab: tab || (sel.id ? 'edit' : this.state.tab) }); }

  /* ---------- canvas ---------- */
  zoomVal(): number { const d = this.state.doc; if (!d) return 1; if (this.state.zoom !== 'fit') return this.state.zoom; const s = R.size(d, this.state.sel.page);
    const zw = (this.state.cw - (this.state.narrow ? 32 : 96)) / s.w; const zh = d.kind === 'graphic' ? (this.state.ch - 120) / (s.h || 1) : Infinity;
    return Math.max(0.04, Math.min(d.kind === 'graphic' ? 2 : 1.25, zw, zh)); }
  paint(force?: boolean) {
    const host = this.host, d = this.state.doc; if (!host || !d || this.editing) return;
    const z = this.zoomVal(); const key = JSON.stringify([d.pages, d.kind === 'graphic' ? [d.W, d.H, d.palette] : [d.format, d.settings, d.title], z, this.state.preview, this.state.overflow, d.kind]);
    if (key !== this._key || force) {
      this._key = key;
      host.innerHTML = d.pages.map((p, i) => { const s = R.size(d, i);
        const inner = d.kind === 'graphic' ? R.graphic(d, p as GPage, { editor: !this.state.preview }) : R.docPage(d, i, { editor: true });
        return `<div class="${css.pageWrap}" style="width:${Math.round(s.w * z)}px"><div class="${css.pageLabel}">${String(i + 1).padStart(2, '0')} · ${esc(p.name || '')}${this.state.overflow.includes(i) ? ` <span class="${css.warn}">· overflow</span>` : ''}</div><div data-pw="${i}" class="${css.page}" style="${s.h ? `width:${Math.round(s.w * z)}px;height:${Math.round(s.h * z)}px;` : ''}"><div style="zoom:${z};width:${s.w}px">${inner}</div></div></div>`; }).join('');
      if (d.kind === 'doc') requestAnimationFrame(() => this.checkOverflow());
    }
    this.overlay();
  }
  checkOverflow() { if (!this.host || !this.state.doc) return; const o: number[] = [];
    this.host.querySelectorAll<HTMLElement>('[data-pw]').forEach(pw => { const b = pw.querySelector<HTMLElement>('[data-body]'); if (b && (this.state.doc as DocDoc).format !== 'email' && b.scrollHeight > b.clientHeight + 2) o.push(+pw.dataset.pw!); });
    if (JSON.stringify(o) !== JSON.stringify(this.state.overflow)) this.setState({ overflow: o }); }
  overlay() { const ov = this.ov, c = this.canvasRef.current; if (!ov || !c || !this.state.doc) return; const { sel } = this.state;
    if (this.state.preview) { ov.style.display = 'none'; return; }
    const pw = c.querySelector<HTMLElement>(`[data-pw="${sel.page}"]`);
    const t = sel.id ? pw?.querySelector<HTMLElement>(`[data-el="${CSS.escape(sel.id)}"],[data-block="${CSS.escape(sel.id)}"]`) : pw;
    if (!t) { ov.style.display = 'none'; return; } const cr = c.getBoundingClientRect(), r = t.getBoundingClientRect();
    Object.assign(ov.style, { display: 'block', left: (r.left - cr.left + c.scrollLeft) + 'px', top: (r.top - cr.top + c.scrollTop) + 'px', width: r.width + 'px', height: r.height + 'px', outlineOffset: sel.id ? '1px' : '6px', outlineStyle: sel.id ? 'solid' : 'dashed' });
    this.handle!.style.display = sel.id && this.state.doc.kind === 'graphic' ? 'block' : 'none'; }
  center(i: number, behavior?: ScrollBehavior) { const c = this.canvasRef.current; if (!c) return; const pw = c.querySelector<HTMLElement>(`[data-pw="${i}"]`); if (!pw) return;
    const cr = c.getBoundingClientRect(), r = pw.getBoundingClientRect();
    const absTop = r.top - cr.top + c.scrollTop, absLeft = r.left - cr.left + c.scrollLeft;
    const top = r.height + 48 <= c.clientHeight ? absTop + r.height / 2 - c.clientHeight / 2 : absTop - 36;
    const left = absLeft + r.width / 2 - c.clientWidth / 2;
    const far = Math.abs(c.scrollTop - top) > c.clientHeight * 3; c.scrollTo({ top: Math.max(0, top), left: Math.max(0, left), behavior: far ? 'auto' : (behavior || 'smooth') }); }
  goPage(i: number) { this.setState({ sel: { page: i, id: null }, mp: this.state.narrow ? 'canvas' : this.state.mp }, () => { this.paint(); requestAnimationFrame(() => this.center(i)); }); }

  /* pointer: select, drag to move, handle to resize (mouse, pen and touch) */
  onDown = (e: PointerEvent) => {
    if (this.editing || this.state.preview || this.pinch) return; const d = this.state.doc; if (!d) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-handle]')) { const it = this.item() as El | null; if (!it) return; this.pushHist(); this.drag = { mode: 'resize', sx: e.clientX, sy: e.clientY, x: it.x, y: it.y, w: it.w, h: it.h, id: it.id, page: this.state.sel.page, moved: false, pid: e.pointerId }; this.listen(); e.preventDefault(); return; }
    const pw = target.closest<HTMLElement>('[data-pw]'); if (!pw) { this.setSel({ page: this.state.sel.page, id: null }); return; }
    const i = +pw.dataset.pw!; let id: string | null = null;
    if (d.kind === 'graphic') { const el = target.closest<HTMLElement>('[data-el]'); if (el) id = el.dataset.el!; } else { const b = target.closest<HTMLElement>('[data-block]'); if (b) id = b.dataset.block!; }
    /* double-tap on touch = double-click */
    if (e.pointerType === 'touch' && id) { const now = Date.now(); if (now - this.lastTap.t < 350 && this.lastTap.id === id) { this.lastTap = { t: 0, id: '' }; this.onDbl(e); return; } this.lastTap = { t: now, id }; }
    this.setSel({ page: i, id }, id ? 'edit' : undefined);
    if (d.kind === 'graphic' && id) { const it = ((d.pages[i] as GPage).els || []).find(x => x.id === id); if (!it) return; this.pushHist(); this.drag = { mode: 'move', sx: e.clientX, sy: e.clientY, x: it.x, y: it.y, w: it.w, h: it.h, id, page: i, moved: false, pid: e.pointerId }; this.listen(); e.preventDefault(); }
  };
  listen() { window.addEventListener('pointermove', this.onMove); window.addEventListener('pointerup', this.onUp, { once: true }); window.addEventListener('pointercancel', this.onUp, { once: true }); }
  onMove = (e: PointerEvent) => { const g = this.drag; if (!g || e.pointerId !== g.pid) return; const z = this.zoomVal(); const dx = (e.clientX - g.sx) / z, dy = (e.clientY - g.sy) / z;
    if (!g.moved && Math.abs(dx) + Math.abs(dy) < (e.pointerType === 'touch' ? 6 : 2) / z) return; g.moved = true;
    if (g.mode === 'resize') this.patchItem({ w: Math.max(4, Math.round(g.w + dx)), h: Math.max(1, Math.round(g.h + dy)) }, g.page, g.id);
    else this.patchItem({ x: Math.round(g.x + dx), y: Math.round(g.y + dy) }, g.page, g.id); };
  onUp = () => { window.removeEventListener('pointermove', this.onMove); window.removeEventListener('pointerup', this.onUp); window.removeEventListener('pointercancel', this.onUp);
    if (this.drag && !this.drag.moved) { this.hist.pop(); this.setState({ hv: this.state.hv + 1 }); } this.drag = null; };
  /* two-finger pinch on the canvas maps to editor zoom */
  onTouchStart = (e: TouchEvent) => { if (e.touches.length === 2) { this.cancelDrag(); this.pinch = { d: this.touchDist(e), z: this.zoomVal() }; e.preventDefault(); } };
  onTouchMove = (e: TouchEvent) => { if (!this.pinch || e.touches.length !== 2) return; e.preventDefault(); const z = Math.max(0.04, Math.min(4, +(this.pinch.z * this.touchDist(e) / this.pinch.d).toFixed(3))); if (Math.abs(z - this.zoomVal()) > 0.005) this.setState({ zoom: z }); };
  onTouchEnd = (e: TouchEvent) => { if (this.pinch && e.touches.length < 2) { this.pinch = null; this.center(this.state.sel.page, 'auto'); } };
  touchDist(e: TouchEvent) { const [a, b] = [e.touches[0], e.touches[1]]; return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1; }
  cancelDrag() { if (this.drag) { if (this.drag.moved) this.undo(); else this.hist.pop(); this.drag = null; window.removeEventListener('pointermove', this.onMove); } }

  /* double-click (or double-tap) text to edit in place */
  onDbl = (e: Event) => { if (this.state.preview) return; const d = this.state.doc; if (!d) return; let node: HTMLElement | null = null; let id: string;
    const target = e.target as HTMLElement; const pw = target.closest<HTMLElement>('[data-pw]'); if (!pw) return; const pi = +pw.dataset.pw!;
    if (d.kind === 'graphic') { const el = target.closest<HTMLElement>('[data-el]'); if (!el) return; node = el.querySelector<HTMLElement>('[data-text]'); id = el.dataset.el!; }
    else { const b = target.closest<HTMLElement>('[data-block]'); if (!b) return; const blk = (d.pages[pi] as DPage).blocks.find(x => x.id === b.dataset.block); if (!blk || !INLINE_BLOCKS.includes(blk.t)) { toast('Edit this block’s content in the inspector.'); return; } node = b.querySelector<HTMLElement>('p,h1,h2,h3,h4'); id = blk.id; }
    if (!node) return; this.cancelDrag(); this.pushHist(); this.editing = { pi, id };
    try { node.contentEditable = 'plaintext-only'; } catch { node.contentEditable = 'true'; } if (node.contentEditable !== 'plaintext-only') node.contentEditable = 'true';
    node.style.outline = 'none'; node.style.cursor = 'text'; node.style.touchAction = 'auto'; node.focus();
    const rg = document.createRange(); rg.selectNodeContents(node); const s = getSelection(); s?.removeAllRanges(); s?.addRange(rg);
    const n = node;
    const done = () => { n.removeEventListener('blur', done); const text = n.innerText.replace(/\n$/, ''); this.editing = null; this.patchItem({ text }, pi, id); this._key = null; };
    n.addEventListener('blur', done); n.addEventListener('keydown', (k) => { if (k.key === 'Escape') { k.preventDefault(); n.blur(); } k.stopPropagation(); }); };

  onKey = (e: KeyboardEvent) => { const tg = e.target as HTMLElement | null; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable)) return;
    const mod = e.metaKey || e.ctrlKey; const d = this.state.doc; if (!d) return;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) this.redo(); else this.undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); this.redo(); return; }
    const it = this.item(); if (!it) { if (e.key === 'PageDown' || e.key === 'PageUp') { e.preventDefault(); this.goPage(Math.max(0, Math.min(d.pages.length - 1, this.state.sel.page + (e.key === 'PageDown' ? 1 : -1)))); } return; }
    if (tg && tg.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); this.delItem(); }
    else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); this.dupItem(); }
    else if (e.key === 'Escape') this.setSel({ page: this.state.sel.page, id: null });
    else if (d.kind === 'graphic' && e.key.startsWith('Arrow')) { e.preventDefault(); const st = e.shiftKey ? 10 : 1; this.pushHist(); const el = it as El;
      const dx = e.key === 'ArrowLeft' ? -st : e.key === 'ArrowRight' ? st : 0, dy = e.key === 'ArrowUp' ? -st : e.key === 'ArrowDown' ? st : 0; this.patchItem({ x: el.x + dx, y: el.y + dy }); } };

  /* ---------- operations ---------- */
  recount(dd: AnyDoc) { if (dd.kind === 'graphic') dd.pages.forEach((p, j) => G.counter(p, j, dd.pages.length, dd.W, dd.H, dd.palette)); }
  delItem() { const id = this.state.sel.id; if (!id) return; const pi = this.state.sel.page;
    this.mut(d => { const p = d.pages[pi] as GPage & DPage; if (d.kind === 'graphic') p.els = (p.els || []).filter(x => x.id !== id); else p.blocks = p.blocks.filter(x => x.id !== id); }); this.setSel({ page: pi, id: null }); }
  dupItem() { const it = this.item(); if (!it) return; const pi = this.state.sel.page; const graphic = this.state.doc!.kind === 'graphic'; const nid = (graphic ? 'u' : 'b') + uid();
    this.mut(d => { const p = d.pages[pi] as GPage & DPage; if (graphic) { const els = p.els || []; const i = els.findIndex(x => x.id === it.id); const e = it as El; els.splice(i + 1, 0, { ...clone(e), id: nid, x: e.x + 24, y: e.y + 24, user: true, z: Math.max(0, ...els.map(x => x.z || 0)) + 1 }); }
      else { const i = p.blocks.findIndex(x => x.id === it.id); p.blocks.splice(i + 1, 0, { ...clone(it as Block), id: nid }); } });
    this.setSel({ page: pi, id: nid }); }
  addPage(where: 'before' | 'after') { const d = this.state.doc!; const i = this.state.sel.page; const key = this.state.addPageKey || 'blank'; let np: GPage | DPage;
    if (d.kind === 'graphic') {
      if (key === 'dup') { np = clone(d.pages[i]); np.id = uid(); np.name = (np.name || 'Slide') + ' copy'; }
      else if (key.startsWith('layout:')) np = G.layoutPage({ id: uid(), name: 'Slide', layout: key.slice(7), slots: { eyebrow: 'Eyebrow', title: 'New slide title', body: 'Supporting line.', quote: 'Quote', attrib: '[Name]', stat: '[00]', opt1: 'Option', opt2: 'Option', item1: 'First point', item2: 'Second point', headA: 'This', headB: 'That', listA: 'Point', listB: 'Point', date: '[Date]' } }, d.W, d.H, d.palette);
      else np = G.blankFrame(d);
    } else np = key === 'blank' ? D.blankPage(d.format) : D.newPage(d.type, key);
    const at = where === 'before' ? i : i + 1;
    this.mut(dd => { (dd.pages as (GPage | DPage)[]).splice(at, 0, np); this.recount(dd); });
    this.setState({ sel: { page: at, id: null } }, () => setTimeout(() => this.center(at), 30)); toast('Page added at position ' + (at + 1)); }
  movePage(from: number, to: number) { const d = this.state.doc!; if (to < 0 || to >= d.pages.length || from === to) return;
    this.mut(dd => { const ps = dd.pages as (GPage | DPage)[]; const [p] = ps.splice(from, 1); ps.splice(to, 0, p); this.recount(dd); });
    this.setState({ sel: { page: to, id: null } }, () => setTimeout(() => this.center(to), 30)); }
  dupPage(i: number) { this.mut(dd => { const ps = dd.pages as (GPage | DPage)[]; const c = clone(ps[i]); c.id = uid(); c.name = (c.name || 'Page') + ' copy'; if ('blocks' in c) c.blocks.forEach(b => { b.id = 'b' + uid(); }); ps.splice(i + 1, 0, c); this.recount(dd); });
    this.setState({ sel: { page: i + 1, id: null } }, () => setTimeout(() => this.center(i + 1), 30)); }
  delPage(i: number) { const d = this.state.doc!; if (d.pages.length <= 1) { toast('A document needs at least one page.', 'error'); return; }
    this.mut(dd => { (dd.pages as (GPage | DPage)[]).splice(i, 1); this.recount(dd); });
    const n = Math.min(i, d.pages.length - 2); this.setState({ sel: { page: n, id: null } }, () => setTimeout(() => this.center(n), 30)); toast('Page deleted — Undo to restore'); }
  addEl(type: string) { const d = this.state.doc as GraphicDoc; const pg = this.page() as GPage; const P = palettes[pg.palette || d.palette]; const k = Math.sqrt(d.W * d.H) / 1080; const id = 'u' + uid();
    const cx = Math.round(d.W * 0.1), cy = Math.round(d.H * 0.4); const fs = Math.max(12, Math.round(56 * k));
    const map: Record<string, Partial<El>> = {
      heading: { t: 'text', text: 'Heading', ff: 'display', fs: Math.round(fs * 1.4), fw: 400, lh: 1.05, ls: -0.01, c: P.text, al: 'left', va: 'top', w: Math.round(d.W * 0.8), h: Math.round(fs * 1.6) },
      text: { t: 'text', text: 'Body text', ff: 'sans', fs: Math.round(fs * 0.55), fw: 400, lh: 1.45, ls: 0, c: P.text2, al: 'left', va: 'top', w: Math.round(d.W * 0.6), h: Math.round(fs * 1.2) },
      eyebrow: { t: 'text', text: 'EYEBROW', ff: 'sans', fs: Math.max(10, Math.round(22 * k)), fw: 500, up: true, ls: 0.24, lh: 1.4, c: P.accent, al: 'left', va: 'top', w: Math.round(d.W * 0.6), h: Math.round(40 * k) },
      button: { t: 'text', text: 'Book a fitting', ff: 'sans', fs: Math.max(10, Math.round(22 * k)), fw: 500, up: true, ls: 0.16, lh: 1, c: P.ctaText, bg: P.cta, r: 2, pad: Math.round(22 * k), al: 'center', va: 'middle', w: Math.round(380 * k), h: Math.round(66 * k) },
      rect: { t: 'rect', bg: P.panel, w: Math.round(d.W * 0.4), h: Math.round(d.H * 0.2) },
      image: { t: 'image', src: '', fit: 'cover', label: 'Photo', w: Math.round(d.W * 0.4), h: Math.round(d.H * 0.4) },
      logo: { t: 'logo', w: Math.max(120, Math.round(160 * k)), h: Math.max(120, Math.round(160 * k)) },
      line: { t: 'line', c: P.rule, dash: true, bw: 1, w: Math.round(d.W * 0.8), h: 1 },
      ticks: { t: 'ticks', c: P.rule, w: Math.round(d.W * 0.8), h: Math.round(16 * k) } };
    const el = { id, x: cx, y: cy, user: true, ...map[type] } as El;
    this.mut(dd => { const p = dd.pages[this.state.sel.page] as GPage; const els = p.els || (p.els = []); el.z = Math.max(0, ...els.map(e => e.z || 0)) + 1; els.push(el); });
    this.setSel({ page: this.state.sel.page, id }, 'edit');
    if (type === 'image') setTimeout(() => this.pickImage('item'), 50); }
  addBlock() { const t = this.state.addBlockType; const b: Block = { id: 'b' + uid(), t, text: BLOCK_SAMPLE[t] || '' };
    if (t === 'image') { b.ratio = '3:2'; b.label = 'Image'; } if (t === 'cta') b.btn = 'Book a fitting'; if (t === 'callout') b.label = 'Note'; if (t === 'takeaways') b.label = 'Key takeaways'; if (t === 'exercise') b.lines = 5;
    this.mut(dd => { const p = dd.pages[this.state.sel.page] as DPage; const i = this.state.sel.id ? p.blocks.findIndex(x => x.id === this.state.sel.id) : p.blocks.length - 1; p.blocks.splice(i + 1, 0, b); });
    this.setSel({ page: this.state.sel.page, id: b.id }, 'edit'); }
  moveBlock(dir: number) { const id = this.state.sel.id; this.mut(dd => { const p = dd.pages[this.state.sel.page] as DPage; const i = p.blocks.findIndex(x => x.id === id); const j = i + dir; if (j < 0 || j >= p.blocks.length) return; const [b] = p.blocks.splice(i, 1); p.blocks.splice(j, 0, b); }); }
  reorderBlock(from: number, to: number) { if (from === to) return; this.mut(dd => { const p = dd.pages[this.state.sel.page] as DPage; const [x] = p.blocks.splice(from, 1); p.blocks.splice(to, 0, x); }); }
  async loadImage(file: File): Promise<string> {
    const url = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
    const img = await new Promise<HTMLImageElement>((res, rej) => { const m = new Image(); m.onload = () => res(m); m.onerror = () => rej(new Error('That file is not a readable image.')); m.src = url; });
    const max = 2000, s = Math.min(1, max / Math.max(img.width, img.height)); if (s === 1 && file.size < 900000) return url;
    const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88); }
  pickImage = (target: string) => { this.imgTarget = target; const f = this.fileRef.current; if (f) { f.value = ''; f.click(); } };
  onFile = async (e: ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return;
    try { const src = await this.loadImage(file); const tg = this.imgTarget || 'item'; this.pushHist();
      if (tg === 'pagebg') this.patchPage({ bgSrc: src });
      else if (tg.startsWith('gallery:')) { const gi = +tg.split(':')[1]; const it = this.item() as Block; const srcs = (it.srcs || []).slice(); srcs[gi] = src; this.patchItem({ srcs }); }
      else this.patchItem({ src });
      toast('Image placed', 'success'); } catch (er) { toast((er as Error).message || 'Could not read that image.', 'error'); } };

  async exportNow(fmt: string, opt: { page?: number } = {}) { const d = this.state.doc!; this.setState({ busy: 'Preparing export…', exportMsg: null });
    try { const x = X; await x.run(d, fmt, { scale: this.state.scale, quality: this.state.quality, progress: (n, t) => this.setState({ busy: `Rendering ${n} of ${t}…` }), ...opt });
      const msg = fmt === 'pdfprint' ? 'Print dialog opened — choose “Save as PDF”.' : 'Downloaded ' + x.fname(d, opt.page != null && d.pages.length > 1 ? opt.page : null, fmt).replace(/\.\w+$/, '') + ' (' + fmt.toUpperCase() + ')';
      this.setState({ busy: null, exportMsg: msg, exportOk: true }); toast(msg, 'success'); }
    catch (er) { console.error(er); const m = 'Export failed: ' + ((er as Error)?.message || 'unknown error'); this.setState({ busy: null, exportMsg: m, exportOk: false }); toast(m, 'error'); } }
  async flowOverflow() { const d = this.state.doc as DocDoc, i = this.state.sel.page; const host = await X.mount(R.docPage(d, i), R.fmt(d).w);
    try { const body = host.querySelector<HTMLElement>('[data-body]')!; const limit = body.clientHeight - parseFloat(getComputedStyle(body).paddingBottom);
      const ids = ([...body.children] as HTMLElement[]).filter(b => b.dataset.block).filter((b, k) => k > 0 && b.offsetTop + b.offsetHeight > limit).map(b => b.dataset.block!);
      if (!ids.length) { toast('Nothing to move — try reducing a block’s size.'); return; }
      this.mut(dd => { const p = dd.pages[i] as DPage; const moved = p.blocks.filter(b => ids.includes(b.id)); p.blocks = p.blocks.filter(b => !ids.includes(b.id));
        (dd.pages as DPage[]).splice(i + 1, 0, { id: uid(), name: (p.name || 'Page').replace(/ \(cont\.\)$/, '') + ' (cont.)', layout: ['cover', 'divider', 'back'].includes(p.layout) ? 'page' : p.layout, bg: p.bg, section: p.section, blocks: moved }); });
      toast(ids.length + ' block(s) moved to page ' + (i + 2), 'success'); } finally { host.remove(); } }
  resetTpl = () => { this.pushHist(); const nd = this.fresh({}); this.setDoc(nd); this.setState({ sel: { page: 0, id: null }, zoom: 'fit' }, () => setTimeout(() => this.center(0, 'auto'), 30)); toast('Template reset to original — Undo to restore your edits'); };
  setPanel(mp: Panel) { this.setState({ mp }, () => { if (mp === 'canvas') setTimeout(() => { this.paint(true); this.center(this.state.sel.page, 'auto'); }, 30); }); }

  /* ---------- view ---------- */
  render() {
    this._fid = 0;
    const S = this.state, d = S.doc, ready = S.ready && !!d && !S.err; const narrow = S.narrow;
    const show = (p: Panel) => !narrow || S.mp === p;
    const z = ready ? this.zoomVal() : 1;
    const graphic = d?.kind === 'graphic';
    const crumb = !ready ? 'Editor' : (graphic ? 'Graphic · ' + (G.cats.find(c => c[0] === this.tpl!.cat) || ['', ''])[1] + ' · ' + (d as GraphicDoc).W + ' × ' + (d as GraphicDoc).H : (D.typeLabels[(d as DocDoc).type] || 'Document') + ' · ' + R.fmt(d as DocDoc).label);
    return (
      <div className={css.app} data-narrow={narrow || undefined}>
        <header className={css.header}>
          <a href="/templates/" title="Back to templates" className={css.back}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo/nonso-stitches-badge-120.png" alt="Nonso Stitches — back to templates" width={44} height={44} />
          </a>
          <div className={css.title}><span className={css.crumb}>{crumb}</span><span className={css.docName}>{ready ? d!.name : S.err ? 'Not found' : 'Loading…'}</span></div>
          <span role="status" className={css.saved}>{ready ? (S.saved ? 'Saved in this browser' : 'Saving…') : ''}</span>
          <div className={css.tools}>
            <div className={css.group}>
              <button type="button" className={css.tool} onClick={this.undo} disabled={!this.hist.length} title="Undo (Ctrl/Cmd+Z)">Undo</button>
              <button type="button" className={css.tool} onClick={this.redo} disabled={!this.fut.length} title="Redo (Ctrl/Cmd+Shift+Z)">Redo</button>
            </div>
            <div className={css.group}>
              <button type="button" className={`${css.tool} ${css.sq}`} aria-label="Zoom out" onClick={() => this.setState({ zoom: Math.max(0.04, +(z / 1.25).toFixed(3)) }, () => this.center(S.sel.page, 'auto'))}>−</button>
              <button type="button" className={`${css.tool} ${css.zoom}`} title="Fit to workspace" onClick={() => this.setState({ zoom: S.zoom === 'fit' ? 1 : 'fit' }, () => this.center(S.sel.page, 'auto'))}>{ready ? (S.zoom === 'fit' ? 'Fit ' : '') + Math.round(z * 100) + '%' : '—'}</button>
              <button type="button" className={`${css.tool} ${css.sq}`} aria-label="Zoom in" onClick={() => this.setState({ zoom: Math.min(4, +(z * 1.25).toFixed(3)) }, () => this.center(S.sel.page, 'auto'))}>+</button>
            </div>
            <button type="button" className={`${css.tool} ${css.caps}`} aria-pressed={S.preview} onClick={() => this.setState({ preview: !S.preview, sel: { page: S.sel.page, id: null } })}>Preview</button>
            <button type="button" className={`${css.tool} ${css.caps}`} aria-label="Switch colour theme" onClick={toggleTheme}>{S.theme === 'dark' ? 'Light' : 'Dark'}</button>
            <button type="button" className={`${css.tool} ${css.primary}`} onClick={() => this.setState({ tab: 'export', mp: narrow ? 'inspect' : S.mp })} disabled={!ready}>Export</button>
          </div>
        </header>

        {S.err && <div className={css.err}><div role="alert" className={css.errBox}>{S.err}</div><a href="/templates/">Back to the template library</a></div>}

        <div className={css.work} style={{ display: S.err ? 'none' : undefined }}>
          <aside aria-label="Pages" className={css.left} hidden={!show('pages')}>{ready && this.renderPages()}</aside>
          <main aria-label="Canvas" className={css.center} hidden={!show('canvas')}>
            <div ref={this.canvasRef} tabIndex={-1} className={css.canvas} data-preview={S.preview || undefined} data-kind={d?.kind} />
            <div className={css.status}>
              <span className={css.statusLeft}>{ready ? (graphic ? (narrow ? 'Drag to move · handle to resize · double-tap text · pinch to zoom' : 'Drag to move · handle to resize · double-click text to edit · arrows nudge') : (narrow ? 'Tap a block to select · double-tap text to edit' : 'Click a block to select · double-click text to edit · PageUp/PageDown between pages')) : ''}</span>
              <span className={css.statusRight}>{ready ? 'Page ' + (S.sel.page + 1) + ' of ' + d!.pages.length + (S.overflow.length ? ' · ' + S.overflow.length + ' page(s) overflow' : '') : ''}</span>
            </div>
          </main>
          <aside aria-label="Inspector" className={css.right} hidden={!show('inspect')}>
            <div role="tablist" className={css.tabs}>
              {([['edit', 'Edit'], ['page', 'Page'], ['doc', 'Document'], ['export', 'Export']] as [Tab, string][]).map(([v, l]) => (
                <button key={v} type="button" role="tab" aria-selected={S.tab === v} className={css.tab} onClick={() => this.setState({ tab: v })}>{l}</button>
              ))}
            </div>
            <div className={css.inspector} role="tabpanel">
              {!ready ? <p className={css.hint}>{S.err ? '' : 'Loading…'}</p>
                : S.tab === 'edit' ? this.renderEdit() : S.tab === 'page' ? this.renderPage() : S.tab === 'doc' ? this.renderDocTab() : this.renderExport()}
            </div>
          </aside>
        </div>

        {narrow && !S.err && (
          <nav aria-label="Editor panels" className={css.mobileTabs} data-dock-bottom="">
            {([['pages', 'Pages'], ['canvas', 'Canvas'], ['inspect', 'Edit']] as [Panel, string][]).map(([v, l]) => (
              <button key={v} type="button" aria-pressed={S.mp === v} onClick={() => this.setPanel(v)}>{l}{v === 'inspect' && S.sel.id ? <span className={css.dot} aria-label="(selection)" /> : null}</button>
            ))}
          </nav>
        )}
        <input ref={this.fileRef} type="file" accept="image/*" onChange={this.onFile} hidden />
      </div>
    );
  }

  /* ---------- pages panel ---------- */
  renderPages() {
    const S = this.state, d = S.doc!; const graphic = d.kind === 'graphic';
    const addOpts = graphic ? [{ v: 'blank', l: 'Blank slide' }, { v: 'dup', l: 'Copy of current slide' }, ...G.layoutChoices.map(k => ({ v: 'layout:' + k, l: 'Layout: ' + G.layouts[k].label }))] : [{ v: 'blank', l: 'Blank page' }, ...(this.pageTpls || [])];
    return (
      <>
        <div className={css.pagesHead}>
          <div className={css.row}><span className={css.kicker}>{graphic ? (d.pages.length > 1 ? 'Slides' : 'Artboard') : 'Pages'}</span><span className={css.muted}>{d.pages.length + (d.pages.length === 1 ? ' page' : ' pages')}</span></div>
          <select className={css.input} value={S.addPageKey} onChange={e => this.setState({ addPageKey: e.target.value })} aria-label="Page template">{addOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
          <div className={css.row} style={{ gap: 6 }}>
            <button type="button" className={css.btn} style={{ flex: 1 }} onClick={() => this.addPage('before')}>Insert before</button>
            <button type="button" className={`${css.btn} ${css.btnPrimary}`} style={{ flex: 1 }} onClick={() => this.addPage('after')}>Insert after</button>
          </div>
        </div>
        <DragList className={css.pageList} label="Pages — drag the grip to reorder" count={d.pages.length} onMove={(a, b) => this.movePage(a, b)}
          renderItem={(i, grip) => { const p = d.pages[i]; const s = R.size(d, i); const cur = i === S.sel.page;
            return (
              <div className={css.pageItem} data-current={cur || undefined}>
                {grip}
                <button type="button" className={css.thumb} onClick={() => this.goPage(i)} aria-label={'Go to page ' + (i + 1) + ': ' + (p.name || '')} aria-current={cur ? 'page' : undefined}>
                  <FitPreview w={s.w} h={s.h || Math.round(s.w * 0.75)} html={graphic ? R.graphic(d as GraphicDoc, p as GPage) : R.docPage(d as DocDoc, i)} />
                </button>
                <div className={css.pageMeta}>
                  <button type="button" className={css.pageName} onClick={() => this.goPage(i)} tabIndex={-1}>
                    <span className={css.muted} style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{String(i + (graphic ? 1 : ((d as DocDoc).settings.numStart || 1))).padStart(2, '0') + (graphic ? '' : ' · p.' + R.pageNum(d as DocDoc, i))}</span>
                    <span className={css.pageTitle}>{p.name || 'Page'}</span>
                    {S.overflow.includes(i) && <span className={css.warn}>Overflow</span>}
                  </button>
                  <div className={css.pageActions}>
                    <button type="button" aria-label="Move page up" title="Move up" onClick={() => this.movePage(i, i - 1)} disabled={i === 0}><Icon name="chevron-up" size={16} /></button>
                    <button type="button" aria-label="Move page down" title="Move down" onClick={() => this.movePage(i, i + 1)} disabled={i === d.pages.length - 1}><Icon name="chevron-down" size={16} /></button>
                    <button type="button" aria-label="Duplicate page" title="Duplicate" onClick={() => this.dupPage(i)}><Icon name="copy" size={16} /></button>
                    <button type="button" aria-label="Download this page as PNG" title="Download PNG" onClick={() => this.exportNow('png', { page: i })}><Icon name="download" size={16} /></button>
                    <button type="button" aria-label="Delete page" title="Delete" onClick={() => this.delPage(i)}><Icon name="trash-2" size={16} /></button>
                  </div>
                </div>
              </div>
            ); }} />
      </>
    );
  }

  /* ---------- inspector helpers ---------- */
  /* Fields are labelled with aria-labelledby so the accessible name is the label text only (a wrapping <label> would also read out the control's value). */
  _fid = 0;
  field(label: ReactNode, control: ReactNode, small = true, style?: CSSProperties, help?: ReactNode) {
    const id = 'edf' + (++this._fid);
    const ctl = isValidElement(control) ? cloneElement(control as ReactElement<Record<string, unknown>>, { 'aria-labelledby': id }) : control;
    return <label className={small ? css.field : `${css.field} ${css.fieldLg}`} style={style}><span id={id}>{label}</span>{ctl}{help && <span className={css.help}>{help}</span>}</label>;
  }
  toggles<T extends string>(cur: T, opts: [string, T][], pick: (v: T) => void, label?: string) {
    return <div className={css.toggles} role="group" aria-label={label}>{label && <span className={css.groupLabel}>{label}</span>}{opts.map(([l, v]) => <button key={v} type="button" aria-pressed={cur === v} className={css.btn} onClick={() => pick(v)}>{l}</button>)}</div>;
  }
  swatchRow(cur: string | undefined, pick: (h: string) => void, extra?: { label: string; on: boolean; pick: () => void }[], list: string[] = swatches) {
    return (
      <div className={css.swatches}>
        {(extra || []).map(x => <button key={x.label} type="button" className={css.swatch} aria-label={x.label} title={x.label} aria-pressed={x.on} onClick={x.pick}>⌀</button>)}
        {list.map(h => <button key={h} type="button" className={css.swatch} aria-label={h} title={h} aria-pressed={(cur || '').toUpperCase() === h} style={{ background: h }} onClick={() => pick(h)} />)}
      </div>
    );
  }
  hp = (fn: () => void) => () => { this.pushHist(); fn(); };
  num = (k: string, f?: (n: number) => number) => (e: ChangeEvent<HTMLInputElement>) => { const n = parseFloat(e.target.value); if (!isNaN(n)) this.patchItem({ [k]: f ? f(n) : n }); };

  renderEdit() {
    const S = this.state, d = S.doc!; const graphic = d.kind === 'graphic'; const it = this.item();
    return (
      <>
        {!it && <p className={css.hint}>{graphic ? 'Select an element on the canvas, or add one below. Double-click text to edit it in place.' : 'Select a block on the page to edit it. Use the Page tab for page settings, Document for size and numbering.'}</p>}
        {graphic && (
          <div className={css.stack}>
            <span className={css.groupLabel}>Add element</span>
            <div className={css.wrap}>{[['heading', 'Heading'], ['text', 'Text'], ['eyebrow', 'Eyebrow'], ['button', 'Button'], ['image', 'Image'], ['logo', 'Logo'], ['rect', 'Shape'], ['line', 'Stitch line'], ['ticks', 'Measure ticks']].map(([t, l]) => <button key={t} type="button" className={css.btn} onClick={() => this.addEl(t)}>{l}</button>)}</div>
          </div>
        )}
        {graphic && it && this.renderElement(it as El)}
        {!graphic && (
          <div className={css.stack}>
            <span className={css.groupLabel}>Add block after selection</span>
            <div className={css.row} style={{ gap: 6 }}>
              <select className={css.input} style={{ flex: 1 }} value={S.addBlockType} onChange={e => this.setState({ addBlockType: e.target.value as BlockType })} aria-label="Block type to add">{Object.entries(D.blockTypes).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              <button type="button" className={`${css.btn} ${css.btnPrimary}`} onClick={() => this.addBlock()}>Add</button>
            </div>
          </div>
        )}
        {!graphic && it && this.renderBlock(it as Block)}
      </>
    );
  }

  renderElement(it: El) {
    const S = this.state; const tn: Record<string, string> = { text: 'Text', image: 'Image', logo: 'Logo', rect: 'Shape', line: 'Line', ticks: 'Measure ticks', ring: 'Ring' };
    const isText = it.t === 'text', isFill = it.t === 'text' || it.t === 'rect', isLine = it.t === 'line' || it.t === 'ticks' || it.t === 'ring', isImage = it.t === 'image';
    const op = it.op == null ? 1 : it.op; const ph = (k: string) => (h: string) => { this.pushHist(); this.patchItem({ [k]: h }); };
    return (
      <>
        <div className={css.itemHead}><strong>{tn[it.t] + (it.user ? ' (added)' : '')}</strong><span>{it.id}</span></div>
        {isText && <>
          {this.field('Text', <textarea className={css.input} value={it.text || ''} rows={4} onFocus={this.pushHist} onChange={e => this.patchItem({ text: e.target.value })} />, false)}
          <div className={css.grid2}>
            {this.field('Font', <select className={css.input} value={it.ff || 'sans'} onFocus={this.pushHist} onChange={e => this.patchItem({ ff: e.target.value })}><option value="display">Cormorant Garamond</option><option value="sans">Jost</option></select>)}
            {this.field('Weight', <select className={css.input} value={String(it.fw || 400)} onFocus={this.pushHist} onChange={e => this.patchItem({ fw: +e.target.value })}><option value="300">300 Light</option><option value="400">400 Regular</option><option value="500">500 Medium</option><option value="600">600 Semibold</option></select>)}
            {this.field('Size (px)', <input className={css.input} type="number" min={6} max={600} value={it.fs ?? 16} onFocus={this.pushHist} onChange={this.num('fs', n => Math.max(1, n))} />)}
            {this.field('Line height', <input className={css.input} type="number" min={0.6} max={3} step={0.05} value={it.lh ?? 1.3} onFocus={this.pushHist} onChange={this.num('lh')} />)}
            {this.field('Letter spacing (em)', <input className={css.input} type="number" min={-0.1} max={1} step={0.01} value={it.ls ?? 0} onFocus={this.pushHist} onChange={this.num('ls')} />)}
            {this.field('Padding (px)', <input className={css.input} type="number" min={0} max={200} value={it.pad || 0} onFocus={this.pushHist} onChange={this.num('pad')} />)}
          </div>
          <div className={css.wrap}>
            <button type="button" className={css.btn} aria-pressed={!!it.it} onClick={this.hp(() => this.patchItem({ it: !it.it }))}>Italic</button>
            <button type="button" className={css.btn} aria-pressed={!!it.up} onClick={this.hp(() => this.patchItem({ up: !it.up }))}>CAPS</button>
            {([['Left', 'left'], ['Centre', 'center'], ['Right', 'right'], ['Justify', 'justify']] as [string, Align][]).map(([l, a]) => <button key={a} type="button" className={css.btn} aria-pressed={(it.al || 'left') === a} onClick={this.hp(() => this.patchItem({ al: a }))}>{l}</button>)}
          </div>
          {this.toggles<VAlign>(it.va || 'top', [['Top', 'top'], ['Middle', 'middle'], ['Bottom', 'bottom']], v => { this.pushHist(); this.patchItem({ va: v }); }, 'Vertical')}
          <div className={css.stack}><span className={css.groupLabel}>Text colour</span>{this.swatchRow(it.c, ph('c'))}
            <input key={it.id + (it.c || '')} className={css.input} defaultValue={it.c || ''} aria-label="Text colour hex" onFocus={this.pushHist} onChange={e => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) this.patchItem({ c: e.target.value }); }} /></div>
        </>}
        {isFill && <>
          <div className={css.stack}><span className={css.groupLabel}>Fill</span>{this.swatchRow(it.bg, ph('bg'), [{ label: 'No fill', on: !it.bg, pick: this.hp(() => this.patchItem({ bg: '' })) }])}</div>
          <div className={css.stack}><span className={css.groupLabel}>Border</span>{this.swatchRow(it.bd, h => { this.pushHist(); this.patchItem({ bd: h, bw: it.bw || 1 }); }, [{ label: 'No border', on: !it.bd, pick: this.hp(() => this.patchItem({ bd: '' })) }], ['#0B0A08', '#F3F4F2', '#E0B04F', '#7F8588', '#CDD1D1'])}</div>
        </>}
        {isLine && <>
          <div className={css.stack}><span className={css.groupLabel}>Line colour</span>{this.swatchRow(it.c, ph('c'))}</div>
          <label className={css.check}><input type="checkbox" checked={!!it.dash} onChange={this.hp(() => this.patchItem({ dash: !it.dash }))} /> Stitch (dashed)</label>
        </>}
        {isImage && <>
          <div className={css.wrap}><button type="button" className={css.btn} onClick={() => this.pickImage('item')}>{it.src ? 'Replace image' : 'Upload image'}</button><button type="button" className={css.btn} disabled={!it.src} onClick={this.hp(() => this.patchItem({ src: '' }))}>Remove</button></div>
          <div className={css.grid2}>
            {this.field('Fit', <select className={css.input} value={it.fit || 'cover'} onChange={e => { this.pushHist(); this.patchItem({ fit: e.target.value }); }}><option value="cover">Fill (crop)</option><option value="contain">Fit (no crop)</option></select>)}
            {this.field('Focal point', <select className={css.input} value={it.pos || '50% 50%'} onChange={e => { this.pushHist(); this.patchItem({ pos: e.target.value }); }}><option value="50% 50%">Centre</option><option value="50% 0%">Top</option><option value="50% 100%">Bottom</option><option value="0% 50%">Left</option><option value="100% 50%">Right</option></select>)}
          </div>
          {this.field('Placeholder note (art direction)', <input className={css.input} value={it.label || ''} onFocus={this.pushHist} onChange={e => this.patchItem({ label: e.target.value })} />)}
          {this.field('Alt text', <input className={css.input} value={it.alt || ''} placeholder="Garment, fabric, detail, action" onFocus={this.pushHist} onChange={e => this.patchItem({ alt: e.target.value })} />)}
        </>}
        <div className={css.grid4}>
          {this.field('X', <input className={css.input} type="number" value={it.x} onFocus={this.pushHist} onChange={this.num('x', Math.round)} />)}
          {this.field('Y', <input className={css.input} type="number" value={it.y} onFocus={this.pushHist} onChange={this.num('y', Math.round)} />)}
          {this.field('W', <input className={css.input} type="number" value={it.w} onFocus={this.pushHist} onChange={this.num('w', n => Math.max(1, Math.round(n)))} />)}
          {this.field('H', <input className={css.input} type="number" value={it.h} onFocus={this.pushHist} onChange={this.num('h', n => Math.max(1, Math.round(n)))} />)}
        </div>
        <div className={css.grid2}>
          {this.field('Opacity ' + Math.round(op * 100) + '%', <input type="range" min={0} max={1} step={0.05} value={op} onFocus={this.pushHist} onPointerDown={this.pushHist} onChange={this.num('op')} />)}
          {this.field('Rotation (°)', <input className={css.input} type="number" min={-180} max={180} value={it.rot || 0} onFocus={this.pushHist} onChange={this.num('rot')} />)}
        </div>
        <div className={css.wrap}>
          <button type="button" className={css.btn} onClick={() => this.mut(dd => { const p = dd.pages[S.sel.page] as GPage; const els = p.els || []; const e = els.find(x => x.id === it.id); if (e) e.z = Math.max(...els.map(x => x.z || 0)) + 1; })}>Bring to front</button>
          <button type="button" className={css.btn} onClick={() => this.mut(dd => { const p = dd.pages[S.sel.page] as GPage; const els = p.els || []; const e = els.find(x => x.id === it.id); if (e) e.z = Math.min(...els.map(x => x.z || 0)) - 1; })}>Send to back</button>
          <button type="button" className={css.btn} onClick={() => this.dupItem()}>Duplicate</button>
          <button type="button" className={`${css.btn} ${css.danger}`} onClick={() => this.delItem()}>Delete</button>
        </div>
      </>
    );
  }

  renderBlock(it: Block) {
    const set = (k: string, f?: (v: string) => unknown) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => this.patchItem({ [k]: f ? f(e.target.value) : e.target.value });
    const has = { label: ['callout', 'takeaways'].includes(it.t), cap: ['quote', 'chart', 'image'].includes(it.t), btn: it.t === 'cta', ord: it.t === 'list', lines: it.t === 'exercise', img: it.t === 'image', gallery: it.t === 'gallery' };
    const rows = ['para', 'list', 'table', 'kv', 'timeline', 'steps', 'columns', 'chart', 'stats', 'takeaways', 'gallery'].includes(it.t) ? 7 : 3;
    const sz = it.sz || 1, w = it.w || 1;
    return (
      <>
        <div className={css.itemHead}><strong>{D.blockTypes[it.t] || it.t}</strong><span>{this.state.narrow ? 'Double-tap text on the page to edit in place' : 'Double-click text on the page to edit in place'}</span></div>
        {this.field('Block type', <select className={css.input} value={it.t} onFocus={this.pushHist} onChange={e => this.patchItem({ t: e.target.value })}>{Object.entries(D.blockTypes).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>)}
        {this.field('Content', <textarea className={css.input} value={it.text || ''} rows={rows} onFocus={this.pushHist} onChange={set('text')} />, false, undefined, D.blockHelp[it.t] || '')}
        {has.label && this.field('Label', <input className={css.input} value={it.label || ''} onFocus={this.pushHist} onChange={set('label')} />)}
        {has.cap && this.field('Caption / attribution', <input className={css.input} value={it.cap || ''} onFocus={this.pushHist} onChange={set('cap')} />)}
        {has.btn && this.field('Button label', <input className={css.input} value={it.btn || ''} onFocus={this.pushHist} onChange={set('btn')} />)}
        {has.ord && <label className={css.check}><input type="checkbox" checked={!!it.ord} onChange={this.hp(() => this.patchItem({ ord: !it.ord }))} /> Numbered list</label>}
        {has.lines && this.field('Answer lines', <input className={css.input} type="number" min={1} max={30} value={it.lines || 5} onFocus={this.pushHist} onChange={set('lines', x => Math.max(1, Math.min(30, +x || 1)))} />)}
        {has.img && <>
          <div className={css.wrap}><button type="button" className={css.btn} onClick={() => this.pickImage('item')}>{it.src ? 'Replace image' : 'Upload image'}</button><button type="button" className={css.btn} onClick={this.hp(() => this.patchItem({ src: '' }))}>Remove image</button></div>
          <div className={css.grid2}>
            {this.field('Ratio', <select className={css.input} value={it.ratio || '3:2'} onChange={e => { this.pushHist(); this.patchItem({ ratio: e.target.value }); }}>{['16:9', '3:2', '4:3', '1:1', '4:5', '3:4', '2:3'].map(r => <option key={r} value={r}>{r}</option>)}</select>)}
            {this.field('Width ' + Math.round(w * 100) + '%', <input type="range" min={0.2} max={1} step={0.05} value={w} onFocus={this.pushHist} onPointerDown={this.pushHist} onChange={set('w', x => +x)} />)}
          </div>
          {this.field('Placeholder note', <input className={css.input} value={it.label || ''} onFocus={this.pushHist} onChange={set('label')} />)}
          {this.field('Alt text', <input className={css.input} value={it.alt || ''} onFocus={this.pushHist} onChange={set('alt')} />)}
        </>}
        {has.gallery && (
          <div className={css.stack}><span className={css.groupLabel}>Gallery images</span>
            {String(it.text || '').split('\n').filter(Boolean).map((c, gi) => <div key={gi} className={css.row} style={{ gap: 6 }}><span className={css.ellipsis}>{c}</span><button type="button" className={css.btn} onClick={() => this.pickImage('gallery:' + gi)}>{it.srcs?.[gi] ? 'Replace' : 'Upload'}</button></div>)}
          </div>
        )}
        {this.toggles<Align>(it.al || 'left', [['Left', 'left'], ['Centre', 'center'], ['Right', 'right'], ['Justify', 'justify']], a => { this.pushHist(); this.patchItem({ al: a }); }, 'Alignment')}
        {this.field('Size ' + Math.round(sz * 100) + '%', <input type="range" min={0.5} max={2.5} step={0.05} value={sz} onFocus={this.pushHist} onPointerDown={this.pushHist} onChange={set('sz', x => +x)} />)}
        <div className={css.stack}><span className={css.groupLabel}>Text colour</span>
          {this.swatchRow(it.c, h => { this.pushHist(); this.patchItem({ c: h }); }, [{ label: 'Default for page', on: !it.c, pick: this.hp(() => this.patchItem({ c: '' })) }], ['#15181A', '#51575B', '#1F2E4A', '#0B0A08', '#F3F4F2', '#E0B04F', '#B9BEC0', '#A8213A', '#2F6B4A'])}</div>
        <div className={css.wrap}>
          <button type="button" className={css.btn} onClick={() => this.moveBlock(-1)}>Move up</button>
          <button type="button" className={css.btn} onClick={() => this.moveBlock(1)}>Move down</button>
          <button type="button" className={css.btn} onClick={() => this.dupItem()}>Duplicate</button>
          <button type="button" className={`${css.btn} ${css.danger}`} onClick={() => this.delItem()}>Delete</button>
        </div>
      </>
    );
  }

  renderPage() {
    const S = this.state, d = S.doc!; const pg = this.page()!; const graphic = d.kind === 'graphic';
    const palOpts = Object.entries(palettes).map(([k, p]) => ({ v: k, l: p.label }));
    const relay = (p: GPage) => { const dd = d as GraphicDoc; return G.counter(G.layoutPage(p, dd.W, dd.H, dd.palette), S.sel.page, dd.pages.length, dd.W, dd.H, dd.palette); };
    return (
      <>
        {this.field('Page name', <input className={css.input} value={pg.name || ''} onFocus={this.pushHist} onChange={e => this.patchPage({ name: e.target.value })} />)}
        {graphic && (() => { const gp = pg as GPage; return <>
          {this.field('Layout', <select className={css.input} value={gp.layout} onChange={e => this.mut(dd => { dd.pages[S.sel.page] = relay({ ...(dd.pages[S.sel.page] as GPage), layout: e.target.value }); })}>{G.layoutChoices.map(k => <option key={k} value={k}>{G.layouts[k].label}</option>)}</select>, true, undefined, 'Changing layout keeps your text and images; manual position changes on template elements are re-laid out.')}
          {this.field('Colour variation (this page)', <select className={css.input} value={gp.palette || ''} onChange={e => this.mut(dd => { dd.pages[S.sel.page] = relay({ ...(dd.pages[S.sel.page] as GPage), palette: (e.target.value || undefined) as PaletteKey | undefined }); })}><option value="">Same as document</option>{palOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>)}
          <div className={css.stack}><span className={css.groupLabel}>Background colour</span>{this.swatchRow(gp.bg, h => { this.pushHist(); this.patchPage({ bg: h }); })}</div>
          <div className={css.wrap}>
            <button type="button" className={css.btn} onClick={() => this.pickImage('pagebg')}>Background image</button>
            <button type="button" className={css.btn} onClick={this.hp(() => this.patchPage({ bgSrc: '' }))}>Remove</button>
            <button type="button" className={css.btn} onClick={() => this.mut(dd => { dd.pages[S.sel.page] = relay(dd.pages[S.sel.page] as GPage); })}>Re-apply layout</button>
          </div>
          <div className={css.stack} style={{ gap: 4 }}><span className={css.groupLabel}>Layers (top first)</span>
            {(gp.els || []).slice().sort((a, b) => (b.z || 0) - (a.z || 0)).map(e => (
              <div key={e.id} className={css.layer} data-current={e.id === S.sel.id || undefined}>
                <button type="button" className={css.layerName} onClick={() => this.setSel({ page: S.sel.page, id: e.id }, 'edit')}>{(e.t === 'text' ? '“' + String(e.text).slice(0, 28) + '”' : e.t === 'image' ? 'Image — ' + (e.label || '') : e.t) + (e.user ? ' ·added' : '')}</button>
                <button type="button" className={css.btn} onClick={this.hp(() => this.patchItem({ hidden: !e.hidden }, S.sel.page, e.id))}>{e.hidden ? 'Show' : 'Hide'}</button>
              </div>
            ))}
          </div>
        </>; })()}
        {!graphic && (() => { const dp = pg as DPage; return <>
          <div className={css.grid2}>
            {this.field('Page layout', <select className={css.input} value={dp.layout} onFocus={this.pushHist} onChange={e => this.patchPage({ layout: e.target.value as PageLayout })}>{[['page', 'Text page'], ['cover', 'Cover'], ['divider', 'Divider / opener'], ['back', 'Back cover'], ['slide', 'Slide'], ['email', 'Email section']].map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>)}
            {this.field('Background', <select className={css.input} value={dp.bg} onFocus={this.pushHist} onChange={e => this.patchPage({ bg: e.target.value })}>{palOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>)}
          </div>
          {this.toggles<VAlign>(dp.va || 'top', [['Top', 'top'], ['Middle', 'middle'], ['Bottom', 'bottom']], a => { this.pushHist(); this.patchPage({ va: a }); }, 'Vertical position of content')}
          <label className={css.check}><input type="checkbox" checked={!!dp.hideNum} onChange={this.hp(() => this.patchPage({ hideNum: !dp.hideNum }))} /> Hide page number on this page</label>
          <label className={css.check}><input type="checkbox" checked={!!dp.hideHeader} onChange={this.hp(() => this.patchPage({ hideHeader: !dp.hideHeader }))} /> Hide running header on this page</label>
          {this.field('Running header (right side)', <input className={css.input} value={dp.section || ''} placeholder="e.g. Chapter 1" onFocus={this.pushHist} onChange={e => this.patchPage({ section: e.target.value })} />)}
          {S.overflow.includes(S.sel.page) && <div role="alert" className={css.alert}>Content on this page is clipped at the bottom margin.<button type="button" className={`${css.btn} ${css.btnPrimary}`} onClick={() => this.flowOverflow()}>Move overflow to a new page</button></div>}
          <div className={css.stack} style={{ gap: 2 }}><span className={css.groupLabel}>Blocks — drag to reorder</span>
            <DragList className={css.blockList} label="Blocks" count={dp.blocks.length} onMove={(a, b) => this.reorderBlock(a, b)}
              renderItem={(bi, grip) => { const b = dp.blocks[bi]; return (
                <div className={css.layer} data-current={b.id === S.sel.id || undefined}>{grip}
                  <button type="button" className={css.layerName} onClick={() => this.setSel({ page: S.sel.page, id: b.id }, 'edit')}><span className={css.muted} style={{ fontSize: 11, marginRight: 6 }}>{D.blockTypes[b.t] || b.t}</span>{String(b.text || b.label || '').split('\n')[0].slice(0, 40)}</button>
                </div>); }} />
          </div>
        </>; })()}
      </>
    );
  }

  renderDocTab() {
    const S = this.state, d = S.doc!; const tpl = this.tpl!;
    if (d.kind === 'graphic' && tpl.kind === 'graphic') {
      const idx = tpl.sizes.findIndex(s => s[1] === d.W && s[2] === d.H); const pg = this.page() as GPage;
      const labels: Record<string, string> = { eyebrow: 'Eyebrow', title: 'Title', body: 'Body / subtitle', cta: 'Button', quote: 'Quote', attrib: 'Attribution', meta: 'Details', stat: 'Statistic', date: 'Date', brandname: 'Brand name' };
      return (
        <>
          {this.field('Size', <select className={css.input} value={idx >= 0 ? String(idx) : 'custom'} onChange={e => { if (e.target.value === 'custom') return; const s = tpl.sizes[+e.target.value]; this.pushHist(); this.setDoc(G.relayout(d, s[1], s[2], d.palette), () => { this.setState({ customW: s[1], customH: s[2], zoom: 'fit' }); setTimeout(() => this.center(S.sel.page, 'auto'), 30); }); toast('Resized to ' + s[1] + ' × ' + s[2] + ' — text and images kept'); }}>
            {tpl.sizes.map((s, i) => <option key={i} value={String(i)}>{s[0] + ' — ' + s[1] + ' × ' + s[2]}</option>)}{idx < 0 && <option value="custom">{'Custom — ' + d.W + ' × ' + d.H}</option>}</select>)}
          <div className={css.row} style={{ gap: 6, alignItems: 'flex-end' }}>
            {this.field('Width', <input className={css.input} type="number" min={50} max={6000} value={S.customW} onChange={e => this.setState({ customW: +e.target.value })} />, true, { flex: 1 })}
            {this.field('Height', <input className={css.input} type="number" min={50} max={6000} value={S.customH} onChange={e => this.setState({ customH: +e.target.value })} />, true, { flex: 1 })}
            <button type="button" className={css.btn} onClick={() => { const W = Math.round(S.customW), H = Math.round(S.customH); if (!(W >= 50 && H >= 50 && W <= 6000 && H <= 6000)) { toast('Enter a width and height between 50 and 6000 px.', 'error'); return; } this.pushHist(); this.setDoc(G.relayout(d, W, H, d.palette), () => this.setState({ zoom: 'fit' })); }}>Apply</button>
          </div>
          <div className={css.stack}><span className={css.groupLabel}>Colour variation</span>
            <div className={css.wrap}>{tpl.variants.map(k => <button key={k} type="button" className={`${css.btn} ${css.variant}`} aria-pressed={d.palette === k} onClick={() => { this.pushHist(); this.setDoc(G.relayout(d, d.W, d.H, k)); }}><span style={{ background: palettes[k].bg }} />{palettes[k].label}</button>)}</div>
          </div>
          <div className={css.stack} style={{ borderTop: '1px solid var(--ui-strong)', paddingTop: 12, gap: 10 }}><span className={css.groupLabel}>Content on this page</span>
            {(pg.els || []).filter(e => e.t === 'text' && e.id !== 'counter').map(e => this.field(<span key={e.id + 'l'}>{labels[e.id] || (e.user ? 'Added text' : e.id)}</span>, <textarea className={css.input} rows={2} value={e.text || ''} onFocus={this.pushHist} onChange={ev => this.patchItem({ text: ev.target.value }, S.sel.page, e.id)} />, true))}
          </div>
          {this.renderReset()}
        </>
      );
    }
    const dd = d as DocDoc; const st = dd.settings;
    return (
      <>
        {this.field('Document title (running header, metadata)', <input className={css.input} value={dd.title} onFocus={this.pushHist} onChange={e => this.patchDoc({ title: e.target.value })} />)}
        {this.field('Author', <input className={css.input} value={dd.author} onFocus={this.pushHist} onChange={e => this.patchDoc({ author: e.target.value })} />)}
        {this.field('Page size', <select className={css.input} value={dd.format} onChange={e => { this.pushHist(); this.patchDoc({ format: e.target.value }); this.setState({ zoom: 'fit' }); }}>{(D.typeFormats[dd.type] || [dd.format]).map(k => <option key={k} value={k}>{D.formats[k].label + ' (' + D.formats[k].mm + ')'}</option>)}</select>)}
        <label className={css.check}><input type="checkbox" checked={!!st.numbers} onChange={this.hp(() => this.patchDoc({ settings: { ...st, numbers: !st.numbers } }))} /> Page numbers</label>
        <div className={css.grid2}>
          {this.field('First page number', <input className={css.input} type="number" min={-50} max={999} value={st.numStart || 1} onFocus={this.pushHist} onChange={e => { const n = parseInt(e.target.value, 10); if (!isNaN(n)) this.patchDoc({ settings: { ...st, numStart: n } }); }} />)}
          {this.field('Position', <select className={css.input} value={st.numPos || 'center'} onChange={e => { this.pushHist(); this.patchDoc({ settings: { ...st, numPos: e.target.value } }); }}><option value="center">Bottom centre</option><option value="outside">Bottom outside edge</option></select>)}
        </div>
        <label className={css.check}><input type="checkbox" checked={!!st.header} onChange={this.hp(() => this.patchDoc({ settings: { ...st, header: !st.header } }))} /> Running header</label>
        {this.renderReset()}
      </>
    );
  }
  renderReset() {
    return <div className={css.stack} style={{ borderTop: '1px solid var(--ui-border)', paddingTop: 12 }}><button type="button" className={css.btn} onClick={this.resetTpl}>Reset to original template</button><span className={css.help}>Restores the template’s original content and layout. You can undo it.</span></div>;
  }

  renderExport() {
    const S = this.state, d = S.doc!; const fo = X.formatsFor(d); const graphic = d.kind === 'graphic';
    return (
      <>
        {this.field('Format', <select className={css.input} value={S.fmt} onChange={e => this.setState({ fmt: e.target.value, exportMsg: null })}>{fo.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>)}
        {X.isPerPage(S.fmt) && <>
          {this.toggles<'current' | 'all'>(S.scope, [['Current page', 'current'], ['All pages' + (d.pages.length > 1 ? ' (ZIP)' : ''), 'all']], v => this.setState({ scope: v }), 'Pages')}
          {this.toggles<string>(String(S.scale), ([1, 2, 3] as const).map(k => [k + '×' + (graphic ? ' · ' + d.W * k + '×' + d.H * k : ''), String(k)] as [string, string]), v => this.setState({ scale: +v }), 'Resolution')}
        </>}
        {S.fmt === 'jpeg' && this.field('JPEG quality ' + Math.round(S.quality * 100) + '%', <input type="range" min={0.5} max={1} step={0.01} value={S.quality} onChange={e => this.setState({ quality: +e.target.value })} />)}
        <p className={css.hint} style={{ fontSize: 13 }}>{EXPORT_NOTES[S.fmt] || ''}</p>
        <button type="button" className={`${css.btn} ${css.btnPrimary} ${css.big}`} disabled={!!S.busy} onClick={() => this.exportNow(S.fmt, X.isPerPage(S.fmt) && S.scope === 'current' ? { page: S.sel.page } : {})}>{S.busy || 'Export ' + ((fo.find(f => f[0] === S.fmt) || ['', ''])[1])}</button>
        {S.exportMsg && <div className={css.msg} data-ok={S.exportOk}>{S.exportMsg}</div>}
        <div className={css.stack} style={{ borderTop: '1px solid var(--ui-border)', paddingTop: 12 }}>
          <button type="button" className={css.btn} onClick={() => copy(X.md(d), 'all text as Markdown')}>Copy all text (Markdown)</button>
        </div>
      </>
    );
  }
}
