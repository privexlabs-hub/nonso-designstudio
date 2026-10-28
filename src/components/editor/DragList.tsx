'use client';
/* Reorderable list driven by pointer events, so it works with mouse, pen and touch (HTML5 drag-and-drop never fires on touch).
   Each row gets a grip: drag it, or focus it and use the arrow keys. */
import { useRef, useState, type ReactNode } from 'react';
import css from './Editor.module.css';

export function DragList({ count, onMove, renderItem, className, label }: { count: number; onMove: (from: number, to: number) => void; renderItem: (i: number, grip: ReactNode) => ReactNode; className?: string; label: string }) {
  const listRef = useRef<HTMLOListElement>(null);
  /* `slot` is the insertion gap under the pointer (0…count); the final index accounts for the dragged row leaving its place */
  const [drag, setDrag] = useState<{ from: number; slot: number } | null>(null);
  const slotAt = (y: number) => ([...(listRef.current?.children || [])] as HTMLElement[]).filter(r => { const b = r.getBoundingClientRect(); return y > b.top + b.height / 2; }).length;
  const finalIndex = (d: { from: number; slot: number }) => d.slot > d.from ? d.slot - 1 : d.slot;
  const grip = (i: number) => (
    <span role="button" tabIndex={0} className={css.grip} aria-label={`Reorder item ${i + 1} — drag, or use the arrow keys`} title="Drag to reorder"
      onPointerDown={e => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); setDrag({ from: i, slot: i }); }}
      onPointerMove={e => { if (!drag) return; const slot = slotAt(e.clientY); if (slot !== drag.slot) setDrag({ ...drag, slot }); }}
      onPointerUp={() => { if (drag && finalIndex(drag) !== drag.from) onMove(drag.from, finalIndex(drag)); setDrag(null); }}
      onPointerCancel={() => setDrag(null)}
      onKeyDown={e => { if (e.key === 'ArrowUp' && i > 0) { e.preventDefault(); onMove(i, i - 1); } if (e.key === 'ArrowDown' && i < count - 1) { e.preventDefault(); onMove(i, i + 1); } }}>⋮⋮</span>
  );
  return (
    <ol ref={listRef} className={className} aria-label={label} data-dragging={drag ? '' : undefined}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className={css.dragRow} data-from={drag?.from === i || undefined}
          data-drop={drag && finalIndex(drag) !== drag.from ? (drag.slot === i ? 'before' : drag.slot === count && i === count - 1 ? 'after' : undefined) : undefined}>
          {renderItem(i, grip(i))}
        </li>
      ))}
    </ol>
  );
}
