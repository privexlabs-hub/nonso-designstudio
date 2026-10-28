'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { StudioHeader } from '@/components/shell/StudioHeader';
import { DocsLayout, DocSection } from '@/components/shell/DocsLayout';
import { FitPreview } from '@/components/shell/FitPreview';
import { Alert, Badge, Button, Checkbox, Icon, ProgressSteps, ServiceCard, TestimonialCard, TextField } from '@/components/ds';
import * as core from '@/lib/core';
import { copy, colorFormats, contrast, verdict, editorHref, version } from '@/lib/core';
import * as G from '@/lib/graphics';
import * as D from '@/lib/docs';
import * as R from '@/lib/render';
import { useHydrated } from '@/lib/useStorage';
import css from './DesignSystem.module.css';

const sections: [string, string][] = [['overview', 'Overview'], ['logo', 'Logo'], ['colour', 'Colour'], ['type', 'Type'], ['spacing', 'Spacing'], ['radius', 'Radius & Shadow'], ['motif', 'Motif'], ['voice', 'Voice'], ['components', 'Components'], ['slides', 'Slides'], ['uikits', 'UI Kits'], ['governance', 'Governance']];
const principles = [
  { n: '01', t: 'The garment leads', d: 'Photography gets the largest area; type frames it.' },
  { n: '02', t: 'Measured, not decorated', d: 'Hairlines, grids and numbered sequences replace ornament.' },
  { n: '03', t: 'Gold is a thread', d: 'Used sparingly and almost always on ink.' },
  { n: '04', t: 'Two registers', d: 'Expressive for campaigns; informational for services and forms.' },
  { n: '05', t: 'Both audiences, always', d: 'Men’s and women’s clothing together, as the logo does.' }];
const ratios = [{ label: '4:5', ar: '4/5', w: 120, use: 'portraits' }, { label: '1:1', ar: '1/1', w: 120, use: 'details' }, { label: '3:2', ar: '3/2', w: 170, use: 'process' }, { label: '3:4', ar: '3/4', w: 110, use: 'editorial' }, { label: '9:16', ar: '9/16', w: 84, use: 'stories' }];
const icons = ['ruler', 'scissors', 'shirt', 'calendar', 'clock', 'map-pin', 'phone', 'mail', 'message-circle', 'check', 'circle-check', 'circle-alert', 'triangle-alert', 'info', 'arrow-right', 'chevron-down', 'menu', 'x', 'plus', 'minus'];
const chartDemo: [string, number][] = [['Made to measure', 40], ['Alterations', 32], ['Construction', 18], ['Personalised', 10]];
const voiceEx = [{ k: 'Headline', t: 'Made to fit you.' }, { k: 'Service line', t: 'Trousers too long? Waist too loose? Bring them in.' }, { k: 'Button', t: 'Book a fitting · Chat on WhatsApp' }, { k: 'Error', t: 'Enter a phone or WhatsApp number we can reach, e.g. 0803 123 4567.' }, { k: 'Confirmation', t: 'Thank you, Adaeze. We’ll message you on WhatsApp to arrange your fitting.' }, { k: 'Not us', t: 'Unparalleled luxury couture for the discerning elite.' }];
const governance = [
  { t: 'Ownership', items: ['The business owner approves logo use, new colours and any public claim.', 'Design tokens change only in src/styles/ds/*.css and src/lib/core.ts together.', 'Templates are reset-able to their original configuration at any time.'] },
  { t: 'Before publishing', items: ['Replace every [placeholder] with a confirmed fact.', 'Check contrast pairs against the approved list.', 'Logo ≥ 120 px or tile + typeset name.', 'One graphic device per composition.'] },
  { t: 'Never', items: ['Gold text on light grounds, gold gradients or metallic effects.', 'Cream, beige, terracotta or coral.', 'Emoji in brand copy; “couture”, “elite”, “exquisite”.', 'Redrawn, recoloured, cropped or rotated logo.'] },
  { t: 'Accessibility', items: ['Text 4.5:1 (3:1 for display only); functional borders 3:1.', 'Visible focus on every interactive element.', 'Status = icon + words + colour.', 'Touch targets ≥ 44 px; inputs 16 px.'] },
  { t: 'Versioning', items: ['Semantic versions: major for token changes, minor for new templates.', 'Record changes in the change log with date and reason.', 'Exported files keep the template name and size in the filename.'] },
  { t: 'Open items', items: ['Vector logo master, mono and reversed versions.', 'Favicon (16–32 px) simplified mark.', 'Confirmed contact details, prices, turnaround times.', 'Real photography to replace placeholders.'] }];

const cp = (v: string, l?: string) => () => copy(v, l || v);
const colorGroups = (() => {
  const groups: Record<string, (core.ColorToken & { fmt: ReturnType<typeof colorFormats>; fg: string; contrastLabel: string })[]> = {};
  core.colors.forEach(c => {
    const fmt = colorFormats(c.hex); const cw = contrast(c.hex, '#FFFFFF'), ck = contrast(c.hex, '#0B0A08');
    (groups[c.group] = groups[c.group] || []).push({ ...c, fmt, fg: cw > ck ? '#FFFFFF' : '#0B0A08', contrastLabel: (cw > ck ? cw : ck).toFixed(1) + ':1 vs ' + (cw > ck ? 'white' : 'ink') });
  });
  return Object.entries(groups);
})();
const typeCss = (t: core.TypeStyle) => `font-family:${t.font === 'display' ? 'var(--font-display)' : 'var(--font-sans)'};font-size:var(${t.token});font-weight:${t.weight};${t.italic ? 'font-style:italic;' : ''}line-height:${t.lh};letter-spacing:${t.ls};${t.upper ? 'text-transform:uppercase;' : ''}`;
const lgImg = (src: string, alt: string, style: React.CSSProperties) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt={alt} style={{ display: 'block', ...style }} />
);

export function DesignSystem() {
  const hydrated = useHydrated();
  /* previews use random ids, so they are built in the browser only */
  const previews = useMemo(() => {
    if (!hydrated) return null;
    const slideDoc = D.create(D.templates.find(t => t.id === 'doc-presentation')!);
    return {
      slides: slideDoc.pages.slice(0, 12).map((p, i) => ({ id: p.id, name: p.name, num: String(i + 1).padStart(2, '0'), html: R.docPage(slideDoc, i) })),
      web: G.templates.filter(t => t.cat === 'web').map(t => { const d = G.create(t); return { id: t.id, name: t.name + ' · desktop', W: d.W, H: d.H, html: R.graphic(d, d.pages[0]) }; }),
    };
  }, [hydrated]);

  return (
    <div className="s-page">
      <StudioHeader current="ds" />
      <DocsLayout title="Design system" label="Sections" sections={sections}>
        <DocSection id="overview" kicker="01 · Overview" title="The cutting table." h1 first
          intro={<span style={{ fontSize: 18 }}>One system for every surface: this studio, the website, social graphics, documents and print. The logo brings the gold and the ceremony; everything around it stays quiet and precise — chalk, ink, graphite, a thread of gold.</span>}>
          <div className="d-grid d-tiles" style={{ ['--min' as string]: '220px' }}>
            {principles.map(p => <div key={p.n} className="d-tile" style={{ padding: 20, gap: 8 }}><span className={css.num}>{p.n}</span><strong style={{ fontWeight: 500, fontSize: 16 }}>{p.t}</strong><span className="s-small" style={{ lineHeight: 1.5 }}>{p.d}</span></div>)}
          </div>
          <div className="d-grid" style={{ ['--min' as string]: '280px', ['--gap' as string]: '24px', marginTop: 40 }}>
            <div className="d-ruled"><h3 className="s-h3">Confirmed</h3><p className="s-small" style={{ margin: 0 }}>The logo badge, its ink field #0B0A08 and its gold (#E0B04F midtone, #F0D080 highlight) sampled from the supplied file. Business name, tagline, service line and service categories.</p></div>
            <div className="d-ruled"><h3 className="s-h3">Proposed</h3><p className="s-small" style={{ margin: 0 }}>Supporting palette, typography, spacing, components, templates and voice — derived from the logo and brief. Marked as proposed wherever they appear.</p></div>
            <div className="d-ruled"><h3 className="s-h3">Two registers</h3><p className="s-small" style={{ margin: 0 }}>Expressive (campaigns, stories, quotes): Cormorant at display sizes, full-bleed imagery. Informational (services, forms, prices): Jost, rules, tables, quiet surfaces.</p></div>
          </div>
          <h3 className="d-h3">Colour proportion</h3>
          <div className={css.proportion}>
            {core.proportion.map(([n, p, h]) => { const title = n + ' ' + p + '% · ' + h; return <button key={n} type="button" onClick={cp(h, n + ' ' + h)} title={title} aria-label={title} style={{ flex: p, background: h }} />; })}
          </div>
          <div className={css.legend}>{core.proportion.map(([n, p, h]) => <span key={n}>{n} {p}% · {h}</span>)}</div>
        </DocSection>

        <DocSection id="logo" kicker="02 · Logo" title="One badge, used as supplied." intro="Gold “NS” monogram with needle and thread, framed by a suit jacket and a dress form — men’s and women’s clothing given equal weight. Raster only: never redraw, recolour, crop to a circle, stretch, rotate or add effects.">
          <div className="d-grid" style={{ ['--min' as string]: '220px' }}>
            <figure className={css.fig}><div className={css.ground} style={{ background: 'var(--ns-ink)' }}>{lgImg('/assets/logo/nonso-stitches-badge-512.png', 'Nonso Stitches badge on ink', { width: '86%' })}</div><figcaption className="d-cap"><strong>Ink ground</strong> — native, seamless. Preferred.</figcaption></figure>
            <figure className={css.fig}><div className={css.ground} style={{ background: 'var(--ns-chalk)', border: '1px solid var(--ui-border)' }}>{lgImg('/assets/logo/nonso-stitches-badge-512.png', 'Badge as ink tile on chalk', { width: '52%' })}</div><figcaption className="d-cap"><strong>Light ground</strong> — a deliberate square ink tile, unrounded.</figcaption></figure>
            <figure className={css.fig}><div className={`${css.ground} d-woven`} style={{ position: 'relative', backgroundColor: 'var(--ns-grey-200)' }}><span className={css.photoTag}>Photo</span>{lgImg('/assets/logo/nonso-stitches-badge-180.png', 'Badge tile in a calm photo corner', { position: 'absolute', right: 16, top: 16, width: '30%' })}</div><figcaption className="d-cap"><strong>Photo ground</strong> — tile in a calm corner, never over faces or garment detail.</figcaption></figure>
          </div>
          <div className="d-grid" style={{ ['--min' as string]: '260px', ['--gap' as string]: '24px', marginTop: 40 }}>
            <div className={css.rule}><h3 className="s-h3" style={{ margin: 0 }}>Clear space</h3><div className={css.demo} style={{ justifyContent: 'center' }}><div style={{ padding: 24, outline: '1px dashed var(--ui-border-2)' }}>{lgImg('/assets/logo/nonso-stitches-badge-192.png', '', { width: 96 })}</div></div><p className="s-small" style={{ margin: 0, lineHeight: 1.5 }}>At least ¼ of the badge width on every side. The ink field counts.</p></div>
            <div className={css.rule}><h3 className="s-h3" style={{ margin: 0 }}>Minimum size &amp; text lockup</h3><div className={css.demo} style={{ flexDirection: 'column', gap: 20, alignItems: 'flex-start' }}><div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>{lgImg('/assets/logo/nonso-stitches-badge-120.png', '', { width: 120 })}<span className="s-muted" style={{ fontSize: 12 }}>120 px · 35 mm</span></div><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{lgImg('/assets/logo/nonso-stitches-badge-120.png', '', { width: 48 })}<span className={css.lockup}>NONSO STITCHES</span></div></div><p className="s-small" style={{ margin: 0, lineHeight: 1.5 }}>Full badge from 120 px. From 44–52 px only as a tile beside the typeset name (Cormorant 500, caps, +0.18em). Never below 40 px.</p></div>
            <div className={css.rule}><h3 className="s-h3" style={{ margin: 0 }}>Symbol, avatar &amp; favicon</h3><div className={css.demo} style={{ gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>{lgImg('/assets/avatars/avatar-ink-full.png', 'Avatar full bleed', { width: 72, borderRadius: '50%' })}{lgImg('/assets/avatars/avatar-chalk-tile.png', 'Avatar chalk tile', { width: 72 })}{lgImg('/assets/logo/nonso-stitches-badge-180.png', 'App icon', { width: 56, borderRadius: 12 })}</div><p className="s-small" style={{ margin: 0, lineHeight: 1.5 }}>Avatars use the full badge (circular crops are applied by platforms, not by us). App icons at 180/192/512 px. A 16–32 px favicon needs a simplified vector mark — not yet available.</p></div>
          </div>
          <div className="d-actions">
            <Link href="/playbook#logo" className="s-btn s-btn--md" style={{ height: 44 }}>Full logo rules</Link>
            <Link href="/assets" className="s-btn s-btn--outline s-btn--md" style={{ height: 44 }}>Download logo files</Link>
          </div>
        </DocSection>

        <DocSection id="colour" kicker="03 · Colour" title="Chalk, ink, graphite — and a thread of gold." intro="Click any value to copy it. Gold lives on ink only — never text on light grounds, never a fill or gradient. On light grounds, accents use Adire Indigo.">
          {colorGroups.map(([name, items]) => (
            <div key={name}>
              <h3 className="d-h3" style={{ marginTop: 32 }}>{name}</h3>
              <div className="d-grid d-grid--fill">
                {items.map(c => (
                  <article key={c.token} className={css.swatch}>
                    <button type="button" onClick={cp(c.fmt.hex, c.name + ' ' + c.fmt.hex)} aria-label={'Copy ' + c.name + ' ' + c.fmt.hex} className={css.swatchTop} style={{ background: c.hex, color: c.fg }}><span>{c.status}</span><span>{c.contrastLabel}</span></button>
                    <div className={css.swatchBody}>
                      <div className={css.swatchHead}><strong>{c.name}</strong><span>{c.purpose}</span></div>
                      <div className={css.chips}>
                        <button type="button" className="d-chip d-chip--strong" onClick={cp(c.fmt.hex, c.name + ' ' + c.fmt.hex)}>{c.fmt.hex}</button>
                        <button type="button" className="d-chip" onClick={cp(c.fmt.rgb)}>{c.fmt.rgb}</button>
                        <button type="button" className="d-chip" onClick={cp(c.fmt.hsl)}>{c.fmt.hsl}</button>
                        <button type="button" className="d-chip" onClick={cp('var(' + c.token + ')')}>var({c.token})</button>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{c.usage}</p>
                      <p className={css.fine}><strong>Works on:</strong> {c.on}</p>
                      <p className={css.fine}><strong>Dark mode:</strong> {c.dark}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
          <h3 className="d-h3" style={{ marginTop: 48 }}>Semantic aliases — light / dark</h3>
          <div className={`s-scroll-x ${css.tableWrap}`}>
            <table className={css.table}>
              <thead><tr><th>Alias</th><th>Light</th><th>Dark</th></tr></thead>
              <tbody>{core.aliases.map(([n, l, d]) => <tr key={n}><td><button type="button" className={css.linkBtn} onClick={cp('var(' + n + ')')}>{n}</button></td><td>{l}</td><td>{d}</td></tr>)}</tbody>
            </table>
          </div>
          <h3 className="d-h3" style={{ marginTop: 48 }}>Approved pairings &amp; contrast (WCAG 2.2)</h3>
          <div className="d-grid d-grid--fill" style={{ ['--min' as string]: '200px', ['--gap' as string]: '12px' }}>
            {core.pairs.map(([fg, bg, label]) => { const r = contrast(fg, bg); const v = verdict(r); return (
              <div key={label} className="d-pair">
                <div className="d-pair__sample" style={{ background: bg, color: fg }}>Made to fit you.<span>Body text sample</span></div>
                <div className="d-pair__meta"><span>{label}</span><strong style={{ color: v === 'Fail' ? 'var(--ui-error)' : 'var(--ui-success)' }}>{r.toFixed(1)}:1 · {v}</strong></div>
              </div>); })}
          </div>
        </DocSection>

        <DocSection id="type" kicker="04 · Type" title="Roman capitals, measured sans.">
          <div className="d-grid" style={{ ['--min' as string]: '280px', marginBottom: 40, marginTop: 16 }}>
            {core.fonts.map(f => (
              <div key={f.name} className={css.fontCard}>
                <span style={{ fontFamily: f.stack, fontSize: 'clamp(48px, 8vw, 64px)', lineHeight: 1 }}>Aa Ng ₦</span>
                <strong style={{ fontWeight: 500, fontSize: 16 }}>{f.name}</strong>
                <span className="s-muted" style={{ fontSize: 13 }}>{f.weights} · {f.licence}</span>
                <p className="s-small" style={{ margin: 0, lineHeight: 1.5 }}>{f.role}</p>
                <div className={css.chips}><button type="button" className="d-chip" onClick={cp(f.stack, f.name + ' stack')}>{f.stack}</button><button type="button" className="d-chip" onClick={cp('var(' + f.token + ')')}>var({f.token})</button></div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--ui-strong)' }}>
            {core.typeScale.map(t => { const lh = t.lh === '—' ? 'normal' : t.lh; return (
              <div key={t.style} className={css.typeRow}>
                <div className={css.typeMeta}>
                  <strong style={{ fontWeight: 500, fontSize: 14 }}>{t.style}</strong>
                  <div className={css.chips} style={{ gap: 4 }}>
                    <button type="button" className="d-chip d-chip--xs" onClick={cp(t.css, t.style + ' size')}>{t.size} px</button>
                    <button type="button" className="d-chip d-chip--xs" onClick={cp(String(t.weight), 'weight ' + t.weight)}>{t.weight}</button>
                    <button type="button" className="d-chip d-chip--xs" onClick={cp(String(lh), 'line height ' + lh)}>LH {lh}</button>
                    <button type="button" className="d-chip d-chip--xs" onClick={cp(t.ls, 'letter spacing ' + t.ls)}>LS {t.ls}</button>
                    <button type="button" className="d-chip d-chip--xs" onClick={cp(typeCss({ ...t, lh }), t.style + ' CSS')}>CSS</button>
                  </div>
                </div>
                <div className={css.typeSample} style={{ fontFamily: t.font === 'display' ? 'var(--font-display)' : 'var(--font-sans)', fontSize: `min(${Math.min(t.px, 72)}px, ${Math.max(t.px * 0.6, 16).toFixed(0)}px + 2vw)`, fontWeight: t.weight, fontStyle: t.italic ? 'italic' : 'normal', lineHeight: lh, letterSpacing: t.ls, textTransform: t.upper ? 'uppercase' : 'none' }}>{t.sample}</div>
              </div>); })}
          </div>
          <p className="s-small" style={{ margin: '16px 0 0', maxWidth: '66ch' }}>Sizes are fluid clamp() values between 360 px and 1440 px viewports. Body never drops below 16 px; measure ≤ 66ch. Headlines in sentence case; uppercase only for eyebrows and buttons. Tabular figures for prices and measurements.</p>
        </DocSection>

        <DocSection id="spacing" kicker="05 · Spacing & layout" title="A 4 px base, measured like a pattern draft.">
          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--ui-strong)', marginTop: 16 }}>
            {core.spacing.map(([t, px]) => <button key={t} type="button" className={css.spaceRow} onClick={cp('var(' + t + ')', t + ' (' + px + 'px)')}><span style={{ width: 110, flex: 'none' }}>{t}</span><span className="s-muted" style={{ width: 48, flex: 'none', fontVariantNumeric: 'tabular-nums' }}>{px}px</span><span className={css.spaceBar} style={{ width: Math.min(px * 2, 256) }} /></button>)}
          </div>
          <h3 className="d-h3">Grid, breakpoints &amp; containers</h3>
          <div className="d-grid d-grid--fill d-tiles" style={{ ['--min' as string]: '220px' }}>
            {core.layout.map(([n, v, t]) => <button key={n} type="button" className="d-tile" onClick={cp(v, n + ' ' + v)}><span className="s-muted" style={{ fontSize: 12 }}>{n}</span><span style={{ fontSize: 16, fontWeight: 500 }}>{v}</span><span className="s-muted" style={{ fontSize: 12 }}>{t}</span></button>)}
          </div>
          <h3 className="d-h3">12-column grid (desktop) · 7:5 editorial split</h3>
          <div className={css.cols}>{Array.from({ length: 12 }, (_, i) => <div key={i} />)}</div>
          <div className={css.split}><div className={css.splitImg}>Image · 7</div><div className={css.splitTxt}>Text · 5</div></div>
          <p className="s-small" style={{ margin: '16px 0 0', maxWidth: '66ch' }}>Expressive pages use generous section rhythm (128 / 96 / 64). Information-dense layouts — forms, price lists — tighten to 16/24 steps and use rules instead of space. Align text to the grid’s left edge; centre only titles on covers and statement graphics.</p>
        </DocSection>

        <DocSection id="radius" kicker="06 · Radius, borders & shadow" title="Square cards, hairlines, almost no shadow.">
          <div className="d-grid d-grid--fill" style={{ ['--min' as string]: '180px', marginTop: 16 }}>
            {core.radii.map(([t, v, u]) => <button key={t} type="button" className={css.radius} onClick={cp('var(' + t + ')', t)}><span style={{ borderRadius: v }} /><strong>{t} · {v}</strong><em>{u}</em></button>)}
          </div>
          <h3 className="d-h3">Elevation</h3>
          <div className="d-grid d-grid--fill" style={{ ['--min' as string]: '220px', ['--gap' as string]: '24px', background: 'var(--ui-sunken)', padding: 'clamp(16px, 3vw, 24px)' }}>
            {core.shadows.map(([t, v, u]) => <button key={t} type="button" className={css.shadow} onClick={cp('var(' + t + ')', t)} style={{ boxShadow: v }}><strong>{t}</strong><span>{u}</span><em>{v}</em></button>)}
          </div>
          <h3 className="d-h3">Borders &amp; strokes</h3>
          <div style={{ borderTop: '1px solid var(--ui-strong)' }}>
            {core.borders.map(([t, v, u]) => <button key={t} type="button" className={css.borderRow} onClick={cp('var(' + t + ')', t)}><span style={{ width: 150 }}>{t}</span><span className="s-muted" style={{ width: 60 }}>{v}</span><span className="s-muted" style={{ flex: 1, minWidth: 160 }}>{u}</span></button>)}
          </div>
        </DocSection>

        <DocSection id="motif" kicker="07 · Motif, imagery & icons" title="Lines from the cutting table." intro="1 px strokes only. At most one device per composition, always secondary to the photo or headline.">
          <div className="d-grid" style={{ ['--min' as string]: '240px' }}>
            <div className={css.motif}><div style={{ height: 48, display: 'flex', alignItems: 'center' }}><div style={{ width: '100%', height: 1, background: 'repeating-linear-gradient(90deg,var(--ui-strong) 0 6px,transparent 6px 10px)' }} /></div><strong>Stitch line</strong><span>1 px, 6 on / 4 off. Dividers, quote rules.</span><button type="button" className="d-chip" style={{ alignSelf: 'flex-start' }} onClick={cp('background:repeating-linear-gradient(90deg,currentColor 0 6px,transparent 6px 10px);height:1px', 'stitch line CSS')}>Copy CSS</button></div>
            <div className={css.motif}><div style={{ height: 48, position: 'relative' }}><div style={{ position: 'absolute', left: 0, right: 0, top: 16, height: 8, background: 'repeating-linear-gradient(90deg,var(--ui-strong) 0 1px,transparent 1px 8px)' }} /><div style={{ position: 'absolute', left: 0, right: 0, top: 16, height: 16, background: 'repeating-linear-gradient(90deg,var(--ui-strong) 0 1px,transparent 1px 40px)' }} /></div><strong>Measure ticks</strong><span>8 px minor / 40 px major. Statistics, measurement content.</span><button type="button" className="d-chip" style={{ alignSelf: 'flex-start' }} onClick={cp('background:repeating-linear-gradient(90deg,currentColor 0 1px,transparent 1px 8px)', 'measure ticks CSS')}>Copy CSS</button></div>
            <div className={css.motif}><div style={{ height: 48, position: 'relative', margin: '0 12px' }}><div style={{ position: 'absolute', left: 0, top: 8, width: 12, borderTop: '1px solid var(--ui-strong)' }} /><div style={{ position: 'absolute', left: 16, top: 0, height: 12, borderLeft: '1px solid var(--ui-strong)' }} /><div style={{ position: 'absolute', right: 0, bottom: 8, width: 12, borderTop: '1px solid var(--ui-strong)' }} /><div style={{ position: 'absolute', right: 16, bottom: 0, height: 12, borderLeft: '1px solid var(--ui-strong)' }} /></div><strong>Pattern-draft crop marks</strong><span>Corners of image frames in editorial layouts.</span></div>
            <div className={css.motif}><div className="d-woven" style={{ height: 48 }} /><strong>Woven placeholder</strong><span>4 px grid on Muslin. Image slots only — the only texture.</span></div>
          </div>
          <h3 className="d-h3">Image treatment &amp; cropping</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            {ratios.map(r => <div key={r.label} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: r.w }}><div className="d-woven" style={{ aspectRatio: r.ar }} /><span className="s-muted" style={{ fontSize: 12 }}><strong style={{ fontWeight: 500, color: 'var(--ui-text)' }}>{r.label}</strong> {r.use}</span></div>)}
          </div>
          <ul className="d-list" style={{ marginTop: 20 }}>
            <li>Neutral, true-to-fabric grade; true skin tones; soft side light (~5000 K); slightly lifted blacks. No sepia, heavy filters or grain.</li>
            <li>Mix: 40% finished garments on people · 40% process and detail · 20% people at fittings. Men and women in every set.</li>
            <li>Never crop through hands at the joints or cut hems in full-length shots. Leave a calm corner for the logo tile.</li>
            <li>Overlays: a solid ink panel behind text (image templates); protection gradients on social image posts only. No backdrop blur. Modal overlay ink 64%, lightbox 94%.</li>
            <li>Alt text describes garment, fabric, detail and action — e.g. “Tailor chalk-marks the hem of charcoal wool trousers on a client”.</li>
          </ul>
          <h3 className="d-h3">Icons</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {icons.map(n => <button key={n} type="button" className={css.iconBtn} title={n} aria-label={'Copy icon name ' + n} onClick={() => copy(n, 'icon name “' + n + '”')}><Icon name={n} size={20} /></button>)}
          </div>
          <p className="s-small" style={{ margin: '12px 0 0', maxWidth: '70ch' }}>Lucide (substitute set) on a 24 grid, 2 px stroke, rendered 16–20 px, tinted with currentColor. Functional only — services, contact, status, navigation. Standalone icons sit in 44 px hairline or ink tiles. No emoji, glyph icons or decorative clusters. No illustration style exists yet; use photography.</p>
          <h3 className="d-h3">Diagrams, charts &amp; data</h3>
          <div className="d-grid" style={{ ['--gap' as string]: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {chartDemo.map(([l, v]) => <div key={l} className={css.bar}><span>{l}</span><div><div style={{ width: (v / 40 * 100) + '%' }} /></div><span>{v}</span></div>)}
              <span className="s-muted" style={{ fontSize: 12 }}>Sample values.</span>
            </div>
            <ul className="d-list"><li>Single-hue: ink bars on Muslin tracks; highlight one series with Indigo (light) or Gold (dark).</li><li>Direct labels, tabular figures, no legends where labels fit. No 3D, gradients or pie charts with more than 4 slices.</li><li>Diagrams: 1 px lines, square nodes, numbered steps (01, 02…).</li><li>Always state the source or mark values as samples.</li></ul>
          </div>
        </DocSection>

        <DocSection id="voice" kicker="08 · Voice" title="Warm, clear, specific." intro="We speak as the studio, to you. Talk about fit, comfort and style — not luxury. Specifics over superlatives.">
          <div className="d-grid">
            {voiceEx.map(v => <div key={v.k} className={css.voice}><span>{v.k}</span><span>{v.t}</span></div>)}
          </div>
          <div className="d-actions" style={{ marginTop: 28 }}><Link href="/voice" className="s-btn s-btn--md" style={{ height: 44 }}>Open voice &amp; knowledge</Link></div>
        </DocSection>

        <DocSection id="components" kicker="09 · Components" title="Components & states" intro="Live components from the design-system library. Specimens sit on a chalk surface (their native ground) with inverse variants on ink. Hover and focus are interactive — tab through them.">
          <div className="d-specimen">
            <div><p className="d-kicker">Buttons · variants</p>
              <div className={css.wrap}><Button variant="primary">Book a fitting</Button><Button variant="secondary">Start an inquiry</Button><Button variant="tertiary" icon="arrow-right">See the work</Button><Button variant="whatsapp" icon="message-circle" iconPosition="start">Chat on WhatsApp</Button></div></div>
            <div><p className="d-kicker">Buttons · sizes &amp; states</p>
              <div className={css.wrap}><Button size="sm">Small</Button><Button size="lg">Large</Button><Button loading>Sending</Button><Button disabled>Disabled</Button></div>
              <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--ns-grey-700)' }}>Hover: ink lightens to #26282B · Press: pure black, no scale · Focus: 2 px indigo ring with 2 px chalk gap · Loading: spinner + aria-busy · Disabled: Muslin fill.</p></div>
            <div><p className="d-kicker">Badges</p>
              <div className={css.wrap} style={{ gap: 8 }}><Badge tone="neutral">Men</Badge><Badge tone="ink">Women</Badge><Badge tone="gold">New</Badge><Badge tone="outline">Custom</Badge><Badge tone="success" dot>Ready</Badge><Badge tone="warning" dot>Fitting due</Badge><Badge tone="error" dot>Overdue</Badge><Badge tone="info" dot>In progress</Badge></div></div>
            <div className="d-grid" style={{ ['--min' as string]: '240px', ['--gap' as string]: '20px' }}>
              <TextField label="Your name" placeholder="Adaeze Okafor" />
              <TextField label="Phone or WhatsApp" type="tel" hint="We’ll confirm your fitting here." />
              <TextField label="Phone or WhatsApp" type="tel" defaultValue="080" error="Enter a phone or WhatsApp number we can reach, e.g. 0803 123 4567." />
              <TextField label="Email" optional disabled />
            </div>
            <div className="d-grid" style={{ ['--min' as string]: '240px', ['--gap' as string]: '12px' }}>
              <Checkbox label="I have my own fabric" description="Bring it to your first fitting." />
              <Checkbox label="Disabled option" disabled />
            </div>
            <div className="d-grid" style={{ ['--gap' as string]: '12px' }}>
              <Alert tone="success" title="Inquiry sent">We’ll message you on WhatsApp to arrange your fitting.</Alert>
              <Alert tone="info" title="Fittings take about 40 minutes">Bring the shoes you’ll wear.</Alert>
              <Alert tone="warning" title="Festive deadline">Book before [date] for fittings in time.</Alert>
              <Alert tone="error" title="We couldn’t send that">Check your connection and try again.</Alert>
            </div>
            <ProgressSteps steps={['Garment', 'Details', 'Measurements', 'Confirm']} current={1} />
            <div className="d-grid" style={{ ['--gap' as string]: '24px' }}>
              <ServiceCard index="01" title="Made to measure" description="Cut from your measurements and fitted on you, for men and women." meta={['2–3 fittings', 'Men · Women']} cta="Book a fitting" />
              <ServiceCard index="02" title="Alterations" description="Hems, waists, sleeves — the clothes you own, fitted again." meta={['[Turnaround]', 'Men · Women']} cta="Request an alteration" />
              <TestimonialCard quote="It fits like it was always mine." name="[Client first name]" context="[Garment] · [Occasion]" />
            </div>
          </div>
          <div className="d-ink ns-on-dark">
            <Button variant="inverse">Book a fitting</Button><Button variant="outline-inverse">Start an inquiry</Button><Button variant="tertiary-inverse" icon="arrow-right">See the work</Button>
            <span style={{ fontSize: 13, color: 'var(--ns-grey-400)' }}>Inverse variants on ink · focus ring turns gold</span>
          </div>
          <h3 className="d-h3">Interaction &amp; motion</h3>
          <div className="d-grid d-grid--fill d-tiles" style={{ ['--min' as string]: '200px' }}>
            {core.motion.map(([t, v, u]) => <button key={t} type="button" className="d-tile" onClick={cp('var(' + t + ')', t)}><span style={{ fontSize: 14, fontWeight: 500 }}>{t}</span><span style={{ fontSize: 13 }}>{v}</span><span className="s-muted" style={{ fontSize: 12 }}>{u}</span></button>)}
          </div>
          <ul className="d-list" style={{ marginTop: 16 }}>
            <li>Fades and 8 px rises only. No bounce, scale or parallax. Section transitions: content fades up once on first view.</li>
            <li>Hover — ink fills lighten; outlines fill with ink; text links shift to indigo (gold-light on dark); tertiary arrows nudge 3 px; gallery images dim to 88%.</li>
            <li><code>prefers-reduced-motion</code> collapses all durations to 1 ms (implemented globally in this studio).</li>
            <li>Mobile: header is static; primary CTA stays in the hero and in the drawer; modals become bottom sheets under 520 px; touch targets ≥ 44 px.</li>
          </ul>
        </DocSection>

        <DocSection id="slides" kicker="10 · Slides" title="Presentation system" intro="1920 × 1080. Ink for covers, dividers and quotes; paper for content. Eyebrow + headline + one idea per slide. Text never below 24 px. These are live renders of the editable presentation template.">
          <div className="d-grid d-grid--fill" style={{ ['--min' as string]: '240px' }}>
            {(previews?.slides || Array.from({ length: 12 }, (_, i) => ({ id: String(i), name: '', num: '', html: '' }))).map(s => (
              <figure key={s.id} className={css.fig} style={{ gap: 6 }}><div className="d-preview"><FitPreview w={1920} h={1080} html={s.html} label={s.name ? 'Slide ' + s.num + ': ' + s.name : undefined} /></div><figcaption className="s-muted" style={{ fontSize: 12 }}>{s.num && `${s.num} · ${s.name}`}</figcaption></figure>
            ))}
          </div>
          <div className="d-actions" style={{ marginTop: 24 }}><a href={editorHref('doc-presentation')} className="s-btn s-btn--md" style={{ height: 44 }}>Edit the presentation</a></div>
        </DocSection>

        <DocSection id="uikits" kicker="11 · UI kits" title="Website kit" intro="Section templates at desktop, tablet and mobile widths. Each is editable and exportable from the template library.">
          <div className="d-grid d-grid--fill" style={{ ['--min' as string]: '280px' }}>
            {(previews?.web || G.templates.filter(t => t.cat === 'web').map(t => ({ id: t.id, name: t.name + ' · desktop', W: 1440, H: 900, html: '' }))).map(w => (
              <a key={w.id} href={editorHref(w.id)} className={css.kit}><div className="d-preview"><FitPreview w={w.W} h={w.H} html={w.html} /></div><span>{w.name}</span></a>
            ))}
          </div>
        </DocSection>

        <DocSection id="governance" kicker="12 · Governance" title="Keeping it consistent">
          <div className="d-grid" style={{ ['--min' as string]: '280px', ['--gap' as string]: '24px', marginTop: 8 }}>
            {governance.map(g => <div key={g.t} className="d-ruled" style={{ paddingTop: 14 }}><h3 className="s-h3" style={{ marginBottom: 10 }}>{g.t}</h3><ul className="d-list" style={{ lineHeight: 1.65 }}>{g.items.map(i => <li key={i}>{i}</li>)}</ul></div>)}
          </div>
          <p className="s-muted" style={{ margin: '32px 0 0', fontSize: 13 }}>System version {version} · Tokens: src/styles/ds/*.css (source of truth) mirrored in src/lib/core.ts.</p>
        </DocSection>
      </DocsLayout>
    </div>
  );
}
