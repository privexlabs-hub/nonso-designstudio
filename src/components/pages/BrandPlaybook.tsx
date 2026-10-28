'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { StudioHeader } from '@/components/shell/StudioHeader';
import { DocsLayout } from '@/components/shell/DocsLayout';
import { FitPreview } from '@/components/shell/FitPreview';
import { Alert, Button, ServiceCard, TestimonialCard } from '@/components/ds';
import { colors, pairs, contrast, copy, verdict, editorHref, version } from '@/lib/core';
import * as G from '@/lib/graphics';
import * as D from '@/lib/docs';
import * as R from '@/lib/render';
import { useHydrated } from '@/lib/useStorage';
import css from './BrandPlaybook.module.css';

const toc: [string, string][] = [['pb-overview', 'Overview & positioning'], ['logo', 'Logo, symbol & mark'], ['pb-colour', 'Colour'], ['pb-type', 'Typography'], ['pb-layout', 'Spacing, grids & radii'], ['pb-imagery', 'Imagery & icons'], ['pb-components', 'Components'], ['pb-social', 'Social & marketing'], ['pb-docs', 'Presentations & documents'], ['pb-modes', 'Light & dark mode'], ['pb-usage', 'Correct & incorrect'], ['pb-a11y', 'Accessibility'], ['pb-governance', 'Governance']];
const logoVariants = [
  { t: 'Primary badge', d: 'Gold on ink, as supplied. The only logo.', bg: 'var(--ns-ink)', src: '/assets/logo/nonso-stitches-badge-512.png', w: '80%', r: '0', alt: 'Primary badge', name: false },
  { t: 'Tile on light', d: 'Square ink tile on chalk or paper.', bg: 'var(--ns-chalk)', src: '/assets/logo/nonso-stitches-badge-400.png', w: '52%', r: '0', alt: 'Badge tile on chalk', name: false },
  { t: 'Small lockup', d: '44–52 px tile + typeset name (Cormorant 500, +0.18em).', bg: 'var(--ns-chalk)', src: '/assets/logo/nonso-stitches-badge-120.png', w: '48px', r: '0', alt: 'Small lockup', name: true },
  { t: 'Avatar', d: 'Full-bleed badge; platforms crop to a circle.', bg: 'var(--ns-grey-100)', src: '/assets/avatars/avatar-ink-full.png', w: '64%', r: '50%', alt: 'Avatar', name: false },
  { t: 'App icon', d: '180 / 192 / 512 px. 16–32 px favicon not available.', bg: 'var(--ns-grey-100)', src: '/assets/logo/nonso-stitches-badge-180.png', w: '44%', r: '18%', alt: 'App icon', name: false }];
const logoDonts = [{ t: 'Don’t stretch', tf: 'scaleX(1.35)' }, { t: 'Don’t rotate', tf: 'rotate(-14deg)' }, { t: 'Don’t recolour', filter: 'hue-rotate(160deg) saturate(2)' }, { t: 'Don’t crop to a circle', r: '50%' }, { t: 'Don’t add effects', shadow: '0 0 24px 6px rgba(224,176,79,.8)' }, { t: 'Don’t place on busy colour', bg: '#2F6B4A' }]
  .map(d => ({ tf: 'none', filter: 'none', r: '0', shadow: 'none', bg: 'var(--ns-chalk)', ...d }));
const layoutRules = [{ t: 'Spacing', d: '4 px base: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128. Generous for expressive pages, tight (16/24) with rules for forms and price lists.' }, { t: 'Grid', d: '12 / 8 / 4 columns; gutters 24 / 20 / 16; margins 64 / 40 / 20; container 1320. Editorial split 7:5 image:text.' }, { t: 'Radii', d: 'Cards and images 0 · buttons and inputs 2 px · modals 4 px · badges pill.' }, { t: 'Shadow & elevation', d: 'Cards sit flat on hairlines. Raised shadow for menus only; overlay shadow for modals only.' }];
const imageryRules = [{ t: 'Photography', d: 'Neutral, true-to-fabric grade; soft side light; real people. 40% finished garments, 40% process and detail, 20% fittings. Men and women in every set.' }, { t: 'Cropping', d: '4:5 portraits, 1:1 details, 3:2 process, 3:4 editorial, 9:16 stories. Never crop hands at the joints or cut hems in full-length shots.' }, { t: 'Motifs', d: 'Stitch line, measure ticks, pattern-draft crop marks — 1 px, one per composition, always secondary.' }, { t: 'Icons & illustration', d: 'Lucide line icons (substitute set), 16–20 px, functional only. No illustration style exists — use photography; never use scissors or needles as decoration.' }];
const usage = [
  { eyebrow: 'Occasion wear', good: 'Ready for the day.', goodBg: '#0B0A08', goodFg: '#F3F4F2', goodAccent: '#E0B04F', goodNote: 'gold eyebrow on ink', bad: 'Ready for the day.', badBg: '#F3F4F2', badFg: '#15181A', badAccent: '#E0B04F', badFont: 'var(--font-display)', badNote: 'gold text on light' },
  { eyebrow: 'Alterations', good: 'Almost fits? Bring it in.', goodBg: '#F3F4F2', goodFg: '#15181A', goodAccent: '#1F2E4A', goodNote: 'cool chalk, indigo accent', bad: 'Almost fits? Bring it in.', badBg: '#F3F4F2', badFg: '#15181A', badAccent: '#16A34A', badFont: 'var(--font-display)', badNote: 'off-palette accent colour' },
  { eyebrow: 'Made to measure', good: 'Made to fit you.', goodBg: '#E9EBEA', goodFg: '#15181A', goodAccent: '#1F2E4A', goodNote: 'specific, sentence case', bad: 'UNPARALLELED LUXURY COUTURE', badBg: '#E9EBEA', badFg: '#15181A', badAccent: '#1F2E4A', badFont: 'var(--font-sans)', badNote: 'superlatives, all caps' },
  { eyebrow: 'Studio news', good: 'Festive bookings are open.', goodBg: '#1F2E4A', goodFg: '#F3F4F2', goodAccent: '#E0B04F', goodNote: 'one idea, one field colour', bad: 'Festive bookings are open.', badBg: '#E0B04F', badFg: '#0B0A08', badAccent: '#0B0A08', badFont: 'var(--font-display)', badNote: 'gold as a fill' }];
const role: Record<string, string> = { '--ns-ink': 'Primary', '--ns-chalk': 'Page', '--ns-paper': 'Surface', '--ns-gold': 'On ink only', '--ns-indigo': 'Accent on light', '--ns-grey-100': 'Alt section', '--ns-grey-700': 'Secondary text', '--ns-grey-900': 'Body text', '--ns-success': 'Success', '--ns-error': 'Error', '--ns-whatsapp': 'WhatsApp CTA', '--ns-grey-600': 'Borders' };
const keyColors = colors.filter(c => role[c.token]);
const socialIds = ['sq-announcement', 'sq-testimonial', 'eng-poll', 'st-quote', 'sq-educational'];
const docIds: [string, number][] = [['doc-ebook', 0], ['doc-ebook', 11], ['doc-report', 2], ['doc-proposal', 8], ['doc-presentation', 0], ['doc-presentation', 8]];

const Rules = ({ items }: { items: { t: string; d: string }[] }) => (
  <div className="d-grid" style={{ ['--min' as string]: '240px', ['--gap' as string]: '24px' }}>
    {items.map(r => <div key={r.t} className="d-ruled" style={{ paddingTop: 12 }}><h3 className={css.h3}>{r.t}</h3><p className="s-small" style={{ margin: 0 }}>{r.d}</p></div>)}
  </div>
);

export function BrandPlaybook() {
  const hydrated = useHydrated();
  const previews = useMemo(() => {
    if (!hydrated) return null;
    return {
      social: socialIds.map(id => { const t = G.templates.find(x => x.id === id)!; const d = G.create(t); return { id, name: t.name, W: d.W, H: d.H, html: R.graphic(d, d.pages[0]) }; }),
      docs: docIds.map(([id, i]) => { const t = D.templates.find(x => x.id === id)!; const d = D.create(t); const f = R.fmt(d); return { key: id + i, id, name: t.name + ' · ' + d.pages[i].name, W: f.w, H: f.h, html: R.docPage(d, i) }; }),
    };
  }, [hydrated]);

  return (
    <div className="s-page">
      <StudioHeader current="playbook" />
      <section className={css.hero}>
        <div className={css.heroIn}>
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <p className={css.heroEyebrow}>Brand identity playbook · v{version}</p>
            <h1 className={css.heroH1}>Classic fits, modern styles.</h1>
            <p className={css.heroLead}>How Nonso Stitches looks, sounds and behaves — for anyone making anything with the name on it.</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo/nonso-stitches-badge-512.png" alt="Nonso Stitches badge" className={css.heroBadge} width={320} height={320} />
        </div>
      </section>
      <DocsLayout title="Chapters" label="Playbook chapters" sections={toc}>
        <section id="pb-overview" className="d-sec d-sec--first">
          <p className="d-kicker">01 · Overview &amp; positioning</p>
          <h2 className="d-h2" style={{ marginBottom: 20 }}>Clothing thoughtfully made to fit you, your style, and your life.</h2>
          <Rules items={[{ t: 'What we are', d: 'A fashion and tailoring business making custom clothing for men and women: made-to-measure outfits, garment construction, alterations and personalised pieces.' }, { t: 'Central idea', d: 'Every garment deserves thoughtful craftsmanship; every customer deserves a fit that feels personal.' }, { t: 'Positioning', d: 'A contemporary bespoke studio — precise, calm and personal. The logo carries the ceremony; everything around it stays quiet.' }, { t: 'Personality', d: 'Warm, confident, clear, personal, detail-oriented. Reassuring without overpromising.' }]} />
        </section>

        <section id="logo" className={`d-sec ${css.sec}`}>
          <p className="d-kicker">02 · Logo, symbol &amp; mark</p>
          <h2 className="d-h2">One badge. Treat it with care.</h2>
          <div className="d-grid" style={{ ['--min' as string]: '170px' }}>
            {logoVariants.map(v => (
              <figure key={v.t} className={css.fig}>
                <div className={css.tile} style={{ background: v.bg }}>
                  <span role="img" aria-label={v.alt} style={{ width: v.w, aspectRatio: '1', display: 'block', borderRadius: v.r, background: `url('${v.src}') center/contain no-repeat`, flex: 'none' }} />
                  {v.name && <span className={css.lockup}>NONSO STITCHES</span>}
                </div>
                <figcaption className={css.cap}><strong>{v.t}</strong>{v.d}</figcaption>
              </figure>
            ))}
          </div>
          <h3 className="d-h3">Never</h3>
          <div className="d-grid" style={{ ['--min' as string]: '150px', ['--gap' as string]: '12px' }}>
            {logoDonts.map(d => (
              <figure key={d.t} className={css.fig} style={{ gap: 6 }}>
                <div className={css.dont} style={{ background: d.bg }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/logo/nonso-stitches-badge-400.png" alt="" style={{ width: '62%', display: 'block', transform: d.tf, filter: d.filter, borderRadius: d.r, boxShadow: d.shadow }} />
                </div>
                <figcaption className={css.dontCap}>{d.t}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="pb-colour" className={`d-sec ${css.sec}`}>
          <p className="d-kicker">03 · Colour</p>
          <h2 className="d-h2">Cool, quiet grounds. Gold only on ink.</h2>
          <p className="d-intro" style={{ fontSize: 15, marginBottom: 20 }}>Click a swatch to copy its HEX. Full values (RGB, HSL, tokens, dark-mode behaviour) live in the <Link href="/design-system#colour">design system</Link>.</p>
          <div className="d-grid d-grid--fill" style={{ ['--min' as string]: '150px', ['--gap' as string]: '12px' }}>
            {keyColors.map(c => (
              <button key={c.token} type="button" className={css.swatch} onClick={() => copy(c.hex, c.name + ' ' + c.hex)}>
                <span style={{ height: 72, width: '100%', background: c.hex, display: 'block' }} />
                <span className={css.swatchTxt}><strong>{c.name}</strong><span>{c.hex} · {role[c.token]}</span></span>
              </button>
            ))}
          </div>
          <ul className="d-list" style={{ marginTop: 20 }}>
            <li>Proportion: chalk/white 60 · ink 25 · graphite 9 · gold 4 · indigo 2. Print and packaging may flip to ink-dominant.</li>
            <li>Accents on light grounds use Adire Indigo. Gold is reserved for ink grounds and the logo itself.</li>
            <li>Never: gold text on light, gold gradients or metallic effects, warm-tinted grounds or warm orange/brown accents of any kind.</li>
          </ul>
        </section>

        <section id="pb-type" className={`d-sec ${css.sec}`}>
          <p className="d-kicker">04 · Typography</p>
          <div className={css.typeStack}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(44px, 3.4vw + 32px, 88px)', lineHeight: .96, letterSpacing: '-.015em' }}>Made to fit you.</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'clamp(30px, 1vw + 26px, 44px)', lineHeight: 1.08 }}>From your measurements to the finished piece.</span>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(26px, .8vw + 23px, 34px)', lineHeight: 1.25 }}>It fits like it was always mine.</span>
            <span className="d-kicker" style={{ margin: 0 }}>Eyebrow · Jost 500 caps +0.24em</span>
            <span style={{ fontSize: 18, lineHeight: 1.6, maxWidth: '60ch' }}>Body large in Jost. Trousers too long? Waist too loose? Bring them in — we’ll pin them while you wait.</span>
          </div>
          <p className="s-small" style={{ margin: '16px 0 0', maxWidth: '70ch' }}>Cormorant Garamond for display, H1–H3, product titles and quotes. Jost for H4, body, UI, prices. Sentence case everywhere; capitals only for eyebrows and buttons. Full scale with copyable values: <Link href="/design-system#type">design system → Type</Link>.</p>
        </section>

        <section id="pb-layout" className={`d-sec ${css.sec}`}><p className="d-kicker">05 · Spacing, grids, radii &amp; shadow</p><Rules items={layoutRules} /></section>
        <section id="pb-imagery" className={`d-sec ${css.sec}`}><p className="d-kicker">06 · Motifs, imagery, icons &amp; illustration</p><Rules items={imageryRules} /></section>

        <section id="pb-components" className={`d-sec ${css.sec}`}>
          <p className="d-kicker">07 · Components &amp; patterns</p>
          <div className="d-specimen d-grid" style={{ ['--gap' as string]: '24px', display: 'grid' }}>
            <ServiceCard index="01" title="Made to measure" description="Cut from your measurements and fitted on you." cta="Book a fitting" />
            <TestimonialCard quote="They listened to how I wanted it to feel." name="[Client first name]" context="[Garment]" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}><Button>Book a fitting</Button><Button variant="whatsapp" icon="message-circle" iconPosition="start">Chat on WhatsApp</Button><Alert tone="success" title="Inquiry sent">We’ll message you to arrange your fitting.</Alert></div>
          </div>
          <p className="s-small" style={{ margin: '16px 0 0' }}>Cards are flat and square with a 1 px ink top rule; one primary button per view; status always icon + words + colour. All components and states: <Link href="/design-system#components">design system → Components</Link>.</p>
        </section>

        <section id="pb-social" className={`d-sec ${css.sec}`}>
          <p className="d-kicker">08 · Social &amp; marketing</p>
          <div className="d-grid d-grid--fill" style={{ ['--min' as string]: '180px', ['--gap' as string]: '12px', marginBottom: 20 }}>
            {(previews?.social || socialIds.map(id => ({ id, name: G.templates.find(x => x.id === id)!.name, W: 1080, H: id.startsWith('st-') ? 1920 : 1080, html: '' }))).map(s => (
              <a key={s.id} href={editorHref(s.id)} className={css.ex}><div className="d-preview"><FitPreview w={s.W} h={s.H} html={s.html} /></div><span>{s.name}</span></a>
            ))}
          </div>
          <ul className="d-list">
            <li>One idea, one headline (≤ 8 words), one CTA per graphic. Alternate men’s and women’s content across a set.</li>
            <li>Logo ≥ 120 px or tile + typeset name in a calm corner; never over faces or garment detail.</li>
            <li>Ink, chalk, cotton, paper or indigo fields only. One graphic device (stitch line, ticks or crop marks) at most.</li>
            <li>No emoji, no prices or deadlines unless confirmed, testimonials only with written permission.</li>
          </ul>
        </section>

        <section id="pb-docs" className={`d-sec ${css.sec}`}>
          <p className="d-kicker">09 · Presentations &amp; documents</p>
          <div className="d-grid d-grid--fill" style={{ ['--min' as string]: '160px', ['--gap' as string]: '12px', marginBottom: 20 }}>
            {(previews?.docs || docIds.map(([id, i]) => { const f = D.formats[D.templates.find(x => x.id === id)!.format]; return { key: id + i, id, name: '', W: f.w, H: f.h, html: '' }; })).map(s => (
              <a key={s.key} href={editorHref(s.id)} className={css.ex}><div className="d-preview"><FitPreview w={s.W} h={s.H} html={s.html} /></div><span>{s.name}</span></a>
            ))}
          </div>
          <ul className="d-list">
            <li>Ink covers, dividers and back covers; paper content pages. Margins 76 px (A4), 58 px (book), 120 px (slides).</li>
            <li>Body left-aligned (justified allowed in books); centre only covers, title pages, dedications and epigraphs.</li>
            <li>Running header with the document title; page numbers bottom-centre or outside edge; hidden on covers.</li>
            <li>Slides: eyebrow + headline + one idea; text never below 24 px at 1920 × 1080.</li>
          </ul>
        </section>

        <section id="pb-modes" className={`d-sec ${css.sec}`}>
          <p className="d-kicker">10 · Light &amp; dark mode</p>
          <div className="d-grid">
            <div className={css.mode} style={{ background: 'var(--ns-chalk)', color: 'var(--ns-grey-900)' }}><span style={{ color: 'var(--ns-indigo)' }}>Light · default</span><span>Made to fit you.</span><span style={{ color: 'var(--ns-grey-700)' }}>Chalk page, paper surfaces, charcoal text, indigo accents. Logo as an ink tile.</span></div>
            <div className={css.mode} style={{ background: 'var(--ns-ink)', color: 'var(--ns-chalk)' }}><span style={{ color: 'var(--ns-gold)' }}>Dark</span><span>Made to fit you.</span><span style={{ color: 'var(--ns-grey-400)' }}>Ink page, ink-raised surfaces, chalk text, gold accents and focus. Logo sits seamlessly.</span></div>
          </div>
          <p className="s-small" style={{ margin: '16px 0 0', maxWidth: '70ch' }}>The studio follows your system preference until you choose a theme in the header; the choice is remembered. Artwork and exported files keep their own brand colours in both modes.</p>
        </section>

        <section id="pb-usage" className={`d-sec ${css.sec}`}>
          <p className="d-kicker">11 · Correct &amp; incorrect usage</p>
          <div className="d-grid" style={{ ['--min' as string]: '280px' }}>
            {usage.map(u => (
              <div key={u.eyebrow} className={css.usage}>
                <figure className={css.fig} style={{ gap: 6 }}><div className={css.uTile} style={{ background: u.goodBg, color: u.goodFg, borderTopColor: 'var(--ui-success)' }}><span style={{ color: u.goodAccent }}>{u.eyebrow}</span><span style={{ fontFamily: 'var(--font-display)' }}>{u.good}</span></div><figcaption style={{ fontSize: 12, color: 'var(--ui-success)', fontWeight: 500 }}>Do · {u.goodNote}</figcaption></figure>
                <figure className={css.fig} style={{ gap: 6 }}><div className={css.uTile} style={{ background: u.badBg, color: u.badFg, borderTopColor: 'var(--ui-error)' }}><span style={{ color: u.badAccent }}>{u.eyebrow}</span><span style={{ fontFamily: u.badFont }}>{u.bad}</span></div><figcaption style={{ fontSize: 12, color: 'var(--ui-error)', fontWeight: 500 }}>Don’t · {u.badNote}</figcaption></figure>
              </div>
            ))}
          </div>
        </section>

        <section id="pb-a11y" className={`d-sec ${css.sec}`}>
          <p className="d-kicker">12 · Accessibility &amp; contrast</p>
          <div className="d-grid d-grid--fill" style={{ ['--min' as string]: '200px', ['--gap' as string]: '10px', marginBottom: 16 }}>
            {pairs.map(([fg, bg, label]) => { const r = contrast(fg, bg); const v = verdict(r); return (
              <div key={label} style={{ border: '1px solid var(--ui-border)' }}><div style={{ background: bg, color: fg, padding: 14, fontSize: 15 }}>{label}</div><div className={css.a11yMeta}><span>{r.toFixed(1)}:1</span><strong style={{ color: v === 'Fail' ? 'var(--ui-error)' : 'var(--ui-success)' }}>{v}</strong></div></div>); })}
          </div>
          <ul className="d-list"><li>WCAG 2.2 AA: text 4.5:1, display text 3:1, functional borders 3:1.</li><li>Touch targets ≥ 44 px; inputs 16 px; visible focus rings (indigo on light, gold on ink).</li><li>Status = icon + words + colour; errors explain how to fix. Alt text names garment, fabric, detail and action.</li><li>Motion respects reduced-motion preferences.</li></ul>
        </section>

        <section id="pb-governance" className={`d-sec ${css.sec}`}>
          <p className="d-kicker">13 · Governance &amp; consistency</p>
          <ol className={css.ol}>
            <li>Start from a template in the studio, not a blank canvas.</li>
            <li>Replace every [placeholder] with a confirmed fact before publishing.</li>
            <li>Check the item against this playbook: logo size, grounds, one device, contrast, voice.</li>
            <li>New colours, fonts or logo treatments need the owner’s approval and a version bump.</li>
            <li>Keep exported files named by template and size; store finals outside the browser — studio edits are saved locally only.</li>
          </ol>
        </section>
      </DocsLayout>
    </div>
  );
}
