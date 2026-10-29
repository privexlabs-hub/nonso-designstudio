'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudioHeader } from '@/components/shell/StudioHeader';
import { FitPreview } from '@/components/shell/FitPreview';
import { editorHref, store } from '@/lib/core';
import { toast } from '@/lib/toast';
import * as G from '@/lib/graphics';
import * as D from '@/lib/docs';
import * as R from '@/lib/render';
import * as X from '@/lib/export';
import { catalog, categories, docFor, docKey, type CatalogItem } from '@/lib/catalog';
import { notifyStore, useHydrated, useStoreVersion } from '@/lib/useStorage';
import css from './TemplateLibrary.module.css';

const channels = G.templates.filter(t => t.cat === 'editorial').map(t => ({ v: t.id, l: t.name + ' — ' + t.sizes[0][1] + '×' + t.sizes[0][2] }));
const graphicsN = catalog.filter(t => t.kind === 'graphic').length;
const sizesN = catalog.reduce((a, t) => a + (t.kind === 'graphic' ? t.sizes.length : 1), 0);
const summary = `${catalog.length} templates (${graphicsN} graphics, ${catalog.length - graphicsN} documents and emails) across ${categories.length} categories and ${sizesN} size variants, each with five colour variations. Open any template to edit it — changes save in this browser and every export uses your edited version.`;

export function TemplateLibrary() {
  const router = useRouter();
  const hydrated = useHydrated();
  const version = useStoreVersion('ns:doc:');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [bulkFmt, setBulkFmt] = useState('png');
  const [busy, setBusy] = useState<string | null>(null);
  const [art, setArt] = useQState();

  const ql = q.trim().toLowerCase();
  const shown = catalog.filter(t => (cat === 'all' || t.cat === cat) && (!ql || (t.name + ' ' + t.id + ' ' + t.cat + ' ' + (t.kind === 'doc' ? t.type : '')).toLowerCase().includes(ql)));
  const nSel = Object.values(sel).filter(Boolean).length;

  /* working docs + previews (browser only: saved edits live in localStorage, fresh docs use random ids) */
  const cards = useMemo(() => {
    if (!hydrated) return null;
    const out: Record<string, { doc: ReturnType<typeof docFor>['doc']; edited: boolean; w: number; h: number; html: string }> = {};
    for (const t of catalog) { const { doc, edited } = docFor(t); const s = R.size(doc, 0); out[t.id] = { doc, edited, w: s.w, h: s.h || Math.round(s.w * 1.4), html: R.page(doc, 0) }; }
    return out;
  }, [hydrated, version]); // eslint-disable-line react-hooks/exhaustive-deps

  /* phones/tablets that can share files get a Share button ("Save to Photos", WhatsApp…) */
  const canShare = useMemo(() => hydrated && X.canShareFiles() && matchMedia('(pointer: coarse)').matches, [hydrated]);
  const shareOne = async (t: CatalogItem) => {
    const { doc } = docFor(t); const fmt = t.kind === 'graphic' ? 'png' : 'pdf'; toast('Preparing ' + t.name + '…');
    try { if (await X.runShare(doc, fmt)) toast('Shared ' + t.name, 'success'); } catch (e) { toast('Share failed: ' + (e as Error).message, 'error'); }
  };
  const exportOne = async (t: CatalogItem) => {
    const { doc } = docFor(t); const fmt = t.kind === 'graphic' ? 'png' : 'pdf'; toast('Preparing ' + t.name + '…');
    try { await X.run(doc, fmt); toast('Downloaded ' + t.name, 'success'); } catch (e) { toast('Export failed: ' + (e as Error).message, 'error'); }
  };
  const bulk = async () => {
    const ids = Object.keys(sel).filter(k => sel[k]); if (!ids.length) return;
    let docs = ids.map(id => catalog.find(t => t.id === id)).filter((t): t is CatalogItem => !!t).map(t => docFor(t).doc);
    if (bulkFmt === 'docx') docs = docs.filter(d => d.kind === 'doc' && d.format !== 'email');
    if (!docs.length) { toast('Word export applies to documents only — select a document.', 'error'); return; }
    setBusy('Starting…');
    try { await X.bulk(docs, bulkFmt, (n, tot) => setBusy(n + ' / ' + tot)); toast('ZIP downloaded with ' + docs.length + ' item(s)', 'success'); }
    catch (e) { toast('Bulk export failed: ' + (e as Error).message, 'error'); }
    setBusy(null);
  };
  const reset = (t: CatalogItem) => {
    const old = store.get(docKey(t.id), null); store.del(docKey(t.id)); store.set('ns:trash:' + t.id, old); notifyStore();
    toast(t.name + ' reset. Your previous version is kept in this browser until the next reset.');
  };
  const genArticle = (e: React.FormEvent) => {
    e.preventDefault(); const title = art.title.trim(); if (!title) { toast('Enter an article title first.', 'error'); return; }
    router.push('/editor/#t=' + encodeURIComponent(art.channel) + '&title=' + encodeURIComponent(title) + '&subtitle=' + encodeURIComponent(art.sub.trim()));
  };

  return (
    <div className="s-page">
      <StudioHeader current="templates" />
      <main id="main" className={css.main}>
        <div className={css.top}>
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <p className="s-eyebrow">Template library</p>
            <h1 className="s-h1" style={{ marginBottom: 12 }}>Every format, on brand.</h1>
            <p className="s-muted" style={{ margin: 0, fontSize: 16, lineHeight: 1.6, maxWidth: '60ch' }}>{summary}</p>
          </div>
          <form id="banner-generator" onSubmit={genArticle} aria-label="Article banner generator" className={css.gen}>
            <strong style={{ fontSize: 16, fontWeight: 500 }}>Article banner generator</strong>
            <label className="s-field"><span id="gen-title">Article title</span><input aria-labelledby="gen-title" className="s-input" value={art.title} onChange={e => setArt({ title: e.target.value })} required placeholder="How a suit should fit you" style={{ background: 'var(--ui-bg)' }} /></label>
            <label className="s-field"><span id="gen-sub">Subtitle <span className="s-muted" style={{ fontWeight: 400 }}>(optional)</span></span><input aria-labelledby="gen-sub" className="s-input" value={art.sub} onChange={e => setArt({ sub: e.target.value })} placeholder="Five checks to do in the mirror" style={{ background: 'var(--ui-bg)' }} /></label>
            <div className={css.genRow}>
              <label className="s-field" style={{ flex: '1 1 220px' }}><span id="gen-channel">Channel</span><select aria-labelledby="gen-channel" className="s-select" value={art.channel} onChange={e => setArt({ channel: e.target.value })} style={{ background: 'var(--ui-bg)' }}>{channels.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}</select></label>
              <button type="submit" className="s-btn" style={{ height: 44 }}>Generate</button>
            </div>
          </form>
        </div>

        <div className={css.filters}>
          <div className={css.pills} role="group" aria-label="Filter by category">
            {[{ k: 'all', l: 'All', count: catalog.length }, ...categories.map(c => ({ k: c.k, l: c.l, count: catalog.filter(t => t.cat === c.k).length }))].map(c => (
              <button key={c.k} type="button" aria-pressed={cat === c.k} className={css.pill} onClick={() => setCat(c.k)}>{c.l} <span>{c.count}</span></button>
            ))}
          </div>
          <input type="search" className={`s-input ${css.search}`} value={q} onChange={e => setQ(e.target.value)} aria-label="Search templates" placeholder="Search templates" />
        </div>

        <div className={css.bulk} role="region" aria-label="Bulk export" data-dock-bottom="">
          <span className={css.selLabel}>{nSel ? nSel + ' selected' : 'Select templates for bulk export'}</span>
          <button type="button" className="s-btn s-btn--quiet s-btn--sm s-btn--plain" onClick={() => setSel(s => { const n = { ...s }; shown.forEach(t => { n[t.id] = true; }); return n; })}>Select all shown</button>
          <button type="button" className="s-btn s-btn--quiet s-btn--sm s-btn--plain" onClick={() => setSel({})}>Clear</button>
          <div className={css.bulkRight}>
            <select className="s-select" value={bulkFmt} onChange={e => setBulkFmt(e.target.value)} aria-label="Bulk export format" style={{ minHeight: 36, width: 'auto' }}>
              <option value="png">PNG (all pages)</option><option value="jpeg">JPEG (all pages)</option><option value="pdf">PDF (one per item)</option><option value="html">HTML</option><option value="md">Markdown</option><option value="txt">Plain text</option><option value="docx">Word (documents only)</option>
            </select>
            <button type="button" className="s-btn s-btn--md" style={{ height: 36 }} onClick={bulk} disabled={!nSel || !!busy}>{busy ? 'Exporting ' + busy : 'Export ZIP'}</button>
          </div>
        </div>

        {categories.map(c => { const items = shown.filter(t => t.cat === c.k); if (!items.length) return null; return (
          <section key={c.k} className={css.group} aria-labelledby={'cat-' + c.k}>
            <div className={css.groupHead}><h2 id={'cat-' + c.k} className="s-h2">{c.l}</h2><span className="s-muted" style={{ fontSize: 13 }}>{c.sub}</span></div>
            <div className={css.grid}>
              {items.map(t => { const card = cards?.[t.id]; const doc = card?.doc; const w = card?.w || 1080, h = card?.h || 1080; const ar = w / h;
                const meta = !doc ? '' : doc.kind === 'graphic' && t.kind === 'graphic'
                  ? (t.sizes.length > 1 ? t.sizes.length + ' sizes · ' : '') + doc.W + ' × ' + doc.H + (doc.pages.length > 1 ? ' · ' + doc.pages.length + ' slides' : '')
                  : doc.kind === 'doc' ? (D.typeLabels[doc.type] || '') + ' · ' + doc.pages.length + ' pages · ' + R.fmt(doc).label : '';
                return (
                  <article key={t.id} className={css.card}>
                    <a href={editorHref(t.id)} aria-label={'Edit ' + t.name} className={css.thumb} data-selected={!!sel[t.id]}>
                      <div style={{ maxWidth: ar < 0.7 ? '62%' : ar < 1 ? '80%' : '100%', margin: '0 auto' }}><FitPreview w={w} h={h} html={card?.html || ''} /></div>
                    </a>
                    <div className={css.info}>
                      <input type="checkbox" checked={!!sel[t.id]} onChange={() => setSel(s => ({ ...s, [t.id]: !s[t.id] }))} aria-label={'Select ' + t.name + ' for bulk export'} className={css.check} />
                      <div className={css.infoText}>
                        <a href={editorHref(t.id)} className={css.name}>{t.name}</a>
                        <span className="s-muted" style={{ fontSize: 12 }}>{meta}</span>
                        {card?.edited && <span className={css.edited}>Edited</span>}
                      </div>
                    </div>
                    <div className={css.actions}>
                      <a href={editorHref(t.id)} className="s-btn s-btn--sm">Edit</a>
                      <button type="button" className="s-btn s-btn--quiet s-btn--sm s-btn--plain" onClick={() => exportOne(t)}>{t.kind === 'graphic' ? (doc && doc.pages.length > 1 ? 'PNG (ZIP)' : 'PNG') : 'PDF'}</button>
                      {canShare && <button type="button" className="s-btn s-btn--quiet s-btn--sm s-btn--plain" aria-label={'Share ' + t.name} onClick={() => shareOne(t)}>Share</button>}
                      {card?.edited && <button type="button" className="s-btn s-btn--quiet s-btn--sm s-btn--plain" style={{ color: 'var(--ui-text-2)', borderColor: 'var(--ui-border)' }} onClick={() => reset(t)}>Reset</button>}
                    </div>
                  </article>
                ); })}
            </div>
          </section>
        ); })}
        {!shown.length && <p className="s-muted" style={{ fontSize: 16 }}>No templates match “{q}”. Try another word, or choose All.</p>}
      </main>
    </div>
  );
}

/** Article generator form state. */
function useQState() {
  const [s, set] = useState({ title: '', sub: '', channel: 'ed-x-article' });
  return [s, (p: Partial<typeof s>) => set(o => ({ ...o, ...p }))] as const;
}
