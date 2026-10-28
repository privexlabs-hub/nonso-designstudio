/* Renderers: graphic artboards + document pages → HTML strings (same output for editor, previews and export). Port of lib/ns-render.js. */
import { palettes, esc, LOGO } from './core';
import * as D from './docs';
import { cache } from './runtime';
import type { El, Block, GPage, GraphicDoc, DocDoc, AnyDoc, Palette, PaletteKey, Format } from './types';

/** Font stacks used inside artwork (must match the self-hosted @font-face families). */
export const FF: Record<'display' | 'sans', string> = {display:"'Cormorant Garamond', Garamond, 'Times New Roman', serif", sans:"'Jost', 'Futura', 'Century Gothic', system-ui, sans-serif"};
const woven = (place: string) => `background-color:${place};box-shadow:inset 0 0 0 1px rgba(81,87,91,.18);`; /* solid fill: repeating gradients are too costly when artboards are scaled down */
export const logoSrc = () => cache.logoData || LOGO;
const placeholder = (label: string | undefined, place: string, txt: string, fs: number) => `<div style="${woven(place)}width:100%;height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:8%;box-sizing:border-box"><span style="font-family:${FF.sans};font-weight:500;font-size:${fs}px;letter-spacing:.14em;text-transform:uppercase;color:${txt};line-height:1.5;max-width:90%">${esc(label||'Photo')}</span></div>`;

/* ---------- graphics ---------- */
export interface ElCtx { editor?: boolean; P: Palette; W: number }
export const el = (e: El, ctx: ElCtx): string => {
  const st = `position:absolute;left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;z-index:${e.z||0};${e.op!=null&&e.op!==1?`opacity:${e.op};`:''}${e.rot?`transform:rotate(${e.rot}deg);`:''}box-sizing:border-box;`;
  const attr = ctx.editor ? ` data-el="${esc(e.id)}"` : '';
  if (e.t === 'text') {
    const jc = e.va==='middle'?'center':e.va==='bottom'?'flex-end':'flex-start';
    const box = `${e.bg?`background:${e.bg};`:''}${e.bd?`border:${e.bw||1}px solid ${e.bd};`:''}${e.bt?`border-top:1px solid ${e.bt};padding-top:${Math.round((e.fs||16)*0.55)}px;`:''}${e.pad?`padding:${e.pad}px;`:''}${e.r?`border-radius:${e.r}px;`:''}`;
    const ts = `margin:0;font-family:${FF[e.ff||'sans']||FF.sans};font-size:${e.fs}px;font-weight:${e.fw||400};${e.it?'font-style:italic;':''}line-height:${e.lh||1.3};letter-spacing:${e.ls||0}em;${e.up?'text-transform:uppercase;':''}color:${e.c};text-align:${e.al||'left'};white-space:pre-wrap;overflow-wrap:break-word;`;
    return `<div${attr} style="${st}display:flex;flex-direction:column;justify-content:${jc};${box}"><div data-text style="${ts}">${esc(e.text)}</div></div>`;
  }
  if (e.t === 'image') {
    const inner = e.src ? `<img src="${esc(e.src)}" alt="${esc(e.alt||e.label||'')}" style="display:block;width:100%;height:100%;object-fit:${e.fit||'cover'};object-position:${e.pos||'50% 50%'}">` : placeholder(e.label, ctx.P.place, ctx.P.text2, Math.max(10,Math.round(Math.min(e.w,e.h)*0.032)));
    return `<div${attr} style="${st}overflow:hidden;${e.r?`border-radius:${e.r}px;`:''}">${inner}</div>`;
  }
  if (e.t === 'logo') return `<div${attr} style="${st}background:#0B0A08"><img src="${esc(logoSrc())}" alt="Nonso Stitches" style="display:block;width:100%;height:100%"></div>`;
  if (e.t === 'rect') { if (e.guide && !ctx.editor) return ''; return `<div${attr} style="${st}${e.bg?`background:${e.bg};`:''}${e.bd?`border:${e.bw||1}px ${e.dashBd?'dashed':'solid'} ${e.bd};`:''}${e.r?`border-radius:${e.r}px;`:''}${e.guide?'pointer-events:none;':''}"></div>`; }
  if (e.t === 'line') { const s = Math.max(1, Math.round(ctx.W/1080)); const horiz = e.w >= e.h; const bw = e.bw||1; const g = e.dash ? `repeating-linear-gradient(${horiz?90:180}deg,${e.c} 0 ${6*s}px,transparent ${6*s}px ${10*s}px)` : e.c;
    return `<div${attr} style="${st}${horiz?`height:${Math.max(e.h,bw)}px;`:''}"><div style="${horiz?`width:100%;height:${bw}px;`:`width:${bw}px;height:100%;`}background:${g}"></div></div>`; }
  if (e.t === 'ticks') return `<div${attr} style="${st}"><div style="position:absolute;inset:0 0 50% 0;background:repeating-linear-gradient(90deg,${e.c} 0 1px,transparent 1px 8px)"></div><div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,${e.c} 0 1px,transparent 1px 40px)"></div></div>`;
  if (e.t === 'ring') return `<div${attr} style="${st}border:${e.bw||2}px solid ${e.c};border-radius:50%"></div>`;
  return '';
};
export interface RenderOpts { editor?: boolean }
export const graphic = (doc: GraphicDoc, page: GPage, opts: RenderOpts = {}): string => { const P = palettes[page.palette||doc.palette] || palettes.ink; const ctx = {editor:opts.editor, P, W:doc.W};
  const els = (page.els||[]).slice().sort((a,b)=>(a.z||0)-(b.z||0)).filter(e=>!e.hidden);
  const bgImg = page.bgSrc ? `background-image:url('${esc(page.bgSrc)}');background-size:cover;background-position:center;` : '';
  return `<div data-artboard style="position:relative;width:${doc.W}px;height:${doc.H}px;overflow:hidden;background-color:${page.bg||P.bg};${bgImg}font-family:${FF.sans}">${els.map(e=>el(e,ctx)).join('')}</div>`; };

/* ---------- documents ---------- */
const pal = (k: PaletteKey) => palettes[k] || palettes.paper;
export const fmt = (doc: { format: string }): Format => D.formats[doc.format] || D.formats.a4;
export const pageNum = (doc: DocDoc, i: number) => i + (doc.settings.numStart||1);
export const rows = (t: unknown) => String(t||'').split('\n').filter(l=>l.trim()!=='');
export const cells = (l: string) => l.split('|').map(s=>s.trim());
export interface BlockCtx { P: Palette; s: number; doc: DocDoc; editor?: boolean; wide?: boolean; center?: boolean }
export const block = (b: Block, ctx: BlockCtx): string => {
  const {P, s, doc} = ctx; const al = b.al ? `text-align:${b.al};` : ''; const sz = (b.sz||1); const f = (px: number) => Math.round(px*s*sz*100)/100;
  const col = b.c || P.text; const attr = ctx.editor ? ` data-block="${esc(b.id)}"` : ` data-block="${esc(b.id)}"`;
  const self = b.al==='center'?'align-self:center;':b.al==='right'?'align-self:flex-end;':'';
  const txt = (px: number, extra?: string) => `margin:0;font-size:${f(px)}px;color:${col};${al}white-space:pre-wrap;overflow-wrap:break-word;${b.al==='justify'?'text-wrap:wrap;':''}${extra||''}`;
  const eb = (t: string, c?: string) => `<div style="font-family:${FF.sans};font-weight:500;font-size:${Math.max(8,f(10))}px;letter-spacing:.24em;text-transform:uppercase;color:${c||P.accent};line-height:1.4;${al}">${esc(t)}</div>`;
  const W = (inner: string, gap?: number) => `<div${attr} data-bt="${b.t}" style="display:flex;flex-direction:column;gap:${gap||0}px;flex:none">${inner}</div>`;
  switch (b.t) {
    case 'eyebrow': return W(`<p style="${txt(10,`font-family:${FF.sans};font-weight:500;letter-spacing:.24em;text-transform:uppercase;line-height:1.4;color:${b.c||P.accent}`)}">${esc(b.text)}</p>`);
    case 'title': return W(`<h1 style="${txt(50,`font-family:${FF.display};font-weight:400;line-height:1.02;letter-spacing:-.015em;text-wrap:balance`)}">${esc(b.text)}</h1>`);
    case 'subtitle': return W(`<p style="${txt(21,`font-family:${FF.display};font-style:italic;line-height:1.3;color:${b.c||P.text2}`)}">${esc(b.text)}</p>`);
    case 'h1': return W(`<h2 style="${txt(32,`font-family:${FF.display};font-weight:500;line-height:1.08;letter-spacing:-.005em;text-wrap:balance`)}">${esc(b.text)}</h2>`);
    case 'h2': return W(`<h3 style="${txt(23,`font-family:${FF.display};font-weight:500;line-height:1.15`)}">${esc(b.text)}</h3>`);
    case 'h3': return W(`<h4 style="${txt(14.5,`font-family:${FF.sans};font-weight:500;line-height:1.3;letter-spacing:.005em`)}">${esc(b.text)}</h4>`);
    case 'lead': return W(`<p style="${txt(16.5,`font-family:${FF.sans};font-weight:400;line-height:1.55`)}">${esc(b.text)}</p>`);
    case 'para': return W(`<p style="${txt(13,`font-family:${FF.sans};line-height:1.65;${b.al==='justify'?'':'text-wrap:pretty'}`)}">${esc(b.text)}</p>`);
    case 'note': case 'byline': case 'contact': return W(`<p style="${txt(b.t==='note'?10.5:11.5,`font-family:${FF.sans};line-height:1.55;letter-spacing:.02em;color:${b.c||P.text2}`)}">${esc(b.text)}</p>`);
    case 'quote': return W(`<div style="border-top:1px solid ${P.rule};border-bottom:1px solid ${P.rule};padding:${f(18)}px 0;display:flex;flex-direction:column;gap:${f(10)}px"><p style="${txt(23,`font-family:${FF.display};font-style:italic;line-height:1.25;text-wrap:balance`)}">${esc(b.text)}</p>${b.cap?eb(b.cap,P.text2):''}</div>`);
    case 'callout': case 'takeaways': { const body = b.t==='takeaways' ? rows(b.text).map((l,i)=>`<div style="display:flex;gap:${f(12)}px;align-items:baseline"><span style="font-family:${FF.sans};font-weight:500;font-size:${f(11)}px;color:${P.accent};min-width:${f(20)}px">${String(i+1).padStart(2,'0')}</span><span style="${txt(12.5,`font-family:${FF.sans};line-height:1.55`)}">${esc(l)}</span></div>`).join('') : `<p style="${txt(13,`font-family:${FF.sans};line-height:1.6`)}">${esc(b.text)}</p>`;
      return W(`<div style="background:${P.panel};border-top:1px solid ${P.text};padding:${f(18)}px ${f(20)}px;display:flex;flex-direction:column;gap:${f(10)}px">${eb(b.label||(b.t==='takeaways'?'Key takeaways':'Note'))}${body}</div>`); }
    case 'list': return W(rows(b.text).map((l,i)=>`<div style="display:flex;gap:${f(12)}px;align-items:baseline;padding:${f(4)}px 0"><span style="font-family:${FF.sans};font-weight:500;font-size:${f(b.ord?10.5:13)}px;color:${P.accent};min-width:${f(b.ord?20:10)}px;flex:none">${b.ord?String(i+1).padStart(2,'0'):'–'}</span><span style="${txt(13,`font-family:${FF.sans};line-height:1.55`)}">${esc(l)}</span></div>`).join(''));
    case 'table': { const rs = rows(b.text).map(cells); if (!rs.length) return W(''); return W(`<table style="width:100%;border-collapse:collapse;font-family:${FF.sans};font-size:${f(11.5)}px;font-variant-numeric:tabular-nums;color:${col}">${rs.map((r,i)=>`<tr>${r.map(c=>i===0?`<th style="text-align:left;font-weight:500;padding:${f(7)}px ${f(8)}px ${f(7)}px 0;border-bottom:1px solid ${P.text}">${esc(c)}</th>`:`<td style="padding:${f(7)}px ${f(8)}px ${f(7)}px 0;border-bottom:1px solid ${P===palettes.ink||P===palettes.indigo?'#33363A':'#CDD1D1'};vertical-align:top">${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`); }
    case 'image': { const [rw,rh] = String(b.ratio||'3:2').split(':').map(Number); const w = b.w ? `width:${b.w*100}%;` : 'width:100%;';
      const inner = b.src ? `<img src="${esc(b.src)}" alt="${esc(b.alt||b.cap||'')}" style="display:block;width:100%;height:100%;object-fit:${b.fit||'cover'}">` : placeholder(b.label||'Image', P.place, P.text2, f(9));
      return W(`<div style="${w}${self}aspect-ratio:${rw}/${rh};overflow:hidden">${inner}</div>${b.cap?`<p style="margin:0;font-family:${FF.sans};font-size:${f(10.5)}px;line-height:1.45;letter-spacing:.02em;color:${P.text2};${al}">${esc(b.cap)}</p>`:''}`, f(8)); }
    case 'gallery': { const caps = rows(b.text); const n = Math.max(1, caps.length); const srcs = b.srcs||[];
      return W(`<div style="display:grid;grid-template-columns:repeat(${Math.min(n,3)},minmax(0,1fr));gap:${f(8)}px">${caps.map((c,i)=>`<div style="display:flex;flex-direction:column;gap:${f(6)}px"><div style="aspect-ratio:1/1;overflow:hidden">${srcs[i]?`<img src="${esc(srcs[i])}" alt="${esc(c)}" style="display:block;width:100%;height:100%;object-fit:cover">`:placeholder(c,P.place,P.text2,f(8))}</div><span style="font-family:${FF.sans};font-size:${f(10)}px;color:${P.text2}">${esc(c)}</span></div>`).join('')}</div>`); }
    case 'stats': { const rs = rows(b.text).map(cells); return W(`<div style="display:grid;grid-template-columns:repeat(${Math.max(1,rs.length)},minmax(0,1fr));gap:${f(16)}px">${rs.map(r=>`<div style="border-top:1px solid ${P.text};padding-top:${f(10)}px"><div style="font-family:${FF.display};font-size:${f(40)}px;line-height:1;color:${col}">${esc(r[0])}</div><div style="font-family:${FF.sans};font-size:${f(11)}px;line-height:1.4;color:${P.text2};margin-top:${f(6)}px">${esc(r[1]||'')}</div></div>`).join('')}</div>`); }
    case 'chart': { const rs = rows(b.text).map(cells).map((r): [string, number]=>[r[0], parseFloat(r[1])||0]); const mx = Math.max(1, ...rs.map(r=>r[1]));
      return W(`<div style="display:flex;flex-direction:column;gap:${f(9)}px">${rs.map(r=>`<div style="display:grid;grid-template-columns:${f(130)}px 1fr ${f(36)}px;gap:${f(10)}px;align-items:center;font-family:${FF.sans};font-size:${f(11)}px;color:${col}"><span>${esc(r[0])}</span><div style="height:${f(14)}px;background:${P.place}"><div style="height:100%;width:${(r[1]/mx*100).toFixed(1)}%;background:${P.text}"></div></div><span style="text-align:right;font-variant-numeric:tabular-nums">${r[1]}</span></div>`).join('')}${b.cap?`<p style="margin:0;font-family:${FF.sans};font-size:${f(10)}px;color:${P.text2}">${esc(b.cap)}</p>`:''}</div>`); }
    case 'timeline': case 'kv': { const rs = rows(b.text).map(cells); const kv = b.t==='kv'; return W(rs.map(r=>`<div style="display:grid;grid-template-columns:${kv?'minmax(0,2fr) minmax(0,3fr)':f(110)+'px 1fr'};gap:${f(14)}px;padding:${f(8)}px 0;border-bottom:1px solid ${P===palettes.ink||P===palettes.indigo?'#33363A':'#CDD1D1'};font-family:${FF.sans};font-size:${f(12)}px;line-height:1.45"><span style="color:${kv?P.text2:P.accent};${kv?'':'font-weight:500;'}">${esc(r[0])}</span><span style="color:${col}">${esc(r.slice(1).join(' | '))}</span></div>`).join('')); }
    case 'steps': { const rs = rows(b.text).map(cells); return W(`<div style="display:grid;grid-template-columns:repeat(${Math.min(rs.length,ctx.wide?4:2)},minmax(0,1fr));gap:${f(18)}px">${rs.map((r,i)=>`<div style="border-top:1px solid ${P.text};padding-top:${f(10)}px;display:flex;flex-direction:column;gap:${f(6)}px"><span style="font-family:${FF.display};font-size:${f(28)}px;line-height:1;color:${P.accent}">${String(i+1).padStart(2,'0')}</span><span style="font-family:${FF.sans};font-weight:500;font-size:${f(13)}px;color:${col}">${esc(r[0])}</span><span style="font-family:${FF.sans};font-size:${f(11.5)}px;line-height:1.5;color:${P.text2}">${esc(r[1]||'')}</span></div>`).join('')}</div>`); }
    case 'columns': { const cs = String(b.text).split(/\n---\n/); return W(`<div style="display:grid;grid-template-columns:repeat(${cs.length},minmax(0,1fr));gap:${f(24)}px">${cs.map(c=>{ const [h,...r] = c.split('\n'); return `<div style="border-top:1px solid ${P.text};padding-top:${f(10)}px"><div style="font-family:${FF.sans};font-weight:500;font-size:${f(13.5)}px;color:${col};margin-bottom:${f(6)}px">${esc(h)}</div><div style="font-family:${FF.sans};font-size:${f(12.5)}px;line-height:1.6;color:${P.text2};white-space:pre-wrap">${esc(r.join('\n'))}</div></div>`; }).join('')}</div>`); }
    case 'toc': { const hs = D.headings(doc); return W(`${eb(b.text||'Contents')}<div style="display:flex;flex-direction:column;margin-top:${f(14)}px">${hs.map(h=>`<div style="display:flex;align-items:baseline;gap:${f(8)}px;padding:${f(h.lvl?5:9)}px 0 ${f(h.lvl?5:3)}px ${h.lvl?f(14):0}px;font-family:${h.lvl?FF.sans:FF.display};font-size:${f(h.lvl?12.5:17)}px;color:${col}"><span>${esc(h.text)}</span><span style="flex:1;border-bottom:1px dotted ${P.text2};transform:translateY(-3px)"></span><span style="font-family:${FF.sans};font-size:${f(11)}px;font-variant-numeric:tabular-nums">${pageNum(doc,h.page)}</span></div>`).join('')}</div>`); }
    case 'exercise': return W(`<p style="${txt(13,`font-family:${FF.sans};line-height:1.6`)}">${esc(b.text)}</p>${Array.from({length:b.lines||5}).map(()=>`<div style="height:${f(28)}px;border-bottom:1px solid ${P.text2}"></div>`).join('')}`, f(4));
    case 'cta': { const dark = P===palettes.ink||P===palettes.indigo; return W(`${b.text?`<p style="${txt(14,`font-family:${FF.sans};line-height:1.55`)}">${esc(b.text)}</p>`:''}<span style="${self}display:inline-flex;align-items:center;justify-content:center;height:${f(36)}px;padding:0 ${f(20)}px;background:${dark?'#F3F4F2':'#0B0A08'};color:${dark?'#0B0A08':'#F3F4F2'};font-family:${FF.sans};font-weight:500;font-size:${f(10.5)}px;letter-spacing:.16em;text-transform:uppercase;border-radius:2px;width:max-content">${esc(b.btn||'Book a fitting')}</span>`, f(12)); }
    case 'logo': { const px = Math.max(120, Math.round(140*s*sz)); return W(`<img src="${esc(logoSrc())}" alt="Nonso Stitches" style="display:block;width:${px}px;height:${px}px;${b.al==='center'||ctx.center?'align-self:center;':b.al==='right'?'align-self:flex-end;':''}">`); }
    case 'divider': return W(`<div style="height:1px;background:repeating-linear-gradient(90deg,${P.rule} 0 6px,transparent 6px 10px)"></div>`);
    case 'spacer': return W(`<div style="height:${f(12)}px"></div>`);
    case 'signature': return W(`<div style="height:${f(30)}px"></div><p style="${txt(12,`font-family:${FF.sans};line-height:1.6;border-top:1px solid ${P.text};padding-top:${f(8)}px;max-width:60%`)}">${esc(b.text)}</p>`);
    default: return W(`<p style="${txt(13,`font-family:${FF.sans}`)}">${esc(b.text)}</p>`);
  }
};
export const docPage = (doc: DocDoc, i: number, opts: RenderOpts = {}): string => { const p = doc.pages[i]; const fm = fmt(doc); const P = pal(p.bg); const s = fm.base; const m = fm.m; const email = doc.format==='email'; const slide = (doc.format||'').startsWith('slide');
  const ctx = {P, s, doc, editor:opts.editor, wide: slide, center: p.layout==='cover'&&p.va==='middle'};
  const jc = p.va==='middle'?'center':p.va==='bottom'?'flex-end':'flex-start';
  const showHead = !email && !slide && p.layout==='page' && doc.settings.header && !p.hideHeader;
  const showNum = !email && doc.settings.numbers && !p.hideNum && !['cover','back'].includes(p.layout);
  const num = pageNum(doc, i); const outside = doc.settings.numPos==='outside'; const even = num % 2 === 0;
  const pad = email ? `${32}px ${m}px` : p.layout==='page'||p.layout==='slide' ? `${m+(showHead?Math.round(m*0.25):0)}px ${m}px ${m}px` : `${Math.round(m*1.1)}px`;
  const gap = Math.round((slide?14:12)*s);
  const blocks = p.blocks.map(b=>block(b,ctx)).join('');
  const head = showHead ? `<div style="position:absolute;left:${m}px;right:${m}px;top:${Math.round(m*0.5)}px;display:flex;justify-content:space-between;font-family:${FF.sans};font-weight:500;font-size:${Math.round(8.5*s*10)/10}px;letter-spacing:.2em;text-transform:uppercase;color:${P.text2}"><span>${esc(doc.title)}</span><span>${esc(p.section||'')}</span></div>` : '';
  const foot = showNum ? `<div style="position:absolute;left:${m}px;right:${m}px;bottom:${Math.round(m*0.45)}px;display:flex;justify-content:${slide?'flex-end':outside?(even?'flex-start':'flex-end'):'center'};font-family:${FF.sans};font-size:${Math.round(10*s*10)/10}px;font-variant-numeric:tabular-nums;color:${P.text2}">${num}</div>` : '';
  const H = email ? 'auto' : fm.h+'px';
  return `<div data-page="${esc(p.id)}" style="position:relative;width:${fm.w}px;height:${H};${email?'min-height:40px;':''}background:${P.bg};color:${P.text};overflow:hidden;box-sizing:border-box;font-family:${FF.sans}">${head}<div data-body style="${email?'position:relative;':`position:absolute;inset:0;`}padding:${pad};display:flex;flex-direction:column;justify-content:${jc};gap:${gap}px;box-sizing:border-box;overflow:hidden">${blocks}</div>${foot}</div>`; };
export const docAll = (doc: DocDoc) => doc.pages.map((p,i)=>docPage(doc,i)).join('');

/* ---------- unified ---------- */
export const page = (doc: AnyDoc, i: number, opts?: RenderOpts): string => doc.kind === 'graphic' ? graphic(doc, doc.pages[i], opts) : docPage(doc, i, opts);
export const size = (doc: AnyDoc, _i?: number): { w: number; h: number | null } => { if (doc.kind === 'graphic') return {w:doc.W, h:doc.H}; const fm = fmt(doc); return {w:fm.w, h:fm.h||null}; };
