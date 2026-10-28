/* Nonso Stitches Studio — core: brand data, clipboard, storage, colour maths.
   Port of lib/ns-core.js. Token data mirrors src/styles/ds/*.css and is the source of truth for docs + artwork. */
import { toast } from './toast';

export const version = '1.0.0';
export const LOGO = '/assets/logo/nonso-stitches-badge-primary.jpg';
export const abs = (p: string) => new URL(p, location.href).href;

export type PaletteKey = 'ink' | 'chalk' | 'paper' | 'cotton' | 'indigo';
export interface Palette { label: string; bg: string; text: string; text2: string; accent: string; rule: string; cta: string; ctaText: string; panel: string; place: string }
export interface ColorToken { group: string; token: string; name: string; hex: string; status: string; purpose: string; usage: string; on: string; dark: string }
export interface FontToken { name: string; stack: string; token: string; weights: string; role: string; licence: string }
export interface TypeStyle { style: string; font: 'display' | 'sans'; size: string; px: number; weight: number; lh: string; ls: string; token: string; css: string; sample: string; italic?: boolean; upper?: boolean }

/* clipboard */
export const copy = async (text: string, label?: string): Promise<boolean> => {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch {
    try {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove();
    } catch { /* fall through to the error toast */ }
  }
  toast(ok ? 'Copied ' + (label || text) : 'Copy failed — select the text and copy manually', ok ? 'success' : 'error');
  return ok;
};

/* storage */
export const store = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v == null ? d : (JSON.parse(v) as T); } catch { return d; } },
  set(k: string, v: unknown): boolean {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch {
      toast('Could not save — browser storage is full. Remove large uploaded images or export your work.', 'error'); return false;
    }
  },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  keys(prefix: string): string[] {
    const out: string[] = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(prefix)) out.push(k); } } catch { /* ignore */ }
    return out;
  },
};

/* download */
export const download = (blobOrUrl: Blob | string, filename: string) => {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  if (typeof blobOrUrl !== 'string') setTimeout(() => URL.revokeObjectURL(url), 4000);
};
export const slug = (s: unknown) => String(s || 'file').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'file';
export const uid = () => Math.random().toString(36).slice(2, 9);
export const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o)) as T;
export const esc = (s: unknown) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* colour maths */
export const hexToRgb = (hex: string): [number, number, number] => {
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255];
};
export const rgbToHsl = ([r, g, b]: [number, number, number]): [number, number, number] => {
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
};
export const lum = (hex: string) => { const c = hexToRgb(hex).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
export const contrast = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
export const colorFormats = (hex: string) => { const rgb = hexToRgb(hex), hsl = rgbToHsl(rgb); return { hex: hex.toUpperCase(), rgb: `rgb(${rgb.join(', ')})`, hsl: `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)` }; };
/** WCAG verdict used by the Design System and Playbook contrast tables. */
export const verdict = (r: number) => r >= 4.5 ? 'AA' : r >= 3 ? 'AA large' : 'Fail';

/* navigation */
export const nav = [
  { id: 'home', label: 'Studio', href: '/' },
  { id: 'ds', label: 'Design system', href: '/design-system' },
  { id: 'playbook', label: 'Brand playbook', href: '/playbook' },
  { id: 'voice', label: 'Voice & knowledge', href: '/voice' },
  { id: 'assets', label: 'Assets', href: '/assets' },
  { id: 'templates', label: 'Templates', href: '/templates' },
] as const;
export const editorHref = (id: string) => '/editor/#t=' + encodeURIComponent(id);

/* brand tokens */
export const colors: ColorToken[] = [
  {group:'Brand — primary', token:'--ns-ink', name:'Atelier Ink', hex:'#0B0A08', status:'Confirmed (logo field)', purpose:'Primary brand colour', usage:'Dark surfaces, hero bands, footer, primary buttons, headline text on light.', on:'Chalk, Paper, Gold text', dark:'Becomes the page background in dark mode.'},
  {group:'Brand — primary', token:'--ns-ink-2', name:'Ink Raised', hex:'#17181A', status:'Proposed', purpose:'Raised surface on dark', usage:'Cards and panels on ink; dark-mode surface.', on:'Chalk, Pewter Light, Gold', dark:'Dark-mode raised surface.'},
  {group:'Brand — primary', token:'--ns-ink-3', name:'Ink Hover', hex:'#26282B', status:'Proposed', purpose:'Interactive state', usage:'Hover state of ink fills only.', on:'Chalk', dark:'Hover fill in both modes.'},
  {group:'Brand — primary', token:'--ns-chalk', name:"Tailor's Chalk", hex:'#F3F4F2', status:'Proposed', purpose:'Page background', usage:'Default page background; text on ink.', on:'Ink, Charcoal, Graphite, Bronze', dark:'Becomes primary text colour in dark mode.'},
  {group:'Brand — primary', token:'--ns-paper', name:'Paper White', hex:'#FFFFFF', status:'Proposed', purpose:'Raised surface', usage:'Cards, inputs, document pages.', on:'Ink, Charcoal, Graphite', dark:'Document pages stay white; UI surfaces swap to Ink Raised.'},
  {group:'Brand — accent', token:'--ns-gold', name:'Thread Gold', hex:'#E0B04F', status:'Confirmed (logo midtone)', purpose:'Accent — on dark only', usage:'Eyebrows, hairlines and focus rings on ink only. ≤4% of a layout. Never text on light, never a fill or gradient.', on:'Ink (9.9:1), Ink Raised, Indigo', dark:'Primary accent in dark mode.'},
  {group:'Brand — accent', token:'--ns-gold-light', name:'Gold Highlight', hex:'#F0D080', status:'Confirmed (logo highlight)', purpose:'Highlight on dark', usage:'Hover of gold links and hairlines on ink.', on:'Ink', dark:'Gold hover in dark mode.'},
  {group:'Brand — accent', token:'--ns-bronze', name:'Bronze (retired)', hex:'#7A5A1E', status:'Retired in this studio', purpose:'Not used', usage:'Retired: warm brown accents read as generic. On light grounds, accents use Adire Indigo instead. Kept only so legacy files can be identified.', on:'—', dark:'—'},
  {group:'Secondary', token:'--ns-indigo', name:'Adire Indigo', hex:'#1F2E4A', status:'Proposed', purpose:'Accent on light grounds', usage:'Eyebrows and accent text on chalk/paper (13.6:1), link hover, info, occasional campaign field. Replaces Bronze. Keep accents ≤ 6% of a layout.', on:'Chalk, Paper, Cotton, Gold', dark:'Used as a field colour; accents switch to Thread Gold.'},
  {group:'Secondary', token:'--ns-indigo-2', name:'Indigo Mid', hex:'#2B4A7A', status:'Proposed', purpose:'Focus + info', usage:'Focus ring, info text.', on:'Chalk, Paper', dark:'Focus ring becomes Gold.'},
  {group:'Neutrals', token:'--ns-grey-100', name:'Cotton', hex:'#E9EBEA', status:'Proposed', purpose:'Alt background', usage:'Alternate section background.', on:'Ink, Charcoal, Graphite', dark:'Replaced by #111214 sunken.'},
  {group:'Neutrals', token:'--ns-grey-200', name:'Muslin', hex:'#DCDFDF', status:'Proposed', purpose:'Placeholder', usage:'Image placeholder fill, disabled fills.', on:'Ink, Charcoal', dark:'Replaced by Ink Hover.'},
  {group:'Neutrals', token:'--ns-grey-300', name:'Hairline', hex:'#CDD1D1', status:'Proposed', purpose:'Decorative divider', usage:'Decorative 1px dividers only (1.4:1). Never a functional border.', on:'—', dark:'Replaced by #33363A.'},
  {group:'Neutrals', token:'--ns-grey-400', name:'Pewter Light', hex:'#B9BEC0', status:'Proposed', purpose:'Secondary text on ink', usage:'Secondary text on ink only.', on:'Ink, Ink Raised', dark:'Secondary text in dark mode.'},
  {group:'Neutrals', token:'--ns-grey-500', name:'Pewter', hex:'#959B9E', status:'Proposed', purpose:'Muted text on ink', usage:'Muted text on ink only. Fails on chalk.', on:'Ink', dark:'Functional borders in dark mode.'},
  {group:'Neutrals', token:'--ns-grey-600', name:'Field Edge', hex:'#7F8588', status:'Proposed', purpose:'Functional border', usage:'Input and control borders (3.4:1).', on:'—', dark:'Swapped for Pewter.'},
  {group:'Neutrals', token:'--ns-grey-700', name:'Graphite', hex:'#51575B', status:'Proposed', purpose:'Secondary text', usage:'Secondary text on light (6.7:1).', on:'Chalk, Paper, Cotton', dark:'Swapped for Pewter Light.'},
  {group:'Neutrals', token:'--ns-grey-900', name:'Charcoal', hex:'#15181A', status:'Proposed', purpose:'Body text', usage:'Primary text on light (16.2:1).', on:'Chalk, Paper, Cotton', dark:'Swapped for Chalk.'},
  {group:'Semantic', token:'--ns-success', name:'Success', hex:'#2F6B4A', status:'Proposed', purpose:'Success state', usage:'Confirmation text/icons; pair with --ns-success-bg #E4EDE3.', on:'Chalk, Paper, Success bg', dark:'Lightened to #7FC29C on dark.'},
  {group:'Semantic', token:'--ns-warning', name:'Warning (cool)', hex:'#2B4A7A', status:'Proposed (re-pointed)', purpose:'Warning / caution', usage:'Caution text and icons in Indigo Mid — no amber or warm tones. Always pair with a warning icon and the word “Warning” or “Check”, so it never relies on colour alone.', on:'Chalk, Paper, Warning tint', dark:'Lightened to #9DB6DD on dark.'},
  {group:'Semantic', token:'--ns-error', name:'Error (Crimson)', hex:'#A8213A', status:'Proposed', purpose:'Error state', usage:'Errors and destructive actions; pair with #F6E3E6. Crimson, never terracotta.', on:'Chalk, Paper, Error bg', dark:'Lightened to #E4798C on dark.'},
  {group:'Semantic', token:'--ns-info', name:'Info', hex:'#2B4A7A', status:'Proposed', purpose:'Information', usage:'Info text/icons; pair with #E1E6EE.', on:'Chalk, Paper, Info bg', dark:'Lightened to #9DB6DD on dark.'},
  {group:'Semantic', token:'--ns-whatsapp', name:'WhatsApp', hex:'#1F7A4D', status:'Proposed', purpose:'WhatsApp CTA', usage:'"Chat on WhatsApp" buttons only (4.8:1 with chalk text).', on:'Chalk text', dark:'Unchanged.'},
  {group:'Semantic', token:'--ns-success-bg', name:'Success tint', hex:'#E4EDE3', status:'Proposed', purpose:'Success background', usage:'Alert/badge fill behind success text.', on:'Success', dark:'#142219'},
  {group:'Semantic', token:'--ns-warning-bg', name:'Warning tint', hex:'#E6EAF0', status:'Proposed (cooled)', purpose:'Warning background', usage:'Cool indigo tint behind warning text.', on:'Warning', dark:'#151D2A'},
  {group:'Semantic', token:'--ns-error-bg', name:'Error tint', hex:'#F6E3E6', status:'Proposed', purpose:'Error background', usage:'Alert/field fill behind error text.', on:'Error', dark:'#2A1418'},
  {group:'Semantic', token:'--ns-info-bg', name:'Info tint', hex:'#E1E6EE', status:'Proposed', purpose:'Info background / highlight', usage:'Info panels and text highlight.', on:'Info, Ink', dark:'#151D2A'},
];
export const aliases: [string,string,string][] = [
  ['--color-text-primary','--ns-grey-900','--ns-chalk'],['--color-text-secondary','--ns-grey-700','--ns-grey-400'],['--color-text-accent','--ns-indigo','--ns-gold'],
  ['--color-text-link-hover','--ns-indigo','--ns-gold-light'],['--color-surface-default','--ns-chalk','--ns-ink'],['--color-surface-raised','--ns-paper','--ns-ink-2'],
  ['--color-surface-sunken','--ns-grey-100','#111214'],['--color-surface-inverse','--ns-ink','--ns-ink'],['--color-border-subtle','--ns-grey-300','#33363A'],
  ['--color-border-default','--ns-grey-600','--ns-grey-500'],['--color-border-strong','--ns-ink','--ns-chalk'],['--color-brand-accent','--ns-gold','--ns-gold'],
  ['--color-brand-accent-on-light','--ns-indigo','—'],['--color-focus-ring','--ns-indigo-2','--ns-gold'],['--color-overlay','rgba(11,10,8,.64)','rgba(11,10,8,.64)'],
];
export const pairs: [string,string,string,string][] = [['#15181A','#F3F4F2','Charcoal on Chalk','Body'],['#51575B','#F3F4F2','Graphite on Chalk','Secondary'],['#1F2E4A','#F3F4F2','Indigo on Chalk','Accent text'],['#F3F4F2','#0B0A08','Chalk on Ink','Body on dark'],['#E0B04F','#0B0A08','Gold on Ink','Accent on dark'],['#B9BEC0','#17181A','Pewter Light on Ink Raised','Secondary on dark'],['#F3F4F2','#1F2E4A','Chalk on Indigo','Campaign'],['#F3F4F2','#1F7A4D','Chalk on WhatsApp','CTA'],['#A8213A','#FFFFFF','Error on Paper','Error'],['#E0B04F','#F3F4F2','Gold on Chalk','Never — fails'],['#959B9E','#F3F4F2','Pewter on Chalk','Never — fails']];
export const proportion: [string,number,string][] = [['Chalk / White',60,'#F3F4F2'],['Ink',25,'#0B0A08'],['Graphite',9,'#51575B'],['Gold',4,'#E0B04F'],['Indigo',2,'#1F2E4A']];

export const fonts: FontToken[] = [
  {name:'Cormorant Garamond', stack:"'Cormorant Garamond', Garamond, 'Times New Roman', serif", token:'--font-display', weights:'400 · 500 · 600 · italic 400/500', role:'Display, H1–H3, product titles, quotes. Echoes the logo’s Roman capitals and italic tagline.', licence:'SIL OFL 1.1'},
  {name:'Jost', stack:"'Jost', 'Futura', 'Century Gothic', system-ui, sans-serif", token:'--font-sans', weights:'300 · 400 · 500 · 600', role:'H4, body, UI, labels, nav, prices. Geometric, measured, legible at 16px.', licence:'SIL OFL 1.1'},
];
export const typeScale: TypeStyle[] = [
  {style:'Display', font:'display', size:'88 → 52', px:88, weight:400, lh:'0.96', ls:'-0.015em', token:'--type-display-size', css:'clamp(52px,3.4vw + 40px,88px)', sample:'Made to fit you.'},
  {style:'H1', font:'display', size:'64 → 42', px:64, weight:400, lh:'1.02', ls:'-0.01em', token:'--type-h1-size', css:'clamp(42px,2.1vw + 34px,64px)', sample:'Your style, thoughtfully tailored.'},
  {style:'H2', font:'display', size:'44 → 34', px:44, weight:500, lh:'1.08', ls:'-0.005em', token:'--type-h2-size', css:'clamp(34px,1vw + 30px,44px)', sample:'From your measurements to the finished piece.'},
  {style:'H3', font:'display', size:'30 → 26', px:30, weight:500, lh:'1.15', ls:'0', token:'--type-h3-size', css:'clamp(26px,.4vw + 24px,30px)', sample:'Alterations'},
  {style:'H4', font:'sans', size:'20 → 18', px:20, weight:500, lh:'1.3', ls:'0.005em', token:'--type-h4-size', css:'clamp(18px,.2vw + 17px,20px)', sample:'What happens at your first fitting'},
  {style:'Product title', font:'display', size:'26', px:26, weight:500, lh:'1.15', ls:'0', token:'--type-title-size', css:'26px', sample:'Made-to-measure suit'},
  {style:'Pull quote', font:'display', italic:true, size:'34 → 26', px:34, weight:400, lh:'1.25', ls:'0', token:'--type-quote-size', css:'clamp(26px,.8vw + 23px,34px)', sample:'It fits like it was always mine.'},
  {style:'Eyebrow', font:'sans', upper:true, size:'12', px:12, weight:500, lh:'1.4', ls:'0.24em', token:'--type-eyebrow-size', css:'12px', sample:'Custom wear'},
  {style:'Body large', font:'sans', size:'18', px:18, weight:400, lh:'1.6', ls:'0', token:'--type-body-lg-size', css:'18px', sample:'Every garment starts with a conversation about how you live in it.'},
  {style:'Body', font:'sans', size:'16', px:16, weight:400, lh:'1.6', ls:'0', token:'--type-body-size', css:'16px', sample:'Trousers too long? Waist too loose? Bring them in.'},
  {style:'Small', font:'sans', size:'14', px:14, weight:400, lh:'1.5', ls:'0', token:'--type-small-size', css:'14px', sample:'Fittings take about 40 minutes.'},
  {style:'Caption', font:'sans', size:'12', px:12, weight:400, lh:'1.45', ls:'0.02em', token:'--type-caption-size', css:'12px', sample:'Navy kaftan, second fitting.'},
  {style:'Label', font:'sans', size:'13', px:13, weight:500, lh:'1.3', ls:'0.04em', token:'--type-label-size', css:'13px', sample:'Phone or WhatsApp'},
  {style:'Button', font:'sans', upper:true, size:'13 (sm 12)', px:13, weight:500, lh:'1', ls:'0.16em', token:'--type-button-size', css:'13px', sample:'Book a fitting'},
  {style:'Navigation', font:'sans', size:'14', px:14, weight:400, lh:'—', ls:'0.04em', token:'--type-nav-size', css:'14px', sample:'Services'},
  {style:'Price', font:'sans', size:'16 tabular', px:16, weight:500, lh:'—', ls:'0', token:'--type-price-size', css:'16px', sample:'₦85,000'},
];
export const spacing: [string,number][] = [['--space-1',4],['--space-2',8],['--space-3',12],['--space-4',16],['--space-5',20],['--space-6',24],['--space-8',32],['--space-10',40],['--space-12',48],['--space-16',64],['--space-20',80],['--space-24',96],['--space-32',128]];
export const layout: [string,string,string][] = [
  ['Breakpoint · mobile','< 768px','--bp-tablet'],['Breakpoint · tablet','768–1199px','--bp-desktop'],['Breakpoint · desktop','≥ 1200px','--bp-desktop'],['Breakpoint · wide','1440px','--bp-wide'],
  ['Columns','12 / 8 / 4','--grid-cols-*'],['Gutters','24 / 20 / 16px','--gutter'],['Page margins','64 / 40 / 20px','--page-margin'],
  ['Container max','1320px','--container-max'],['Text container','720px','--container-text'],['Narrow container','560px','--container-narrow'],
  ['Section rhythm','128 / 96 / 64px','--section-y'],['Control heights','36 / 44 / 52px','--control-h-*'],['Touch minimum','44px','--touch-min'],['Text measure','≤ 66ch','--type-measure-ch'],
];
export const radii: [string,string,string][] = [['--radius-none','0','Cards, image frames, logo tile'],['--radius-xs','2px','Buttons, inputs'],['--radius-sm','4px','Modals'],['--radius-pill','999px','Badges only']];
export const shadows: [string,string,string][] = [['--shadow-none','none','Cards, panels — sit flat on hairlines'],['--shadow-raised','0 1px 2px rgba(11,10,8,.06), 0 4px 16px rgba(11,10,8,.06)','Menus and popovers only'],['--shadow-overlay','0 2px 6px rgba(11,10,8,.08), 0 24px 64px rgba(11,10,8,.18)','Modals only']];
export const motion: [string,string,string][] = [['--dur-fast','120ms','Hover, colour shifts'],['--dur-base','200ms','Fades, arrow nudges, theme switch'],['--dur-slow','360ms','Modal and drawer entry'],['--ease-standard','cubic-bezier(.2,0,0,1)','All entrances'],['--ease-exit','cubic-bezier(.4,0,1,1)','Exits']];
export const borders: [string,string,string][] = [['--border-hairline','1px','Structure, dividers, card edges'],['--border-strong','1.5px','Selected choice rows'],['--border-focus','2px','Focus ring'],['--stroke-graphic','1px','Stitch line, ticks, crop marks'],['--stroke-icon','2px','Lucide icons at 16–20px']];

/* artwork palettes (used by template renderer) */
export const palettes: Record<PaletteKey, Palette> = {
  ink:   {label:'Ink', bg:'#0B0A08', text:'#F3F4F2', text2:'#B9BEC0', accent:'#E0B04F', rule:'#E0B04F', cta:'#F3F4F2', ctaText:'#0B0A08', panel:'#17181A', place:'#26282B'},
  chalk: {label:'Chalk', bg:'#F3F4F2', text:'#15181A', text2:'#51575B', accent:'#1F2E4A', rule:'#0B0A08', cta:'#0B0A08', ctaText:'#F3F4F2', panel:'#FFFFFF', place:'#DCDFDF'},
  paper: {label:'Paper', bg:'#FFFFFF', text:'#15181A', text2:'#51575B', accent:'#1F2E4A', rule:'#0B0A08', cta:'#0B0A08', ctaText:'#F3F4F2', panel:'#F3F4F2', place:'#DCDFDF'},
  cotton:{label:'Cotton', bg:'#E9EBEA', text:'#15181A', text2:'#51575B', accent:'#1F2E4A', rule:'#0B0A08', cta:'#0B0A08', ctaText:'#F3F4F2', panel:'#FFFFFF', place:'#DCDFDF'},
  indigo:{label:'Indigo', bg:'#1F2E4A', text:'#F3F4F2', text2:'#C9D0DA', accent:'#E0B04F', rule:'#E0B04F', cta:'#F3F4F2', ctaText:'#0B0A08', panel:'#18243A', place:'#2B3A57'},
};
export const swatches: string[] = ['#0B0A08','#17181A','#F3F4F2','#FFFFFF','#E9EBEA','#DCDFDF','#E0B04F','#F0D080','#1F2E4A','#2B4A7A','#51575B','#B9BEC0','#15181A','#2F6B4A','#A8213A','#1F7A4D'];