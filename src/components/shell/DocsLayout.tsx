import type { ReactNode } from 'react';

/** Sticky numbered section nav + content column (Design system, Playbook). Becomes a sticky chip strip under 900px. */
export function DocsLayout({ title, label, sections, children }: { title: string; label: string; sections: [string, string][]; children: ReactNode }) {
  return (
    <div className="s-docs">
      <aside className="s-docs__aside">
        <p className="s-eyebrow">{title}</p>
        <nav aria-label={label} className="s-docs__nav">
          {sections.map(([id, l], i) => <a key={id} href={'#' + id}><span>{String(i + 1).padStart(2, '0')}</span><span>{l}</span></a>)}
        </nav>
      </aside>
      <main id="main" className="s-docs__main">{children}</main>
    </div>
  );
}

/** Numbered documentation section: kicker, heading, optional intro. */
export function DocSection({ id, kicker, title, intro, first, children, h1 }: { id: string; kicker: string; title: ReactNode; intro?: ReactNode; first?: boolean; h1?: boolean; children?: ReactNode }) {
  const H = h1 ? 'h1' : 'h2';
  return (
    <section id={id} className={'d-sec' + (first ? ' d-sec--first' : '')}>
      <p className="d-kicker">{kicker}</p>
      <H className={h1 ? 'd-h1' : 'd-h2'}>{title}</H>
      {intro && <p className="d-intro">{intro}</p>}
      {children}
    </section>
  );
}
