'use client';
/* Design system — customer: BeforeAfter, CTABanner, ContactCard, Gallery, MeasurementGuide, ServiceOption. Port of _ds_bundle.js (components/customer). */
import { useState, type ChangeEventHandler, type CSSProperties, type ReactNode } from 'react';
import { Badge, Icon, IconButton } from './core';
import { ImageFrame, type FrameRatio, type ImageFrameProps } from './content';

export function BeforeAfter({ before = {}, after = {}, ratio = '4:5', start = 50, caption }: { before?: ImageFrameProps; after?: ImageFrameProps; ratio?: '4:5' | '1:1' | '3:4' | '3:2'; start?: number; caption?: ReactNode }) {
  const [v, setV] = useState(start);
  const pt = ({ '4:5': 125, '1:1': 100, '3:4': 133.33, '3:2': 66.67 } as Record<string, number>)[ratio] || 125;
  return (
    <figure className="ns-ba" style={{ margin: 0, ['--ba' as string]: v + '%' } as CSSProperties}>
      <div className="ns-ba__stage" style={{ paddingTop: pt + '%' }}>
        <div className="ns-ba__layer"><ImageFrame ratio={ratio} kind="After" {...after} /></div>
        <div className="ns-ba__layer ns-ba__before"><ImageFrame ratio={ratio} kind="Before" tone="dark" {...before} /></div>
        <span className="ns-ba__tag ns-ba__tag--b"><Badge tone="ink">Before</Badge></span>
        <span className="ns-ba__tag ns-ba__tag--a"><Badge tone="neutral">After</Badge></span>
        <input className="ns-ba__range" type="range" min="0" max="100" value={v} onChange={e => setV(+e.target.value)} aria-label="Compare before and after" />
        <span className="ns-ba__handle"><span className="ns-ba__knob"><Icon name="chevron-left" /><Icon name="chevron-right" /></span></span>
      </div>
      {caption && <figcaption className="ns-frame__cap"><span>{caption}</span></figcaption>}
    </figure>
  );
}

export function CTABanner({ eyebrow, title, body, actions, image, tone = 'ink' }: { eyebrow?: ReactNode; title: ReactNode; body?: ReactNode; actions?: ReactNode; image?: ImageFrameProps; tone?: 'ink' | 'light' }) {
  return (
    <section className={'ns-cta' + (tone === 'light' ? ' ns-cta--light' : ' ns-on-dark') + (image ? '' : ' ns-cta--noimg')}>
      <div className="ns-cta__c">
        {eyebrow && <span className="ns-cta__eyebrow">{eyebrow}</span>}
        <h2 className="ns-cta__h">{title}</h2>
        {body && <p className="ns-cta__p">{body}</p>}
        {actions && <div className="ns-cta__acts">{actions}</div>}
      </div>
      {image && <ImageFrame ratio="5:4" tone={tone === 'light' ? 'light' : 'dark'} {...image} />}
    </section>
  );
}

export function ContactCard({ whatsapp = '+234 800 000 0000', phone = '+234 800 000 0000', email = 'hello@nonsostitches.com', address = 'Studio visits by appointment · Enugu' }: { whatsapp?: string; phone?: string; email?: string; address?: string }) {
  const rows = [
    { k: 'WhatsApp — fastest reply', v: whatsapp, ic: 'message-circle', wa: true, href: 'https://wa.me/' + whatsapp.replace(/\D/g, '') },
    { k: 'Call', v: phone, ic: 'phone', href: 'tel:' + phone.replace(/\s/g, '') },
    { k: 'Email', v: email, ic: 'mail', href: 'mailto:' + email },
    { k: 'Visit', v: address, ic: 'map-pin', href: '#' },
  ];
  return (
    <div className="ns-contact">
      {rows.map(r => (
        <a key={r.k} className="ns-contact__row" href={r.href}>
          <span className={'ns-contact__ic' + (r.wa ? ' ns-contact__ic--wa' : '')}><Icon name={r.ic} /></span>
          <span><span className="ns-contact__k" style={{ display: 'block' }}>{r.k}</span><span className="ns-contact__v">{r.v}</span></span>
          <Icon name="arrow-right" className="ns-contact__go" />
        </a>
      ))}
    </div>
  );
}

export type GalleryImage = ImageFrameProps & { ratio?: FrameRatio };
export function Gallery({ images = [], columns = 3, ratio = '4:5', inline = false }: { images?: GalleryImage[]; columns?: number; ratio?: FrameRatio; inline?: boolean }) {
  const [i, setI] = useState(-1);
  const n = images.length; const cur = images[i];
  return (
    <>
      <div className="ns-gallery" style={{ ['--cols' as string]: columns } as CSSProperties}>
        {images.map((im, k) => (
          <button key={k} className="ns-gallery__btn" onClick={() => setI(k)} aria-label={'Open ' + (im.alt || im.shot || 'image ' + (k + 1))}><ImageFrame ratio={im.ratio || ratio} {...im} /></button>
        ))}
      </div>
      {cur && (
        <div className={'ns-lightbox' + (inline ? ' ns-lightbox--inline' : '')} role="dialog" aria-modal="true" aria-label="Image viewer"
          onKeyDown={e => { if (e.key === 'Escape') setI(-1); if (e.key === 'ArrowRight') setI((i + 1) % n); if (e.key === 'ArrowLeft') setI((i - 1 + n) % n); }}>
          <div className="ns-lightbox__bar">
            <span>{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')} {cur.caption ? <>· {cur.caption}</> : ''}</span>
            <span className="ns-on-dark"><IconButton icon="x" label="Close" onClick={() => setI(-1)} /></span>
          </div>
          <div className="ns-lightbox__stage ns-on-dark">
            <IconButton icon="arrow-left" label="Previous" onClick={() => setI((i - 1 + n) % n)} />
            <ImageFrame tone="dark" ratio={cur.ratio || ratio} {...cur} caption={undefined} />
            <IconButton icon="arrow-right" label="Next" onClick={() => setI((i + 1) % n)} />
          </div>
        </div>
      )}
    </>
  );
}

export interface GuideStep { t: string; d: string; tip?: string }
const DEF: GuideStep[] = [
  { t: 'Chest / bust', d: 'Tape around the fullest part of the chest, under the arms, level across the back. Breathe normally.', tip: 'Snug, not tight' },
  { t: 'Waist', d: 'Around your natural waist — the narrowest point, usually just above the navel.', tip: 'One finger of ease' },
  { t: 'Hips', d: 'Around the fullest part of the hips and seat, feet together.', tip: 'Keep tape level' },
  { t: 'Sleeve', d: 'From the shoulder point, over a slightly bent elbow, to the wrist bone.', tip: 'Arm relaxed' },
];
export function MeasurementGuide({ steps = DEF }: { steps?: GuideStep[] }) {
  return (
    <ol className="ns-mguide">
      {steps.map((s, i) => (
        <li className="ns-mguide__i" key={s.t}>
          <span className="ns-mguide__n">{String(i + 1).padStart(2, '0')}</span>
          <h4 className="ns-mguide__t">{s.t}</h4>
          {s.tip && <span className="ns-mguide__tip"><Icon name="ruler" />{s.tip}</span>}
          <p className="ns-mguide__d">{s.d}</p>
        </li>
      ))}
    </ol>
  );
}

export function ServiceOption({ icon, title, description, meta, name, value, checked, defaultChecked, onChange, type = 'radio' }: { icon?: string; title: ReactNode; description?: ReactNode; meta?: ReactNode; name?: string; value?: string; checked?: boolean; defaultChecked?: boolean; onChange?: ChangeEventHandler<HTMLInputElement>; type?: 'radio' | 'checkbox' }) {
  return (
    <label className="ns-opt">
      <input type={type} name={name} value={value} checked={checked} defaultChecked={defaultChecked} onChange={onChange} />
      {icon && <span className="ns-opt__ic"><Icon name={icon} /></span>}
      <span style={{ paddingRight: 28 }}>
        <span className="ns-opt__t" style={{ display: 'block' }}>{title}</span>
        {description && <span className="ns-opt__d" style={{ display: 'block' }}>{description}</span>}
        {meta && <span className="ns-opt__m" style={{ display: 'block' }}>{meta}</span>}
      </span>
      <span className="ns-opt__chk" aria-hidden="true"><Icon name="check" /></span>
    </label>
  );
}
