/* Design system — core: Icon, Button, IconButton, Badge, Divider. Port of _ds_bundle.js (components/core). */
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

/** Lucide icon drawn as a currentColor mask (self-hosted lucide-static 0.460.0 in /icons). */
export function Icon({ name, size = 20, label, style, className = '' }: { name: string; size?: number; label?: string; style?: CSSProperties; className?: string }) {
  return <span className={'ns-icon ' + className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
    style={{ ['--ns-icon-url' as string]: `url(/icons/${name}.svg)`, width: size, height: size, ...style }} />;
}

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'outline-inverse' | 'tertiary-inverse' | 'whatsapp';
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg'; icon?: string; iconPosition?: 'start' | 'end'; loading?: boolean; fullWidth?: boolean; href?: string; type?: 'button' | 'submit';
}
export function Button({ variant = 'primary', size = 'md', icon, iconPosition = 'end', loading = false, disabled = false, fullWidth = false, href, children, className = '', type = 'button', ...rest }: ButtonProps) {
  const cls = ['ns-btn', 'ns-btn--' + variant, size !== 'md' && 'ns-btn--' + size, fullWidth && 'ns-btn--full', className].filter(Boolean).join(' ');
  const ic = loading ? <Icon name="loader-circle" className="ns-btn__spin" /> : icon ? <Icon name={icon} /> : null;
  const inner = <>{iconPosition === 'start' && ic}<span className="ns-btn__label">{children}</span>{iconPosition === 'end' && ic}</>;
  if (href && !disabled) return <a className={cls} href={href} onClick={rest.onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}>{inner}</a>;
  return <button type={type} className={cls} disabled={disabled} aria-busy={loading || undefined} {...rest}>{inner}</button>;
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> { icon: string; label: string; variant?: 'ghost' | 'outline' | 'solid'; size?: 'sm' | 'md' }
export function IconButton({ icon, label, variant = 'ghost', size = 'md', className = '', ...rest }: IconButtonProps) {
  const cls = ['ns-iconbtn', variant !== 'ghost' && 'ns-iconbtn--' + variant, size === 'sm' && 'ns-iconbtn--sm', className].filter(Boolean).join(' ');
  return <button type="button" className={cls} aria-label={label} title={label} {...rest}><Icon name={icon} /></button>;
}

export type BadgeTone = 'neutral' | 'ink' | 'gold' | 'outline' | 'success' | 'warning' | 'error' | 'info';
export function Badge({ tone = 'neutral', dot = false, children }: { tone?: BadgeTone; dot?: boolean; children?: ReactNode }) {
  return <span className={'ns-badge ns-badge--' + tone}>{dot && <span className="ns-badge__dot" aria-hidden="true" />}{children}</span>;
}

export function Divider({ variant = 'rule', label, style }: { variant?: 'rule' | 'stitch' | 'measure'; label?: ReactNode; style?: CSSProperties }) {
  return (
    <div className={'ns-divider ns-divider--' + variant} role="separator" style={style}>
      <span className="ns-divider__line" />
      {label && <><span className="ns-divider__label">{label}</span><span className="ns-divider__line" /></>}
    </div>
  );
}
