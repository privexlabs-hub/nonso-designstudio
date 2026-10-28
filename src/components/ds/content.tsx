/* Design system — content: ImageFrame, EditorialCard, TestimonialCard, InfoPanel, ServiceCard. Port of _ds_bundle.js (components/content). */
import type { CSSProperties, ReactNode } from 'react';
import { Button, Divider, Icon } from './core';

export type FrameRatio = '4:5' | '3:4' | '2:3' | '1:1' | '3:2' | '16:9' | '9:16' | '5:4';
const PT: Record<string, number> = { '4:5': 125, '3:4': 133.33, '2:3': 150, '1:1': 100, '3:2': 66.67, '16:9': 56.25, '9:16': 177.78, '5:4': 80 };
export interface ImageFrameProps { src?: string; alt?: string; ratio?: FrameRatio; shot?: string; kind?: string; caption?: ReactNode; credit?: ReactNode; marks?: boolean; tone?: 'light' | 'dark'; style?: CSSProperties; className?: string }
export function ImageFrame({ src, alt = '', ratio = '4:5', shot, kind = 'Photo', caption, credit, marks = false, tone = 'light', style, className = '' }: ImageFrameProps) {
  return (
    <figure className={'ns-frame' + (tone === 'dark' ? ' ns-frame--dark' : '') + ' ' + className} style={style}>
      <div className={'ns-frame__media' + (marks ? ' ns-frame__marks' : '')} style={{ paddingTop: (PT[ratio] || 125) + '%', overflow: marks ? 'visible' : 'hidden' }}>
        {marks && <i />}
        {src
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={src} alt={alt} loading="lazy" />
          : <div className="ns-frame__ph" role="img" aria-label={alt || shot || 'Image placeholder'}><span className="ns-frame__phk">{kind} · {ratio}</span>{shot && <span className="ns-frame__phd">{shot}</span>}</div>}
      </div>
      {(caption || credit) && <figcaption className="ns-frame__cap"><span>{caption}</span>{credit && <span>{credit}</span>}</figcaption>}
    </figure>
  );
}

export function EditorialCard({ eyebrow, title, excerpt, image, href = '#', layout = 'stack', meta }: { eyebrow?: ReactNode; title: ReactNode; excerpt?: ReactNode; image?: ImageFrameProps; href?: string; layout?: 'stack' | 'row'; meta?: ReactNode }) {
  return (
    <a className={'ns-card ns-editorial' + (layout === 'row' ? ' ns-editorial--row' : '')} href={href}>
      <ImageFrame ratio={layout === 'row' ? '1:1' : '3:4'} {...image} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {eyebrow && <span className="ns-card__eyebrow">{eyebrow}</span>}
        <h3 className="ns-card__title">{title}</h3>
        {excerpt && <p className="ns-card__body">{excerpt}</p>}
        {meta && <span className="ns-caption" style={{ color: 'var(--color-text-secondary)' }}>{meta}</span>}
      </div>
    </a>
  );
}

export function TestimonialCard({ quote, name, context, avatar, tone = 'light' }: { quote: ReactNode; name: ReactNode; context?: ReactNode; avatar?: string; tone?: 'light' | 'dark' }) {
  return (
    <figure className={'ns-card ns-testimonial' + (tone === 'dark' ? ' ns-testimonial--dark ns-on-dark' : '')} style={{ margin: 0 }}>
      <blockquote className="ns-testimonial__q">“{quote}”</blockquote>
      <Divider variant="stitch" />
      <figcaption className="ns-testimonial__who">
        {avatar !== undefined && (avatar
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={avatar} alt="" />
          : <span className="ns-testimonial__av" aria-hidden="true" />)}
        <span><span className="ns-testimonial__name" style={{ display: 'block' }}>{name}</span>{context && <span className="ns-testimonial__ctx">{context}</span>}</span>
      </figcaption>
    </figure>
  );
}

export function InfoPanel({ icon, title, children, rows = [], tone = 'linen', action }: { icon?: string; title: ReactNode; children?: ReactNode; rows?: [ReactNode, ReactNode][]; tone?: 'linen' | 'ink' | 'outline'; action?: ReactNode }) {
  return (
    <section className={'ns-info' + (tone === 'ink' ? ' ns-info--ink ns-on-dark' : tone === 'outline' ? ' ns-info--outline' : '')}>
      <div className="ns-info__head">{icon && <Icon name={icon} />}<h3 className="ns-info__title">{title}</h3></div>
      {children && <p className="ns-info__body">{children}</p>}
      {rows.length > 0 && <dl className="ns-info__rows">{rows.map((r, i) => <div className="ns-info__row" key={i}><dt>{r[0]}</dt><dd>{r[1]}</dd></div>)}</dl>}
      {action}
    </section>
  );
}

export function ServiceCard({ index, title, description, meta = [], image, cta = 'Enquire', onCta, variant = 'rule' }: { index?: ReactNode; title: ReactNode; description: ReactNode; meta?: string[]; image?: ImageFrameProps; cta?: ReactNode; onCta?: () => void; variant?: 'rule' | 'panel' }) {
  return (
    <article className={'ns-card ns-service' + (variant === 'panel' ? ' ns-service--panel' : '')}>
      {image && <ImageFrame ratio="4:5" {...image} />}
      <div className="ns-service__head"><h3 className="ns-card__title">{title}</h3>{index && <span className="ns-service__num">{index}</span>}</div>
      <p className="ns-card__body">{description}</p>
      {meta.length > 0 && <div className="ns-card__meta">{meta.map(m => <span key={m}>{m}</span>)}</div>}
      {cta && <div><Button variant="tertiary" icon="arrow-right" onClick={onCta}>{cta}</Button></div>}
    </article>
  );
}
