'use client';
/* Design system — forms: Checkbox, Radio, field Shell, MeasurementField, Select, TextArea, TextField. Port of _ds_bundle.js (components/forms). */
import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Icon } from './core';

type InputRest = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function Checkbox({ label, description, error, disabled, ...rest }: InputRest & { label: ReactNode; description?: ReactNode; error?: boolean }) {
  return (
    <label className={'ns-choice' + (error ? ' ns-choice--error' : '') + (disabled ? ' ns-choice--disabled' : '')}>
      <input type="checkbox" disabled={disabled} {...rest} />
      <span className="ns-choice__box"><Icon name="check" /></span>
      <span>{label}{description && <span className="ns-choice__desc">{description}</span>}</span>
    </label>
  );
}

export function Radio({ label, description, disabled, ...rest }: InputRest & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className={'ns-choice ns-choice--radio' + (disabled ? ' ns-choice--disabled' : '')}>
      <input type="radio" disabled={disabled} {...rest} />
      <span className="ns-choice__box" />
      <span>{label}{description && <span className="ns-choice__desc">{description}</span>}</span>
    </label>
  );
}

/** Label + control + hint/error message wrapper shared by every text-like field. */
export function Shell({ id, label, optional, hint, error, success, disabled, extra, children }: { id: string; label: ReactNode; optional?: boolean; hint?: ReactNode; error?: ReactNode; success?: ReactNode; disabled?: boolean; extra?: ReactNode; children: ReactNode }) {
  const msg = error || success || hint;
  const st = error ? ' ns-field--error' : success ? ' ns-field--success' : '';
  return (
    <div className={'ns-field' + st + (disabled ? ' ns-field--disabled' : '')}>
      <div className="ns-field__top"><label className="ns-field__label" htmlFor={id}>{label}{optional && <span className="ns-field__opt"> (optional)</span>}</label>{extra}</div>
      {children}
      {msg && <div className="ns-field__hint" id={id + '-msg'} role={error ? 'alert' : undefined}>{(error || success) && <Icon name={error ? 'circle-alert' : 'circle-check'} />}<span>{msg}</span></div>}
    </div>
  );
}
const useFid = (id?: string) => { const auto = useId(); return id || 'f' + auto.replace(/:/g, ''); };

export function MeasurementField({ label, hint, error, optional, unit: unitProp, defaultUnit = 'in', onUnitChange, onGuide, id, ...rest }: InputRest & { label: string; hint?: ReactNode; error?: ReactNode; optional?: boolean; unit?: 'in' | 'cm'; defaultUnit?: 'in' | 'cm'; onUnitChange?: (u: 'in' | 'cm') => void; onGuide?: () => void }) {
  const fid = useFid(id);
  const [u, setU] = useState(defaultUnit);
  const unit = unitProp || u;
  const pick = (v: 'in' | 'cm') => { setU(v); onUnitChange?.(v); };
  const extra = onGuide ? <button type="button" className="ns-btn ns-btn--tertiary" style={{ minHeight: 24, fontSize: 11 }} onClick={onGuide}><span className="ns-btn__label">How to measure</span></button> : null;
  return (
    <Shell id={fid} label={label} optional={optional} hint={hint} error={error} extra={extra}>
      <div className="ns-field__control">
        <input id={fid} className="ns-field__input" type="text" inputMode="decimal" placeholder="0.0" aria-invalid={!!error || undefined} aria-describedby={error || hint ? fid + '-msg' : undefined} style={{ fontVariantNumeric: 'tabular-nums' }} {...rest} />
        <div className="ns-unit" role="group" aria-label={label + ' unit'}>
          {(['in', 'cm'] as const).map(v => <button key={v} type="button" aria-pressed={unit === v} onClick={() => pick(v)}>{v}</button>)}
        </div>
      </div>
      <div className="ns-measure-ticks" aria-hidden="true" />
    </Shell>
  );
}

export function Select({ label, options = [], placeholder, hint, error, optional, disabled, id, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: ReactNode; options?: (string | { value: string; label: string })[]; placeholder?: string; hint?: ReactNode; error?: ReactNode; optional?: boolean }) {
  const fid = useFid(id);
  return (
    <Shell id={fid} label={label} optional={optional} hint={hint} error={error} disabled={disabled}>
      <div className="ns-field__control">
        <select id={fid} className="ns-field__input" disabled={disabled} aria-invalid={!!error || undefined} defaultValue={placeholder && rest.value === undefined ? '' : undefined} {...rest}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(o => typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="ns-field__chev"><Icon name="chevron-down" size={18} /></span>
      </div>
    </Shell>
  );
}

export function TextArea({ label, hint, error, optional, disabled, rows = 5, id, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: ReactNode; hint?: ReactNode; error?: ReactNode; optional?: boolean }) {
  const fid = useFid(id);
  return (
    <Shell id={fid} label={label} optional={optional} hint={hint} error={error} disabled={disabled}>
      <div className="ns-field__control">
        <textarea id={fid} rows={rows} className="ns-field__input" disabled={disabled} aria-invalid={!!error || undefined} aria-describedby={error || hint ? fid + '-msg' : undefined} {...rest} />
      </div>
    </Shell>
  );
}

export function TextField({ label, type = 'text', icon, hint, error, success, optional, disabled, id, ...rest }: InputRest & { label: ReactNode; type?: 'text' | 'email' | 'tel' | 'number' | 'date'; icon?: string; hint?: ReactNode; error?: ReactNode; success?: ReactNode; optional?: boolean }) {
  const fid = useFid(id);
  const mode: Partial<InputHTMLAttributes<HTMLInputElement>> = type === 'tel' ? { inputMode: 'tel', autoComplete: 'tel' } : type === 'email' ? { inputMode: 'email', autoComplete: 'email' } : {};
  return (
    <Shell id={fid} label={label} optional={optional} hint={hint} error={error} success={success} disabled={disabled}>
      <div className="ns-field__control">
        {icon && <span className="ns-field__lead"><Icon name={icon} size={18} /></span>}
        <input id={fid} className="ns-field__input" type={type} disabled={disabled} aria-invalid={!!error || undefined} aria-describedby={error || success || hint ? fid + '-msg' : undefined} {...mode} {...rest} />
      </div>
    </Shell>
  );
}
