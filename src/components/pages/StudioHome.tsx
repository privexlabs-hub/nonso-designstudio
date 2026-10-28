'use client';
import Link from 'next/link';
import { StudioHeader } from '@/components/shell/StudioHeader';
import { editorHref } from '@/lib/core';
import { templates as gTemplates } from '@/lib/graphics';
import { templates as dTemplates } from '@/lib/docs';
import { useStored } from '@/lib/useStorage';
import css from './StudioHome.module.css';

type IndexEntry = { name: string; updated: number; kind: string };

const nT = gTemplates.length + dTemplates.length;
const areas = [
  { n: '01', t: 'Design system', d: 'Twelve sections: overview, logo, colour, type, spacing, radius & shadow, motif, voice, components, slides, UI kits, governance. Every value click-to-copy.', href: '/design-system', cta: 'Open the system' },
  { n: '02', t: 'Brand playbook', d: 'The identity guide: logo variations, colour rules, typography, imagery, social and document styling, correct and incorrect usage.', href: '/playbook', cta: 'Read the playbook' },
  { n: '03', t: 'Voice & knowledge', d: 'A copy-ready brand brief for ChatGPT and content tools, with verified facts separated from items that still need confirming.', href: '/voice', cta: 'Copy the brief' },
  { n: '04', t: 'Template library', d: nT + ' templates — social, stories, carousels, banners, avatars, ads, web, article banners, emails and multi-page documents.', href: '/templates', cta: 'Browse templates' },
  { n: '05', t: 'Asset library', d: 'Logo sizes, avatars, app icons, fonts and licences, motifs and placeholder textures — individually or as a ZIP.', href: '/assets', cta: 'Download assets' },
  { n: '06', t: 'Article banners', d: 'Type a title and subtitle, choose X (5:2), LinkedIn, Medium, blog or newsletter — get an editable branded banner.', href: '/templates#banner-generator', cta: 'Generate a banner' },
];

export function StudioHome() {
  const ix = useStored<Record<string, IndexEntry>>('ns:index', {});
  const recent = ix ? Object.entries(ix).sort((a, b) => b[1].updated - a[1].updated).slice(0, 8) : [];
  return (
    <div className="s-page">
      <StudioHeader current="home" />
      <section className={css.hero}>
        <div className={css.heroIn}>
          <div className={css.heroText}>
            <p className={css.heroEyebrow}>Brand studio</p>
            <h1 className={css.heroH1}>Design, write and export — on brand.</h1>
            <p className={css.heroLead}>The design system, playbook, voice reference, assets and a working editor for every Nonso Stitches graphic and document.</p>
            <div className="s-row">
              <Link href="/templates" className={css.ctaLight}>Start from a template</Link>
              <Link href="/voice" className={css.ctaGhost}>Copy the brand brief</Link>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo/nonso-stitches-badge-512.png" alt="Nonso Stitches badge" className={css.heroBadge} width={280} height={280} />
        </div>
      </section>
      <main id="main" className={`s-main ${css.main}`}>
        <div className={css.areas}>
          {areas.map(a => (
            <Link key={a.n} href={a.href} className={css.area}>
              <span className={css.areaN}>{a.n}</span>
              <strong className={css.areaT}>{a.t}</strong>
              <span className={css.areaD}>{a.d}</span>
              <span className={css.areaCta}>{a.cta}</span>
            </Link>
          ))}
        </div>
        <section className={css.block}>
          <div className="s-section-head" style={{ marginBottom: 12 }}><h2 className="s-h2">Recently edited</h2><span className="s-muted" style={{ fontSize: 13 }}>Saved in this browser</span></div>
          {ix && !recent.length && <p className="s-muted" style={{ margin: 0, fontSize: 15 }}>Nothing yet. Open any template and your edits will appear here.</p>}
          <ul className={css.recent}>
            {recent.map(([id, r]) => (
              <li key={id}><a href={editorHref(id)}>{r.name}</a><span>{new Date(r.updated).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span></li>
            ))}
          </ul>
        </section>
        <section className={`${css.block} ${css.info}`}>
          <div className="s-rule-top"><h3 className="s-h3">Where your work is saved</h3><p className="s-small" style={{ margin: 0 }}>Edits save automatically to this browser’s local storage. Export finished files to keep them — clearing browser data removes local edits. Large uploaded photos are resized to 2000 px to fit storage.</p></div>
          <div className="s-rule-top"><h3 className="s-h3">Before you publish</h3><p className="s-small" style={{ margin: 0 }}>Templates contain [square-bracket placeholders] wherever a fact is not yet confirmed — prices, dates, names, contact details, statistics. Replace them all before posting or sending.</p></div>
          <div className="s-rule-top"><h3 className="s-h3">Exports</h3><p className="s-small" style={{ margin: 0 }}>PNG, JPEG, SVG, PDF, PowerPoint, Word, EPUB, HTML, email HTML, Markdown and text — per page, per document, or in bulk as a ZIP from the template library.</p></div>
        </section>
      </main>
    </div>
  );
}
