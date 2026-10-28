'use client';
import { useState } from 'react';
import { StudioHeader } from '@/components/shell/StudioHeader';
import { copy } from '@/lib/core';
import { toast } from '@/lib/toast';
import { zipFiles } from '@/lib/export';
import css from './AssetLibrary.module.css';

interface Asset { path: string; name: string; meta: string; use: string; img: boolean; glyph: string; bg: string; fg: string; font: string; fstyle: string; max: string }
const L = '/assets/logo/', A = '/assets/avatars/', F = '/assets/fonts/', M = '/assets/motifs/';
const it = (path: string, name: string, meta: string, use: string, o?: Partial<Asset>): Asset =>
  ({ path, name, meta, use, img: true, glyph: '', bg: 'var(--ns-ink)', fg: 'var(--ui-text)', font: 'inherit', fstyle: 'normal', max: '80%', ...o });
const font = (glyph: string, family: string, o?: Partial<Asset>): Partial<Asset> => ({ img: false, glyph, bg: 'var(--ui-sunken)', font: family, ...o });

const groups: { title: string; note: string; items: Asset[] }[] = [
  { title: 'Logo', note: 'The supplied badge (only version) and resampled PNG sizes. Use as supplied on ink; on light grounds as a square ink tile.', items: [
    it(L + 'nonso-stitches-badge-primary.jpg', 'Primary badge — master', 'JPEG · 1254 × 1254 · supplied', 'Source for every other size. Print, large digital.'),
    it(L + 'nonso-stitches-badge-1024.png', 'Badge 1024', 'PNG · 1024 × 1024', 'Large digital, presentations.'),
    it(L + 'nonso-stitches-badge-512.png', 'Badge 512', 'PNG · 512 × 512', 'Web, documents, PWA icon.'),
    it(L + 'nonso-stitches-badge-400.png', 'Badge 400', 'PNG · 400 × 400', 'Profile images.'),
    it(L + 'nonso-stitches-badge-120.png', 'Badge 120 (minimum)', 'PNG · 120 × 120', 'Smallest full-badge size; below this use tile + typeset name.')] },
  { title: 'Favicon & app icons', note: 'Resampled from the master. A 16–32 px favicon needs a simplified vector mark and is not provided.', items: [
    it(L + 'nonso-stitches-badge-192.png', 'Android / manifest icon', 'PNG · 192 × 192', '<link rel="icon" sizes="192x192">'),
    it(L + 'nonso-stitches-badge-180.png', 'Apple touch icon', 'PNG · 180 × 180', '<link rel="apple-touch-icon">'),
    it(L + 'nonso-stitches-badge-512.png', 'PWA splash icon', 'PNG · 512 × 512', 'Web app manifest.')] },
  { title: 'Avatars', note: 'Square profile images — platforms apply their own circular crop. Editable versions live in Templates → Avatars.', items: [
    it(A + 'avatar-ink-full.png', 'Ink — full bleed', 'PNG · 400 × 400', 'Instagram, WhatsApp Business, X.'),
    it(A + 'avatar-ink-padded.png', 'Ink — padded', 'PNG · 400 × 400', 'Platforms with tight circular crops.'),
    it(A + 'avatar-chalk-tile.png', 'Chalk tile', 'PNG · 400 × 400', 'Light-themed platforms.', { bg: 'var(--ns-chalk)' }),
    it(A + 'avatar-indigo-tile.png', 'Indigo tile', 'PNG · 400 × 400', 'Campaign or community profiles.', { bg: 'var(--ns-indigo)' })] },
  { title: 'Fonts & licences', note: 'Self-hosted WOFF2 (latin + latin-ext, includes ₦). SIL Open Font License 1.1 — free to use, embed and redistribute; not for sale on their own.', items: [
    it(F + 'cormorant-garamond-latin.woff2', 'Cormorant Garamond', 'WOFF2 · 400/500/600 · latin', 'Display, headings, quotes.', font('Aa', 'var(--font-display)')),
    it(F + 'cormorant-garamond-latin-ext.woff2', 'Cormorant Garamond ext.', 'WOFF2 · latin-ext (₦)', 'Extended characters.', font('₦ Ẹ', 'var(--font-display)')),
    it(F + 'cormorant-garamond-italic-latin.woff2', 'Cormorant Garamond Italic', 'WOFF2 · 400/500 italic', 'Pull quotes, subtitles.', font('Aa', 'var(--font-display)', { fstyle: 'italic' })),
    it(F + 'cormorant-garamond-italic-latin-ext.woff2', 'Cormorant Garamond Italic ext.', 'WOFF2 · latin-ext', 'Extended italics.', font('Ẹ', 'var(--font-display)', { fstyle: 'italic' })),
    it(F + 'jost-latin.woff2', 'Jost', 'WOFF2 · 300–600 · latin', 'Body, UI, labels.', font('Aa', 'var(--font-sans)')),
    it(F + 'jost-latin-ext.woff2', 'Jost ext.', 'WOFF2 · latin-ext (₦)', 'Prices, extended characters.', font('₦85,000', 'var(--font-sans)')),
    it(F + 'LICENCES.md', 'Font licences', 'Markdown', 'Copyright and OFL 1.1 references.', font('OFL', 'var(--font-sans)'))] },
  { title: 'Motifs & template graphics', note: 'The graphic language: 1 px strokes, one device per composition.', items: [
    it(M + 'stitch-line.svg', 'Stitch line', 'SVG · 1 px, 6 on / 4 off', 'Dividers, quote rules.', { bg: 'var(--ns-chalk)' }),
    it(M + 'stitch-line-gold-on-ink.svg', 'Stitch line — gold on ink', 'SVG', 'Dividers on dark grounds.'),
    it(M + 'measure-ticks.svg', 'Measure ticks', 'SVG · 8 / 40 px', 'Statistics, measurement content.', { bg: 'var(--ns-chalk)' }),
    it(M + 'crop-marks.svg', 'Pattern-draft crop marks', 'SVG · 400 × 400', 'Corners of editorial image frames.', { bg: 'var(--ns-chalk)', max: '60%' })] },
  { title: 'Backgrounds & textures', note: 'Flat brand fields only — no gradients. The woven grid is for image placeholders.', items: [
    it(M + 'woven-grid.svg', 'Woven placeholder grid', 'SVG tile · 4 × 4', 'Background of empty image slots.', { bg: 'var(--ns-grey-200)', max: '24px' })] },
];
const allPaths = [...new Set(groups.flatMap(g => g.items.map(i => i.path)))];
const zipName = (title: string) => 'nonso-stitches-' + title.toLowerCase().replace(/[^a-z]+/g, '-') + '.zip';

export function AssetLibrary() {
  const [busy, setBusy] = useState<string | null>(null);
  const zip = async (paths: string[], name: string) => {
    setBusy(name);
    try { await zipFiles(paths, name); toast('Downloaded ' + name, 'success'); }
    catch (e) { toast((e as Error).message, 'error'); }
    setBusy(null);
  };
  const allName = 'nonso-stitches-brand-assets.zip';
  return (
    <div className="s-page">
      <StudioHeader current="assets" />
      <main id="main" className="s-main">
        <p className="s-eyebrow">Asset library</p>
        <h1 className="s-h1">Brand files, in one place.</h1>
        <p className="s-lead">Every asset the studio, templates and exports use lives in <code>assets/</code>. Derived sizes are straight resamples of the supplied badge — nothing redrawn.</p>
        <div className="s-row" style={{ marginBottom: 24 }}>
          <button type="button" className="s-btn" onClick={() => zip(allPaths, allName)} disabled={!!busy} aria-busy={busy === allName}>{busy === allName ? 'Preparing ZIP…' : 'Download all assets (ZIP)'}</button>
        </div>
        <div role="note" className="s-note" style={{ marginBottom: 48 }}><strong>Not available yet.</strong> A vector logo master, monochrome / reversed / transparent versions, a horizontal lockup, a 16–32 px favicon mark and woven-label artwork. These need the original designer’s source files. Photography: none supplied — templates use labelled placeholders. Icons: Lucide is used as a substitute set.</div>
        {groups.map(g => (
          <section key={g.title} className={css.group} aria-labelledby={'g-' + g.title}>
            <div className="s-section-head">
              <div><h2 id={'g-' + g.title} className="s-h2" style={{ marginBottom: 4 }}>{g.title}</h2><p className="s-muted" style={{ margin: 0, fontSize: 14, maxWidth: '70ch' }}>{g.note}</p></div>
              <button type="button" className="s-btn s-btn--outline s-btn--md" disabled={!!busy} onClick={() => zip(g.items.map(i => i.path), zipName(g.title))}>{busy === zipName(g.title) ? 'Preparing ZIP…' : 'Download group (ZIP)'}</button>
            </div>
            <div className={css.grid}>
              {g.items.map(a => (
                <article key={a.path + a.name} className={css.card}>
                  <div className={css.preview} style={{ background: a.bg, fontFamily: a.font, fontStyle: a.fstyle }}>
                    {a.img ? <span role="img" aria-label={a.name} className={css.img} style={{ width: a.max, backgroundImage: `url('${a.path}')` }} />
                      : <span style={{ color: a.fg }}>{a.glyph}</span>}
                  </div>
                  <div className={css.body}>
                    <strong className={css.name}>{a.name}</strong>
                    <span className={css.meta}>{a.meta}</span>
                    <span className={css.meta} style={{ lineHeight: 1.45 }}>{a.use}</span>
                    <div className={css.actions}>
                      <a className="s-btn s-btn--sm" href={a.path} download={a.path.split('/').pop()}>Download</a>
                      <button type="button" className="s-btn s-btn--quiet s-btn--sm s-btn--plain" onClick={() => copy(a.path.slice(1), a.path.slice(1))}>Copy path</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        <section className="s-rule-top">
          <h2 className="s-h2" style={{ marginBottom: 12 }}>Directory</h2>
          <pre className="s-pre">{`assets/
  logo/      nonso-stitches-badge-primary.jpg  (supplied master, 1254 px)
             nonso-stitches-badge-{1024,512,400,192,180,120}.png
  avatars/   avatar-{ink-full,ink-padded,chalk-tile,indigo-tile}.png  (400 px)
  fonts/     cormorant-garamond-*.woff2 · jost-*.woff2 · LICENCES.md
  motifs/    stitch-line.svg · stitch-line-gold-on-ink.svg · measure-ticks.svg · crop-marks.svg · woven-grid.svg
src/lib/     core.ts (tokens) · voice.ts · graphics.ts · docs.ts · render.ts · export.ts
src/styles/  ds/*.css (design-system tokens + components) · theme.css · studio.css`}</pre>
        </section>
      </main>
    </div>
  );
}
