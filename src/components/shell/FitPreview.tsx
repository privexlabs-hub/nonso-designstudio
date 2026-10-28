'use client';
import { useEffect, useRef } from 'react';

/** Renders artwork HTML at its native size (w × h) lazily when near the viewport, scaled to the element's width.
 *  React port of the <ns-fit> custom element. `html` is renderer output (all user text escaped). */
export function FitPreview({ w, h, html, className, style, label }: { w: number; h: number; html: string; className?: string; style?: React.CSSProperties; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRef(false);
  const painted = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const fit = () => { const c = el.firstElementChild as HTMLElement | null; if (!c) return; const s = el.clientWidth / w; if (!s) return;
      Object.assign(c.style, { position: 'absolute', left: '0', top: '0', transformOrigin: '0 0', transform: `scale(${s})` }); };
    const paint = () => { if (painted.current === html) return; painted.current = html; el.innerHTML = html; fit(); };
    if (shown.current) paint();
    const ro = new ResizeObserver(fit); ro.observe(el);
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { shown.current = true; paint(); } }, { rootMargin: '600px' });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, [html, w]);

  return <div ref={ref} className={className} role={label ? 'img' : undefined} aria-label={label}
    style={{ display: 'block', position: 'relative', overflow: 'hidden', width: '100%', aspectRatio: `${w}/${h}`, ...style }} />;
}
