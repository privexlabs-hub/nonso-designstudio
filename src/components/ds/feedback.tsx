'use client';
/* Design system — feedback: Accordion, Alert, Modal. Port of _ds_bundle.js (components/feedback). */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Icon, IconButton } from './core';

export function Accordion({ items = [], multiple = false, defaultOpen = [] }: { items?: { q: ReactNode; a: ReactNode }[]; multiple?: boolean; defaultOpen?: number[] }) {
  const [open, setOpen] = useState(defaultOpen);
  const uid = useId().replace(/:/g, '');
  const t = (i: number) => setOpen(o => o.includes(i) ? o.filter(x => x !== i) : multiple ? [...o, i] : [i]);
  return (
    <div className="ns-acc">
      {items.map((it, i) => {
        const on = open.includes(i);
        return (
          <div className="ns-acc__item" key={i}>
            <h3 style={{ margin: 0 }}>
              <button className="ns-acc__btn" aria-expanded={on} aria-controls={`acc-p${uid}${i}`} id={`acc-b${uid}${i}`} onClick={() => t(i)}>{it.q}<Icon name={on ? 'minus' : 'plus'} /></button>
            </h3>
            {on && <div className="ns-acc__panel" id={`acc-p${uid}${i}`} role="region" aria-labelledby={`acc-b${uid}${i}`}>{it.a}</div>}
          </div>
        );
      })}
    </div>
  );
}

export type AlertTone = 'info' | 'success' | 'warning' | 'error' | 'neutral';
const IC: Record<AlertTone, string> = { info: 'info', success: 'circle-check', warning: 'triangle-alert', error: 'circle-alert', neutral: 'bell' };
export function Alert({ tone = 'info', title, children, onDismiss, action }: { tone?: AlertTone; title?: ReactNode; children?: ReactNode; onDismiss?: () => void; action?: ReactNode }) {
  return (
    <div className={'ns-alert ns-alert--' + tone} role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}>
      <Icon name={IC[tone]} />
      <div className="ns-alert__c">
        {title && <p className="ns-alert__t">{title}</p>}
        {children && <p className="ns-alert__m">{children}</p>}
        {action && <div style={{ marginTop: 8 }}>{action}</div>}
      </div>
      {onDismiss && <IconButton icon="x" label="Dismiss" size="sm" onClick={onDismiss} />}
    </div>
  );
}

export function Modal({ open, onClose, title, children, actions, inline = false }: { open: boolean; onClose?: () => void; title: ReactNode; children?: ReactNode; actions?: ReactNode; inline?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const tid = useId();
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close.current?.(); };
    document.addEventListener('keydown', k);
    (ref.current?.querySelector('button,a,input,select,textarea') as HTMLElement | null)?.focus();
    return () => document.removeEventListener('keydown', k);
  }, [open]);
  if (!open) return null;
  return (
    <div className={'ns-modal' + (inline ? ' ns-modal--inline' : '')} onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="ns-modal__panel" role="dialog" aria-modal="true" aria-labelledby={tid} ref={ref}>
        <div className="ns-modal__head"><h2 className="ns-modal__title" id={tid}>{title}</h2>{onClose && <IconButton icon="x" label="Close" onClick={onClose} />}</div>
        <div className="ns-modal__body">{children}</div>
        {actions && <div className="ns-modal__foot">{actions}</div>}
      </div>
    </div>
  );
}
