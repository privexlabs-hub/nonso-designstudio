'use client';
/* Website UI kit — Home, Services and Inquiry screens. Port of _ds_bundle.js (ui_kits/website/*.jsx).
   Copy, sample prices and turnaround times are the design system's demo content, not confirmed brand facts. */
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Badge, Button, Divider } from './core';
import { ImageFrame, InfoPanel, ServiceCard, TestimonialCard } from './content';
import { BeforeAfter, CTABanner, ContactCard, Gallery, MeasurementGuide, ServiceOption } from './customer';
import { Accordion, Alert, Modal } from './feedback';
import { Checkbox, MeasurementField, Select, TextArea, TextField } from './forms';
import { Breadcrumbs, ProgressSteps, SiteFooter, SiteHeader } from './navigation';

export type KitScreen = 'home' | 'services' | 'inquiry';
type Go = (s: KitScreen) => void;
const col = (gridColumn: string, extra?: React.CSSProperties): React.CSSProperties => ({ gridColumn, ...extra });

export function HomeScreen({ go }: { go: Go }) {
  return (
    <main>
      <section className="ns-on-dark" style={{ background: 'var(--ns-ink)', color: 'var(--ns-chalk)' }}>
        <div className="ns-container kit-grid" style={{ paddingBlock: 'clamp(48px,6vw,96px)', alignItems: 'end' }}>
          <div style={col('1 / span 6', { display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 16 })}>
            <span className="ns-eyebrow" style={{ color: 'var(--ns-gold)' }}>Custom tailoring · Men &amp; women</span>
            <h1 className="ns-display" style={{ margin: 0 }}>Made to fit you.</h1>
            <p className="ns-body-lg" style={{ margin: 0, color: 'var(--ns-grey-400)', maxWidth: '40ch' }}>Everyday clothes, workwear and occasion pieces — cut from your measurements, finished with care, and made to feel as good as they look.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Button variant="inverse" size="lg" icon="arrow-right" onClick={() => go('inquiry')}>Book a fitting</Button>
              <Button variant="outline-inverse" size="lg" icon="message-circle" iconPosition="start">WhatsApp us</Button>
            </div>
          </div>
          <div style={col('8 / span 5')}><ImageFrame tone="dark" ratio="4:5" shot="Full-length: woman in a made-to-measure emerald two-piece, soft window light" caption="Two-piece set, made to measure" /></div>
        </div>
      </section>
      <section className="kit-sec ns-container">
        <div className="kit-grid" style={{ marginBottom: 48 }}>
          <div style={col('1 / span 5')}><span className="ns-eyebrow" style={{ color: 'var(--ns-bronze)' }}>What we do</span><h2 className="ns-h2" style={{ margin: '12px 0 0' }}>Thoughtful tailoring for everyday life and special occasions.</h2></div>
          <p className="ns-body-lg" style={col('7 / span 5', { margin: 0, color: 'var(--color-text-secondary)', alignSelf: 'end' })}>Bring a photo, a fabric or just an idea. We&apos;ll measure you, talk through fit and finish, and make it with you over one or two fittings.</p>
        </div>
        <div className="kit-grid">
          {([['01', 'Custom menswear', 'Suits, kaftans, senator and agbada — cut to your measurements.', ['From ₦85,000', '3–4 weeks'], 'Kaftan collar and placket detail'],
            ['02', 'Custom womenswear', 'Dresses, skirt sets and occasion wear, shaped to you.', ['From ₦70,000', '2–4 weeks'], 'Bodice darts pinned at a fitting'],
            ['03', 'Alterations', 'Hems, waists, sleeves and repairs for clothes you already love.', ['From ₦3,000', '3–5 days'], 'Trouser hem chalked for shortening']] as [string, string, string, string[], string][]).map(s => (
            <div key={s[0]} style={col('span 4')}><ServiceCard index={s[0]} title={s[1]} description={s[2]} meta={s[3]} image={{ shot: s[4] }} onCta={() => go('services')} cta="Learn more" /></div>
          ))}
        </div>
      </section>
      <section className="kit-sec" style={{ background: 'var(--ns-grey-100)' }}>
        <div className="ns-container kit-grid" style={{ alignItems: 'center' }}>
          <div style={col('1 / span 5')}><BeforeAfter before={{ shot: 'Blazer: sleeves 3cm too long, loose at the waist' }} after={{ shot: 'Sleeves shortened, waist taken in 2cm' }} caption="Blazer refit · ready in 4 days" /></div>
          <div style={col('7 / span 5', { display: 'flex', flexDirection: 'column', gap: 20 })}>
            <span className="ns-eyebrow" style={{ color: 'var(--ns-bronze)' }}>Alterations</span>
            <h2 className="ns-h2" style={{ margin: 0 }}>A better fit for clothes you already own.</h2>
            <p className="ns-body" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Drag to compare. Most alterations are ready in 3–5 days, and we&apos;ll tell you honestly if something isn&apos;t worth altering.</p>
            <Divider variant="measure" />
            <div><Button variant="secondary" onClick={() => go('inquiry')}>Request an alteration</Button></div>
          </div>
        </div>
      </section>
      <section className="kit-sec ns-container">
        <div className="kit-grid">
          <div style={col('1 / span 12', { marginBottom: 32 })}><Divider variant="stitch" label="From our customers" /></div>
          {[['It fits like it was made for me — because it was. I felt at ease all day.', 'Emeka A.', 'Wedding agbada · Enugu'], ['They listened to what I wanted and the dress moved exactly how I hoped.', 'Ifeoma N.', 'Occasion dress · Lagos'], ['The trousers finally sit right at the waist. I wear them every week.', 'Chinedu O.', 'Trouser alteration']].map(t => (
            <div key={t[1]} style={col('span 4')}><TestimonialCard quote={t[0]} name={t[1]} context={t[2]} avatar="" /></div>
          ))}
        </div>
      </section>
      <section className="ns-container" style={{ paddingBottom: 'var(--section-y)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <h2 className="ns-h3" style={{ margin: 0 }}>In the details</h2><span className="ns-small" style={{ color: 'var(--color-text-secondary)' }}>Select to view</span>
        </div>
        <Gallery columns={4} ratio="1:1" inline images={[{ shot: 'Hand-finished blind hem', caption: 'Blind hem' }, { shot: 'Embroidered kaftan neckline', caption: 'Neckline embroidery' }, { shot: 'Covered buttons on ivory silk', caption: 'Covered buttons' }, { shot: 'Pressed pleats on wool trousers', caption: 'Pleats' }]} />
      </section>
      <CTABanner eyebrow="Fittings by appointment" title="A better fit starts with you." body="Visit the studio, or start the conversation on WhatsApp — we'll guide you from there."
        actions={<><Button variant="inverse" onClick={() => go('inquiry')}>Book a fitting</Button><Button variant="outline-inverse" icon="message-circle" iconPosition="start">WhatsApp us</Button></>}
        image={{ shot: "Tailor measuring a client's shoulder width" }} />
    </main>
  );
}

export function ServicesScreen({ go }: { go: Go }) {
  const svc = [['Custom menswear', 'Suits, senator, kaftan, agbada, shirts and trousers.', 'Kaftan in progress on the cutting table'], ['Custom womenswear', 'Dresses, skirt and blouse sets, gowns and two-pieces.', 'Wrap dress being fitted at the waist'], ['Traditional & occasion', 'Weddings, church, naming ceremonies and events — for him and her.', 'Matching aso-ebi fabrics on a rail']];
  return (
    <main>
      <section className="ns-container" style={{ paddingBlock: '40px 64px' }}>
        <Breadcrumbs items={[{ label: 'Home', onClick: e => { e.preventDefault(); go('home'); } }, { label: 'Services' }]} />
        <div className="kit-grid" style={{ marginTop: 32, alignItems: 'end' }}>
          <h1 className="ns-h1" style={col('1 / span 7', { margin: 0 })}>From your measurements to the finished piece.</h1>
          <p className="ns-body-lg" style={col('9 / span 4', { margin: 0, color: 'var(--color-text-secondary)' })}>Three ways we work with you. Prices are starting points; we confirm a quote after your first fitting.</p>
        </div>
      </section>
      <section className="ns-container">
        {svc.map((s, i) => (
          <div key={s[0]} className="kit-grid" style={{ paddingBlock: 40, borderTop: '1px solid var(--ns-ink)', alignItems: 'start' }}>
            <span style={col('span 1', { fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--ns-bronze)' })}>0{i + 1}</span>
            <div style={col('2 / span 4', { display: 'flex', flexDirection: 'column', gap: 14 })}>
              <h2 className="ns-h3" style={{ margin: 0 }}>{s[0]}</h2>
              <p className="ns-body" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{s[1]}</p>
              <div style={{ display: 'flex', gap: 8 }}><Badge tone="outline">Men</Badge><Badge tone="outline">Women</Badge></div>
              <div><Button variant="tertiary" icon="arrow-right" onClick={() => go('inquiry')}>Start an inquiry</Button></div>
            </div>
            <div style={col('7 / span 6')}><ImageFrame ratio="3:2" shot={s[2]} /></div>
          </div>
        ))}
      </section>
      <section className="kit-sec" style={{ background: 'var(--ns-grey-100)' }}>
        <div className="ns-container kit-grid">
          <div style={col('1 / span 5', { display: 'flex', flexDirection: 'column', gap: 20 })}>
            <span className="ns-eyebrow" style={{ color: 'var(--ns-bronze)' }}>Measurements</span>
            <h2 className="ns-h2" style={{ margin: 0 }}>Measuring at home?</h2>
            <p className="ns-body" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Use a soft tape and a friend. Not sure? We&apos;ll measure you properly at your fitting.</p>
            <InfoPanel tone="outline" icon="clock" title="Typical turnaround" rows={[['Alterations', '3–5 days'], ['Custom outfit', '2–4 weeks'], ['Agbada / gown', '3–5 weeks']]} />
          </div>
          <div style={col('7 / span 6')}><MeasurementGuide /></div>
        </div>
      </section>
      <section className="kit-sec ns-container">
        <div className="kit-grid">
          <h2 className="ns-h2" style={col('1 / span 4', { margin: 0 })}>Questions</h2>
          <div style={col('6 / span 7')}>
            <Accordion defaultOpen={[0]} items={[
              { q: 'Do I need to bring my own fabric?', a: 'Either works. Bring your own, or we can help you choose and source it — we will advise on how much to buy.' },
              { q: 'How many fittings will I need?', a: 'Usually two: one to confirm the cut, one to finish. Occasion pieces sometimes need a third.' },
              { q: 'Can you alter clothes you did not make?', a: 'Yes. Bring them in and we will tell you honestly what is possible and what it will cost.' },
              { q: 'Do you take orders outside Enugu?', a: 'Yes — send measurements using our guide and we will arrange delivery.' }]} />
          </div>
        </div>
      </section>
    </main>
  );
}

export function InquiryScreen({ go, scrollTop = () => window.scrollTo(0, 0) }: { go: Go; scrollTop?: () => void }) {
  const [step, setStep] = useState(0);
  const [svc, setSvc] = useState<'custom' | 'alter' | 'talk'>('custom');
  const [f, setF] = useState({ name: '', phone: '', email: '', occasion: '', notes: '' });
  const [err, setErr] = useState<{ name?: string; phone?: string }>({});
  const [guide, setGuide] = useState(false);
  const [sending, setSending] = useState(false);
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const svcLabel = { custom: 'A custom outfit', alter: 'An alteration', talk: 'A conversation first' }[svc];
  const next = () => {
    if (step === 1) {
      const e: typeof err = {};
      if (!f.name.trim()) e.name = 'Please tell us your name.';
      if (f.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a phone or WhatsApp number we can reach, e.g. 0803 123 4567.';
      setErr(e); if (Object.keys(e).length) return;
    }
    if (step === 3) { setSending(true); setTimeout(() => { setSending(false); setStep(4); }, 900); return; }
    setStep(step + 1); scrollTop();
  };
  if (step === 4) return (
    <main className="ns-container" style={{ paddingBlock: 'var(--section-y)', maxWidth: 760 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <span className="ns-eyebrow" style={{ color: 'var(--ns-bronze)' }}>Inquiry received · NS-2611</span>
        <h1 className="ns-h1" style={{ margin: 0 }}>Thank you{f.name ? ', ' + f.name.split(' ')[0] : ''}. We&apos;ll be in touch.</h1>
        <Alert tone="success" title="Your inquiry is with the studio">We&apos;ll message you on WhatsApp within one working day to arrange your fitting.</Alert>
        <InfoPanel title="What happens next" rows={[['1. We review your request', 'Today'], ['2. We confirm a fitting time', 'Within 1 working day'], ['3. First fitting & quote', 'At the studio · ~40 min']]} />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button onClick={() => { setStep(0); go('home'); }}>Back to home</Button>
          <Button variant="whatsapp" icon="message-circle" iconPosition="start">Chat on WhatsApp</Button>
        </div>
      </div>
    </main>
  );
  const nErr = Object.keys(err).length;
  return (
    <main className="ns-container" style={{ paddingBlock: '48px var(--section-y)' }}>
      <div className="kit-grid" style={{ alignItems: 'start' }}>
        <div style={col('1 / span 7', { display: 'flex', flexDirection: 'column', gap: 32 })}>
          <div>
            <span className="ns-eyebrow" style={{ color: 'var(--ns-bronze)' }}>Start an inquiry</span>
            <h1 className="ns-h2" style={{ margin: '10px 0 24px' }}>{['What can we make for you?', 'How can we reach you?', 'Your measurements', 'Check and send'][step]}</h1>
            <ProgressSteps steps={['Service', 'Your details', 'Measurements', 'Review']} current={step} />
          </div>
          {step === 0 && (
            <div role="radiogroup" aria-label="Service" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ServiceOption name="svc" value="custom" icon="shirt" title="A custom outfit" description="Menswear or womenswear, made from your measurements." meta="Usually 2–4 weeks" checked={svc === 'custom'} onChange={() => setSvc('custom')} />
              <ServiceOption name="svc" value="alter" icon="scissors" title="An alteration" description="Hems, waists, sleeves, refits and repairs." meta="Usually 3–5 days" checked={svc === 'alter'} onChange={() => setSvc('alter')} />
              <ServiceOption name="svc" value="talk" icon="message-circle" title="Not sure yet" description="Tell us the idea and we'll talk it through." checked={svc === 'talk'} onChange={() => setSvc('talk')} />
            </div>
          )}
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: 20 }}>
              {nErr > 0 && <div style={{ gridColumn: '1/-1' }}><Alert tone="error" title={nErr === 1 ? 'One field needs attention' : 'Two fields need attention'}>Please check the highlighted fields below.</Alert></div>}
              <TextField label="Full name" value={f.name} onChange={set('name')} placeholder="Adaeze Okafor" error={err.name} />
              <TextField label="Phone or WhatsApp" type="tel" icon="phone" value={f.phone} onChange={set('phone')} placeholder="0803 123 4567" error={err.phone} hint="We'll confirm your fitting here." />
              <TextField label="Email" type="email" optional value={f.email} onChange={set('email')} />
              <Select label="Occasion" optional placeholder="Choose one" value={f.occasion} onChange={set('occasion')} options={['Everyday', 'Work', 'Wedding / traditional', 'Church / event', 'Other']} />
              <div style={{ gridColumn: '1/-1' }}>
                <TextArea label={svc === 'alter' ? 'What needs altering?' : 'Tell us about the piece'} optional value={f.notes} onChange={set('notes')}
                  placeholder={svc === 'alter' ? 'Two pairs of trousers to shorten by about 3cm…' : "A navy kaftan for my brother's traditional wedding in December…"} />
              </div>
            </div>
          )}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Alert tone="info" title="Optional">Skip this if you&apos;d rather be measured at your fitting.</Alert>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap: 20 }}>
                {['Chest / bust', 'Waist', 'Hips', 'Shoulder width', 'Sleeve length', 'Full length'].map(m => <MeasurementField key={m} label={m} optional onGuide={() => setGuide(true)} />)}
              </div>
              <Checkbox label="Please measure me at my fitting instead" />
            </div>
          )}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <InfoPanel tone="outline" title="Your inquiry" rows={[['Service', svcLabel], ['Name', f.name || '—'], ['Phone / WhatsApp', f.phone || '—'], ['Occasion', f.occasion || '—']]}>{f.notes}</InfoPanel>
              <Checkbox label="Send me a WhatsApp reminder before my fitting" defaultChecked />
            </div>
          )}
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            {step > 0 ? <Button variant="secondary" icon="arrow-left" iconPosition="start" onClick={() => setStep(step - 1)}>Back</Button> : <span />}
            <Button icon={step === 3 ? undefined : 'arrow-right'} loading={sending} onClick={next}>{step === 3 ? (sending ? 'Sending' : 'Send inquiry') : 'Continue'}</Button>
          </div>
        </div>
        <aside style={col('9 / span 4', { display: 'flex', flexDirection: 'column', gap: 24 })}>
          <InfoPanel tone="ink" icon="calendar" title="Fittings by appointment">Most first fittings take about 40 minutes. Bring any fabric or reference photos you have.</InfoPanel>
          <div><p className="ns-eyebrow" style={{ color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>Prefer to talk?</p><ContactCard /></div>
        </aside>
      </div>
      <Modal open={guide} onClose={() => setGuide(false)} title="How to measure" actions={<Button onClick={() => setGuide(false)}>Got it</Button>}><MeasurementGuide /></Modal>
    </main>
  );
}

/** Interactive website kit: header + screen + footer with in-kit navigation. Lays out by its own width (container queries). */
export function WebsiteKit({ initial = 'home' }: { initial?: KitScreen }) {
  const [screen, setScreen] = useState<KitScreen>(initial);
  const ref = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => setMobile(el.clientWidth < 768)); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const go = (s: KitScreen) => { setScreen(s); ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
  const links = [{ label: 'Home', key: 'home' as const }, { label: 'Services', key: 'services' as const }, { label: 'Start an inquiry', key: 'inquiry' as const }];
  return (
    <div ref={ref} className="kit" data-surface="light">
      <SiteHeader logoSrc="/assets/logo/nonso-stitches-badge-120.png" mobile={mobile} ctaLabel="Book a fitting" onCta={() => go('inquiry')}
        links={links.map(l => ({ label: l.label, href: '#' + l.key, active: screen === l.key }))}
        onNavigate={l => go((links.find(x => x.label === l.label)?.key) || 'home')} />
      {screen === 'home' && <HomeScreen go={go} />}
      {screen === 'services' && <ServicesScreen go={go} />}
      {screen === 'inquiry' && <InquiryScreen go={go} scrollTop={() => ref.current?.scrollIntoView({ block: 'start' })} />}
      <SiteFooter logoSrc="/assets/logo/nonso-stitches-badge-120.png" />
    </div>
  );
}
