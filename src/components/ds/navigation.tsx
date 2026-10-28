'use client';
/* Design system — navigation: Breadcrumbs, ProgressSteps, SiteFooter, SiteHeader. Port of _ds_bundle.js (components/navigation). */
import { useState, type MouseEvent, type ReactNode } from 'react';
import { Button, IconButton } from './core';

export function Breadcrumbs({ items = [] }: { items?: { label: ReactNode; href?: string; onClick?: (e: MouseEvent) => void }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="ns-crumbs">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} style={{ display: 'contents' }}>
              {last ? <span aria-current="page">{it.label}</span> : <a href={it.href || '#'} onClick={it.onClick}>{it.label}</a>}
              {!last && <span className="ns-crumbs__sep" aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function ProgressSteps({ steps = [], current = 0 }: { steps?: string[]; current?: number }) {
  return (
    <ol className="ns-steps" aria-label={'Step ' + (current + 1) + ' of ' + steps.length}>
      {steps.map((s, i) => {
        const st = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={s} className="ns-steps__item" data-state={st} aria-current={st === 'current' ? 'step' : undefined}>
            <span className="ns-steps__bar" />
            <span className="ns-steps__label"><span className="ns-steps__num">{String(i + 1).padStart(2, '0')}</span><span className="ns-steps__text">{s}</span></span>
          </li>
        );
      })}
    </ol>
  );
}

export function SiteFooter({ logoSrc, address = ['Nonso Stitches Studio', 'Enugu, Nigeria'], phone = '+234 800 000 0000', whatsapp = '+234 800 000 0000', email = 'hello@nonsostitches.com',
  hours = ['Mon–Fri · 9:00–18:00', 'Sat · 10:00–16:00', 'Fittings by appointment'], services = ['Custom menswear', 'Custom womenswear', 'Traditional & occasion wear', 'Alterations & repairs'] }:
  { logoSrc?: string; address?: string[]; phone?: string; whatsapp?: string; email?: string; hours?: string[]; services?: string[] }) {
  return (
    <footer className="ns-footer ns-on-dark">
      <div className="ns-footer__inner">
        <div className="ns-footer__brandcol">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logoSrc && <img className="ns-logo-tile" src={logoSrc} alt="Nonso Stitches logo" width={112} height={112} />}
          <p className="ns-footer__tag">Clothing thoughtfully made to fit you, your style and your life.</p>
        </div>
        <div><h2 className="ns-footer__h">Services</h2><ul className="ns-footer__list">{services.map(s => <li key={s}><a href="#">{s}</a></li>)}</ul></div>
        <div><h2 className="ns-footer__h">Contact</h2><ul className="ns-footer__list">
          <li><a href={'https://wa.me/' + whatsapp.replace(/\D/g, '')}>WhatsApp {whatsapp}</a></li>
          <li><a href={'tel:' + phone.replace(/\s/g, '')}>{phone}</a></li>
          <li><a href={'mailto:' + email}>{email}</a></li>
        </ul></div>
        <div><h2 className="ns-footer__h">Studio</h2><ul className="ns-footer__list">{address.map(a => <li key={a}>{a}</li>)}{hours.map(h => <li key={h}>{h}</li>)}</ul></div>
        <div className="ns-footer__base"><span>© {new Date().getFullYear()} Nonso Stitches</span><span>Men · Women · Custom wear</span></div>
      </div>
    </footer>
  );
}

export interface HeaderLink { label: string; href?: string; active?: boolean }
export function SiteHeader({ links = [], ctaLabel = 'Book a fitting', onCta, logoSrc, tone = 'light', mobile = false, onNavigate, showName = true }:
  { links?: HeaderLink[]; ctaLabel?: ReactNode; onCta?: () => void; logoSrc?: string; tone?: 'light' | 'dark'; mobile?: boolean; onNavigate?: (l: HeaderLink) => void; showName?: boolean }) {
  const [open, setOpen] = useState(false);
  const go = (l: HeaderLink) => (e: MouseEvent) => { if (onNavigate) { e.preventDefault(); onNavigate(l); setOpen(false); } };
  const linkEls = links.map(l => <a key={l.label} className="ns-header__link" href={l.href || '#'} aria-current={l.active ? 'page' : undefined} onClick={go(l)}>{l.label}</a>);
  return (
    <header className={'ns-header' + (tone === 'dark' ? ' ns-header--dark ns-on-dark' : '') + (mobile ? ' ns-header--mobile' : '')}>
      <div className="ns-header__bar">
        <a className="ns-header__brand" href="#" onClick={go({ label: 'Home', href: '#' })} aria-label="Nonso Stitches — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logoSrc && <img className="ns-logo-tile" src={logoSrc} alt="" width={mobile ? 44 : 52} height={mobile ? 44 : 52} />}
          {showName && <span className="ns-header__name">Nonso Stitches</span>}
        </a>
        <nav className="ns-header__nav" aria-label="Main">{linkEls}</nav>
        <span className="ns-header__cta"><Button variant={tone === 'dark' ? 'inverse' : 'primary'} size="sm" onClick={onCta}>{ctaLabel}</Button></span>
        <span className="ns-header__menu"><IconButton icon={open ? 'x' : 'menu'} label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)} /></span>
      </div>
      <nav className="ns-header__drawer" data-open={open} aria-label="Mobile">
        {linkEls}
        <Button variant={tone === 'dark' ? 'inverse' : 'primary'} fullWidth onClick={onCta}>{ctaLabel}</Button>
      </nav>
    </header>
  );
}
