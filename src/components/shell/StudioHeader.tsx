'use client';
import Link from 'next/link';
import { nav } from '@/lib/core';
import { toggleTheme, useTheme } from '@/lib/theme';

export type NavId = (typeof nav)[number]['id'];

/** Shared studio header: badge + wordmark, main nav (scrolling strip on narrow screens) and theme switch. */
export function StudioHeader({ current }: { current: NavId }) {
  return (
    <>
      <a className="s-skip" href="#main">Skip to content</a>
      <header className="s-header">
        <Link href="/" className="s-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo/nonso-stitches-badge-120.png" alt="Nonso Stitches" width={44} height={44} />
          <span className="s-brand__text"><span className="s-brand__name">NONSO STITCHES</span><span className="s-brand__sub">Brand studio</span></span>
        </Link>
        <nav aria-label="Main" className="s-nav">
          {nav.map(n => (
            <Link key={n.id} href={n.href} aria-current={n.id === current ? 'page' : undefined}>{n.label}</Link>
          ))}
        </nav>
        <ThemeButton />
      </header>
    </>
  );
}

export function ThemeButton({ className = 's-theme-btn' }: { className?: string }) {
  const theme = useTheme();
  return (
    <button type="button" className={className} onClick={toggleTheme} aria-label="Switch colour theme">
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
