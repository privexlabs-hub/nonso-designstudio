/* Export engine: PNG / JPEG / SVG / PDF / PPTX / DOCX / EPUB / HTML / Markdown / TXT / ZIP — all from the current edited state.
   Port of lib/ns-export.js. Export libraries are bundled npm packages, loaded on first use. */
import { palettes, esc, slug, LOGO, abs, download, clone, uid } from './core';
import * as D from './docs';
import * as R from './render';
import { cache } from './runtime';
import type { AnyDoc, DocDoc, GraphicDoc, Block, El, GPage, Palette } from './types';

type H2I = typeof import('html-to-image');
type PptxCtor = typeof import('pptxgenjs').default;
type TextO = import('pptxgenjs').default.TextPropsOptions;
type ImageO = import('pptxgenjs').default.ImageProps;
type ShapeO = import('pptxgenjs').default.ShapeProps;
let htmlToImage: H2I, JSZip: typeof import('jszip'), jsPDF: typeof import('jspdf').jsPDF, PptxGenJS: PptxCtor;
const loaders = {
  h2i: async () => { htmlToImage = await import('html-to-image'); },
  zip: async () => { JSZip = (await import('jszip')).default; },
  pdf: async () => { jsPDF = (await import('jspdf')).jsPDF; },
  pptx: async () => { PptxGenJS = (await import('pptxgenjs')).default; },
};
type LibKey = keyof typeof loaders;
const loaded: Partial<Record<LibKey, Promise<void>>> = {};
/** Load an export library once; a failed load is forgotten so the next call retries. */
export const load = (k: LibKey) => loaded[k] || (loaded[k] = loaders[k]().catch(() => { delete loaded[k]; throw new Error('Could not load the '+k+' export library — check your connection.'); }));
const blobToDataURL = (b: Blob) => new Promise<string>((res)=>{ const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(b); });
const dataURLToBlob = async (u: string) => (await fetch(u)).blob();
export const fontFiles = ['cormorant-garamond-latin','cormorant-garamond-latin-ext','cormorant-garamond-italic-latin','cormorant-garamond-italic-latin-ext','jost-latin','jost-latin-ext'];
export const fontCSS = async (): Promise<string> => { if (cache.fontCSS) return cache.fontCSS; const data: Record<string, string> = {}; await Promise.all(fontFiles.map(async f => { const b = await (await fetch('/assets/fonts/'+f+'.woff2')).blob(); data[f] = await blobToDataURL(b); }));
  const ext = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+20A0-20AB, U+20AD-20C4, U+2C60-2C7F, U+A720-A7FF', lat = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212';
  const ff = (fam: string, style: string, w: number, file: string, r: string) => `@font-face{font-family:'${fam}';font-style:${style};font-weight:${w};src:url(${data[file]}) format('woff2');unicode-range:${r}}`;
  let css = ''; [400,500,600].forEach(w=>{ css += ff('Cormorant Garamond','normal',w,'cormorant-garamond-latin',lat)+ff('Cormorant Garamond','normal',w,'cormorant-garamond-latin-ext',ext); });
  [400,500].forEach(w=>{ css += ff('Cormorant Garamond','italic',w,'cormorant-garamond-italic-latin',lat)+ff('Cormorant Garamond','italic',w,'cormorant-garamond-italic-latin-ext',ext); });
  [300,400,500,600].forEach(w=>{ css += ff('Jost','normal',w,'jost-latin',lat)+ff('Jost','normal',w,'jost-latin-ext',ext); });
  return (cache.fontCSS = css); };
export const logo = async (): Promise<string> => { if (cache.logoData) return cache.logoData; const b = await (await fetch(LOGO)).blob(); cache.logoData = await blobToDataURL(b); return cache.logoData; };
export const prep = async () => { await Promise.all([logo(), fontCSS()]); try { await Promise.all(["400 20px 'Cormorant Garamond'","500 20px 'Cormorant Garamond'","italic 400 20px 'Cormorant Garamond'","400 16px Jost","500 16px Jost","300 16px Jost"].map(f=>document.fonts.load(f))); } catch { /* fonts are best-effort */ } };

/* offscreen mount */
export const mount = async (html: string, w: number): Promise<HTMLDivElement> => { const host = document.createElement('div'); Object.assign(host.style,{position:'fixed',left:'-100000px',top:'0',width:w+'px',pointerEvents:'none',zIndex:'-1'}); host.innerHTML = html; document.body.appendChild(host);
  await Promise.all([...host.querySelectorAll('img')].map(i => i.complete ? (i.decode ? i.decode().catch(()=>{}) : 0) : new Promise(r=>{ i.onload = i.onerror = () => r(0); })));
  try { await document.fonts.ready; } catch { /* ignore */ } await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(0)))); return host; };
export const pageNode = async (doc: AnyDoc, i: number) => { await prep(); const sz = R.size(doc, i); const host = await mount(R.page(doc, i), sz.w); const node = host.firstElementChild as HTMLElement; return {host, node, w: sz.w, h: sz.h || node.offsetHeight}; };

/* images */
/* ---------- device limits ----------
   iPhone/iPad Safari cannot allocate a canvas over 16,777,216 px (larger exports come out blank), and every iOS browser is WebKit. */
export const isIOS = () => typeof navigator !== 'undefined' && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
export const isWebKit = () => typeof navigator !== 'undefined' && (isIOS() || (/AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|OPR|SamsungBrowser|Android/.test(navigator.userAgent)));
export const canvasLimit = () => isIOS() ? 16_777_216 : 50_000_000;
/** Largest resolution multiplier this device can render for a w × h artboard. */
export const maxScale = (w: number, h: number) => Math.max(0.1, Math.floor(Math.sqrt(canvasLimit() / (w * h)) * 100) / 100);
export const safeScale = (w: number, h: number, s: number) => Math.min(s, maxScale(w, h));

export interface RasterOpts { scale?: number; quality?: number; /** told the resolution actually used (after the device cap) */ onScale?: (s: number, w: number, h: number) => void }
export const raster = async (doc: AnyDoc, i: number, type: 'png' | 'jpeg' | 'svg', o: RasterOpts = {}): Promise<Blob> => { await load('h2i'); const {host, node, w, h} = await pageNode(doc, i);
  try { const s = type === 'svg' ? (o.scale||1) : safeScale(w, h, o.scale||1); o.onScale?.(s, w, h);
    const opt = {width:w, height:h, pixelRatio:s, fontEmbedCSS: await fontCSS(), cacheBust:false, quality:o.quality||0.92, backgroundColor: type==='jpeg' ? '#FFFFFF' : undefined, style:{margin:'0'}};
    if (type === 'svg') { const u = await htmlToImage.toSvg(node, opt); return new Blob([decodeURIComponent(u.slice(u.indexOf(',')+1))], {type:'image/svg+xml'}); }
    const render = () => type === 'jpeg' ? htmlToImage.toJpeg(node, opt) : htmlToImage.toPng(node, opt);
    if (isWebKit()) await render(); /* Safari: the first capture often misses images (logo, photos) — render once, keep the second */
    const u = await render(); return dataURLToBlob(u); }
  finally { host.remove(); } };
export const ext: Record<string, string> = {png:'png', jpeg:'jpg', svg:'svg', pdf:'pdf', pdfprint:'pdf', pptx:'pptx', docx:'docx', epub:'epub', html:'html', md:'md', txt:'txt', emailhtml:'html'};
export const fname = (doc: AnyDoc, i: number | null | undefined, fmt: string) => { const base = slug(doc.name) + (doc.kind==='graphic' ? `-${doc.W}x${doc.H}` : ''); const pg = i!=null && doc.pages.length > 1 ? '-p' + String(i+1).padStart(2,'0') : ''; return base + pg + '.' + ext[fmt]; };

/* PDF (raster, exact) */
export const pdf = async (doc: AnyDoc, o: { pages?: number[]; scale?: number } = {}): Promise<Blob> => { await load('pdf'); let pdf: InstanceType<typeof jsPDF> | null = null;
  for (let i = 0; i < doc.pages.length; i++) { if (o.pages && !o.pages.includes(i)) continue; let used = o.scale || (doc.kind==='graphic' ? 1 : 2); const b = await raster(doc, i, 'jpeg', {scale: used, quality: 0.92, onScale: s => { used = s; }}); const u = await blobToDataURL(b);
    const im = await new Promise<HTMLImageElement>(r=>{ const m = new Image(); m.onload = () => r(m); m.src = u; }); const pw = im.width / used, ph = im.height / used;
    if (!pdf) pdf = new jsPDF({unit:'px', format:[pw, ph], orientation: pw > ph ? 'landscape' : 'portrait', hotfixes:['px_scaling'], compress:true}); else pdf.addPage([pw, ph], pw > ph ? 'landscape' : 'portrait');
    pdf.addImage(u, 'JPEG', 0, 0, pw, ph); }
  if (!pdf) throw new Error('No pages to export.');
  pdf.setProperties({title: (doc.kind==='doc' && doc.title) || doc.name, author: (doc.kind==='doc' && doc.author) || 'Nonso Stitches', creator:'Nonso Stitches Studio'}); return pdf.output('blob'); };

/* Print-ready HTML (vector text) */
export const htmlDoc = async (doc: AnyDoc, o: { autoprint?: boolean } = {}) => { await prep(); const fm = doc.kind==='graphic' ? {w:doc.W, h:doc.H} : R.fmt(doc); const email = doc.kind==='doc' && doc.format==='email';
  const pages = doc.pages.map((p,i)=>`<section class="pg">${R.page(doc,i)}</section>`).join('\n');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc((doc.kind==='doc' && doc.title)||doc.name)}</title><style>${await fontCSS()}
@page{size:${fm.w}px ${email?'auto':fm.h+'px'};margin:0}html,body{margin:0;background:#DCDFDF}body{padding:24px 0;display:flex;flex-direction:column;align-items:center;gap:24px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{box-shadow:0 2px 6px rgba(11,10,8,.08),0 24px 64px rgba(11,10,8,.12)}@media print{html,body{background:none;padding:0;gap:0;display:block}.pg{box-shadow:none;break-after:page;page-break-after:always}.pg:last-child{break-after:auto}}</style></head><body>
${pages}${o.autoprint?'<script>document.fonts.ready.then(()=>setTimeout(()=>print(),300))<\/script>':''}</body></html>`; };
/** iOS Safari cannot print a hidden iframe: write the print-ready page into a window opened during the tap (see `printWindow`). */
export const printWindow = () => isIOS() ? window.open('', '_blank') : null;
export const print = async (doc: AnyDoc, win?: Window | null) => {
  if (win) { const page = await htmlDoc(doc, {autoprint:true}); win.document.open(); win.document.write(page); win.document.close(); return true; }
  const html = await htmlDoc(doc, {autoprint:false}); const f = document.createElement('iframe'); Object.assign(f.style,{position:'fixed',right:'0',bottom:'0',width:'0',height:'0',border:'0'}); document.body.appendChild(f);
  f.srcdoc = html; await new Promise(r => { f.onload = () => r(0); }); try { await f.contentDocument!.fonts.ready; f.contentWindow!.focus(); f.contentWindow!.print(); setTimeout(()=>f.remove(), 60000); return true; } catch { f.remove(); throw new Error('Printing is blocked here. Use “HTML (print-ready)” and print it from your browser.'); } };

/* Markdown / text */
const { rows, cells } = R;
export const blockMd = (b: Block, doc: DocDoc): string => { const t = b.text||''; switch(b.t){
  case 'title': return '# '+t; case 'h1': return '## '+t; case 'h2': return '### '+t; case 'h3': return '#### '+t; case 'subtitle': return '*'+t+'*'; case 'eyebrow': return '**'+t.toUpperCase()+'**';
  case 'quote': return '> '+t.split('\n').join('\n> ')+(b.cap?'\n>\n> '+b.cap:''); case 'callout': return '> **'+(b.label||'Note')+':** '+t; case 'takeaways': return '**'+(b.label||'Key takeaways')+'**\n\n'+rows(t).map(l=>'- '+l).join('\n');
  case 'list': return rows(t).map((l,i)=>(b.ord?(i+1)+'. ':'- ')+l).join('\n'); case 'table': case 'kv': case 'timeline': case 'stats': case 'chart': case 'steps': { const rs = rows(t).map(cells); if (!rs.length) return ''; const head = b.t==='table' ? rs[0] : (b.t==='kv'?['Item','Detail']:b.t==='timeline'?['When','What']:b.t==='stats'?['Value','Label']:b.t==='chart'?['Label','Value']:['Step','Detail']); const body = b.t==='table'?rs.slice(1):rs; const n = Math.max(head.length, ...body.map(r=>r.length)); const pad = (r: string[])=>'| '+Array.from({length:n},(_,i)=>r[i]||'').join(' | ')+' |'; return [pad(head), '|'+Array(n).fill(' --- ').join('|')+'|', ...body.map(pad)].join('\n')+(b.cap?'\n\n*'+b.cap+'*':''); }
  case 'image': return b.src && !b.src.startsWith('data:') ? `![${b.cap||b.label||''}](${b.src})` : `*[Image: ${b.cap||b.label||'image'}]*`; case 'gallery': return rows(t).map(c=>`*[Image: ${c}]*`).join('  \n');
  case 'columns': return t.split(/\n---\n/).join('\n\n'); case 'toc': return '**'+(t||'Contents')+'**\n\n'+D.headings(doc).map(h=>(h.lvl?'  - ':'- ')+h.text+' — '+R.pageNum(doc,h.page)).join('\n');
  case 'exercise': return t+'\n\n'+Array(b.lines||5).fill('______________________________').join('\n'); case 'cta': return (t?t+'\n\n':'')+'**['+(b.btn||'Book a fitting')+']**'; case 'divider': return '---'; case 'spacer': case 'logo': return '';
  default: return t; } };
export const md = (doc: AnyDoc): string => { if (doc.kind === 'graphic') return doc.pages.map((p,i)=>`## ${p.name||'Frame '+(i+1)}\n\n`+(p.els||[]).filter(e=>e.t==='text'&&e.id!=='counter'&&e.id!=='brandname').map(e=>e.text).join('\n\n')).join('\n\n---\n\n');
  return `<!-- ${doc.name} · exported from Nonso Stitches Studio -->\n\n` + doc.pages.map(p=>p.blocks.map(b=>blockMd(b,doc)).filter(Boolean).join('\n\n')).join('\n\n---\n\n') + '\n'; };
export const txt = (doc: AnyDoc) => md(doc).replace(/<!--.*?-->\n*/g,'').replace(/^#+ /gm,'').replace(/\*\*|\*/g,'').replace(/^> ?/gm,'').replace(/^\|?\s*-{3}.*$/gm,'').replace(/ \| /g,'\t').replace(/^\| | \|$/gm,'');

/* Email HTML (table-based, inline styles) */
export const emailHtml = (doc: DocDoc) => { const serif = "'Cormorant Garamond',Georgia,'Times New Roman',serif", sans = "Jost,'Century Gothic',Helvetica,Arial,sans-serif"; const logoUrl = abs(LOGO);
  const blk = (b: Block, P: Palette): string => { const t = esc(b.text||'').replace(/\n/g,'<br>'); const al = b.al||'left';
    switch(b.t){ case 'eyebrow': return `<p style="margin:0 0 12px;font-family:${sans};font-size:11px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:${P.accent};text-align:${al}">${t}</p>`;
      case 'title': case 'h1': case 'h2': return `<h${b.t==='h2'?2:1} style="margin:0 0 14px;font-family:${serif};font-weight:500;font-size:${b.t==='h2'?28:36}px;line-height:1.15;color:${P.text};text-align:${al}">${t}</h${b.t==='h2'?2:1}>`;
      case 'h3': return `<h3 style="margin:0 0 8px;font-family:${sans};font-weight:500;font-size:17px;line-height:1.3;color:${P.text}">${t}</h3>`;
      case 'quote': return `<p style="margin:0 0 14px;font-family:${serif};font-style:italic;font-size:24px;line-height:1.3;color:${P.text};text-align:${al}">${t}</p>${b.cap?`<p style="margin:0 0 14px;font-family:${sans};font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:${P.text2};text-align:${al}">${esc(b.cap)}</p>`:''}`;
      case 'callout': return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${P.text}"><tr><td style="padding:16px 0"><p style="margin:0 0 8px;font-family:${sans};font-size:11px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:${P.accent}">${esc(b.label||'Note')}</p><p style="margin:0;font-family:${sans};font-size:16px;line-height:1.6;color:${P.text}">${t}</p></td></tr></table>`;
      case 'image': return b.src && !b.src.startsWith('data:') ? `<img src="${esc(b.src)}" width="520" alt="${esc(b.cap||b.label||'')}" style="display:block;width:100%;height:auto;margin:0 0 14px">` : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="240" style="background:${P.place};text-align:center;font-family:${sans};font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${P.text2}">${esc(b.label||'Image')} — replace with hosted image URL</td></tr></table>${b.cap?`<p style="margin:8px 0 14px;font-family:${sans};font-size:12px;color:${P.text2}">${esc(b.cap)}</p>`:''}`;
      case 'logo': return `<p style="margin:0 0 14px;text-align:${b.al||'left'}"><img src="${logoUrl}" width="120" height="120" alt="Nonso Stitches" style="display:inline-block;width:120px;height:120px"></p>`;
      case 'cta': return `${b.text?`<p style="margin:0 0 16px;font-family:${sans};font-size:16px;line-height:1.6;color:${P.text};text-align:${al}">${t}</p>`:''}<table role="presentation" cellpadding="0" cellspacing="0" ${al==='center'?'align="center"':''} style="margin:0 0 14px"><tr><td style="background:${P===palettes.ink?'#F3F4F2':'#0B0A08'};border-radius:2px"><a href="[link]" style="display:inline-block;padding:14px 24px;font-family:${sans};font-size:13px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:${P===palettes.ink?'#0B0A08':'#F3F4F2'};text-decoration:none">${esc(b.btn||'Book a fitting')}</a></td></tr></table>`;
      case 'kv': case 'timeline': case 'stats': case 'steps': return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px">${rows(b.text).map(cells).map(r=>`<tr><td style="padding:8px 12px 8px 0;border-bottom:1px solid #CDD1D1;font-family:${sans};font-size:14px;color:${P.text2};width:40%">${esc(r[0])}</td><td style="padding:8px 0;border-bottom:1px solid #CDD1D1;font-family:${sans};font-size:14px;color:${P.text}">${esc(r.slice(1).join(' | '))}</td></tr>`).join('')}</table>`;
      case 'list': case 'takeaways': return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px">${rows(b.text).map((l,i)=>`<tr><td valign="top" style="padding:4px 10px 4px 0;font-family:${sans};font-size:14px;color:${P.accent};width:24px">${b.ord||b.t==='takeaways'?String(i+1).padStart(2,'0'):'–'}</td><td style="padding:4px 0;font-family:${sans};font-size:15px;line-height:1.5;color:${P.text}">${esc(l)}</td></tr>`).join('')}</table>`;
      case 'divider': return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px dashed ${P.rule};font-size:0;line-height:0;height:16px">&nbsp;</td></tr></table>`;
      case 'spacer': return `<div style="height:16px;line-height:16px">&nbsp;</div>`;
      case 'note': case 'byline': case 'contact': return `<p style="margin:0 0 14px;font-family:${sans};font-size:12px;line-height:1.55;color:${P.text2};text-align:${al}">${t}</p>`;
      default: return `<p style="margin:0 0 14px;font-family:${sans};font-size:16px;line-height:1.6;color:${P.text};text-align:${al}">${t}</p>`; } };
  const sections = doc.pages.map(p=>{ const P = palettes[p.bg]||palettes.paper; return `<tr><td style="background:${P.bg};padding:32px 40px">${p.blocks.map(b=>blk(b,P)).join('')}</td></tr>`; }).join('');
  const pre = esc((doc.pages[1]&&doc.pages[1].blocks.find(b=>b.t==='para')||{}).text||'');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(doc.name)}</title></head><body style="margin:0;padding:0;background:#E9EBEA"><div style="display:none;max-height:0;overflow:hidden">${pre}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E9EBEA"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%">${sections}</table></td></tr></table></body></html>`; };

/* DOCX (hand-built OOXML) */
const xe = (s: unknown) => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export const docx = async (doc: DocDoc): Promise<Blob> => { await load('zip'); await logo(); const zip = new JSZip(); const fm = R.fmt(doc); const tw = (px: number) => Math.round(px/96*1440); const media: { name: string; blob: Blob; rid: string }[] = []; const contentW = tw(fm.w - fm.m*2);
  type RunO = { b?: boolean; i?: boolean; caps?: boolean; sz?: number; color?: string; font?: string };
  const run = (t: string, o: RunO = {}) => { const rp = `<w:rPr>${o.b?'<w:b/>':''}${o.i?'<w:i/>':''}${o.caps?'<w:caps/>':''}${o.sz?`<w:sz w:val="${o.sz}"/>`:''}${o.color?`<w:color w:val="${o.color}"/>`:''}${o.font?`<w:rFonts w:ascii="${o.font}" w:hAnsi="${o.font}"/>`:''}</w:rPr>`; return String(t).split('\n').map((l,i)=>`${i?'<w:r><w:br/></w:r>':''}<w:r>${rp}<w:t xml:space="preserve">${xe(l)}</w:t></w:r>`).join(''); };
  const jc = (al?: string) => al ? `<w:jc w:val="${al==='justify'?'both':al}"/>` : '';
  type PO = { keep?: boolean; border?: 'top' | 'bottom'; tabs?: string; ind?: number; hang?: number; al?: string };
  const p = (style: string, content: string, o: PO = {}) => { return `<w:p><w:pPr>${style?`<w:pStyle w:val="${style}"/>`:''}${o.keep?'<w:keepNext/>':''}${o.border?`<w:pBdr><w:${o.border} w:val="single" w:sz="4" w:space="6" w:color="0B0A08"/></w:pBdr>`:''}${o.tabs||''}${o.ind?`<w:ind w:left="${o.ind}" w:hanging="${o.hang||0}"/>`:''}${jc(o.al)}</w:pPr>${content}</w:p>`; };
  const imgXml = async (src: string, wpx: number, hpx: number) => { const b = await (await fetch(src)).blob(); const ext = b.type.includes('png')?'png':'jpeg'; const n = media.length+1; media.push({name:`image${n}.${ext}`, blob:b, rid:`rIdImg${n}`});
    const cx = Math.round(wpx*9525), cy = Math.round(hpx*9525); return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Image ${n}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${n}" name="image${n}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg${n}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`; };
  const tbl = (rs: string[][], head: boolean) => { const n = Math.max(1,...rs.map(r=>r.length)); const bd = `<w:tblBorders><w:top w:val="single" w:sz="4" w:color="0B0A08"/><w:bottom w:val="single" w:sz="4" w:color="CDD1D1"/><w:insideH w:val="single" w:sz="4" w:color="CDD1D1"/></w:tblBorders>`;
    return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>${bd}<w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${Array(n).fill(`<w:gridCol w:w="${Math.round(contentW/n)}"/>`).join('')}</w:tblGrid>${rs.map((r,i)=>`<w:tr>${Array.from({length:n},(_,j)=>`<w:tc><w:tcPr><w:tcW w:w="${Math.round(5000/n)}" w:type="pct"/></w:tcPr>${p('TableText', run(r[j]||'', {b: head && i===0}))}</w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>${p('','')}`; };
  const out: string[] = [];
  for (let pi = 0; pi < doc.pages.length; pi++) { const pg = doc.pages[pi]; if (pi) out.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
    for (const b of pg.blocks) { const t = b.text||''; const al = b.al;
      switch (b.t) {
        case 'title': out.push(p('Title', run(t), {al})); break; case 'subtitle': out.push(p('Subtitle', run(t), {al})); break;
        case 'h1': out.push(p('Heading1', run(t), {al})); break; case 'h2': out.push(p('Heading2', run(t), {al})); break; case 'h3': out.push(p('Heading3', run(t), {al})); break;
        case 'eyebrow': out.push(p('Eyebrow', run(t), {al, keep:true})); break; case 'lead': out.push(p('Lead', run(t), {al})); break;
        case 'quote': out.push(p('Quote', run(t), {al})); if (b.cap) out.push(p('Eyebrow', run(b.cap), {al})); break;
        case 'callout': out.push(p('Eyebrow', run(b.label||'Note'), {border:'top', keep:true})); out.push(p('', run(t))); break;
        case 'takeaways': out.push(p('Eyebrow', run(b.label||'Key takeaways'), {border:'top', keep:true})); rows(t).forEach((l,i)=>out.push(p('', run(String(i+1).padStart(2,'0')+'\t'+l), {ind:567, hang:567}))); break;
        case 'note': case 'byline': case 'contact': out.push(p('Caption', run(t), {al})); break;
        case 'list': rows(t).forEach((l,i)=>out.push(p('', run((b.ord?String(i+1).padStart(2,'0'):'–')+'\t'+l), {ind:567, hang:567}))); break;
        case 'table': out.push(tbl(rows(t).map(cells), true)); break;
        case 'kv': case 'timeline': case 'steps': case 'stats': case 'chart': out.push(tbl(rows(t).map(cells), false)); if (b.cap) out.push(p('Caption', run(b.cap))); break;
        case 'columns': out.push(tbl([t.split(/\n---\n/)], false)); break;
        case 'toc': out.push(p('Eyebrow', run(t||'Contents'))); D.headings(doc).forEach(h=>out.push(p('', run(h.text+'\t'+R.pageNum(doc,h.page)), {tabs:`<w:tabs><w:tab w:val="right" w:leader="dot" w:pos="${contentW}"/></w:tabs>`, ind: h.lvl?360:0}))); break;
        case 'image': { if (b.src) { const [rw,rh] = String(b.ratio||'3:2').split(':').map(Number); const wpx = (fm.w-fm.m*2)*(b.w||1); out.push(p('', await imgXml(b.src, wpx, wpx*rh/rw), {al})); } else out.push(p('Caption', run('[Image: '+(b.label||'image')+']'), {al})); if (b.cap) out.push(p('Caption', run(b.cap), {al})); break; }
        case 'gallery': rows(t).forEach((c,i)=>out.push(p('Caption', run((b.srcs&&b.srcs[i]?'':'[Image] ')+c)))); break;
        case 'logo': out.push(p('', await imgXml(cache.logoData, 120, 120), {al: al || (pg.va==='middle'?'center':undefined)})); break;
        case 'exercise': out.push(p('', run(t))); for (let k=0;k<(b.lines||5);k++) out.push(p('', '', {border:'bottom'})); break;
        case 'cta': if (t) out.push(p('', run(t), {al})); out.push(p('', run((b.btn||'Book a fitting').toUpperCase(), {b:true}), {al})); break;
        case 'divider': out.push(p('', '', {border:'bottom'})); break; case 'spacer': out.push(p('', '')); break;
        case 'signature': out.push(p('', '')); out.push(p('', run(t), {border:'top'})); break;
        default: out.push(p('', run(t), {al})); } } }
  const sect = `<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="${tw(fm.w)}" w:h="${tw(fm.h||1123)}"/><w:pgMar w:top="${tw(fm.m)}" w:right="${tw(fm.m)}" w:bottom="${tw(fm.m)}" w:left="${tw(fm.m)}" w:header="${tw(fm.m/2)}" w:footer="${tw(fm.m/2)}" w:gutter="0"/><w:pgNumType w:start="${doc.settings.numStart||1}"/><w:titlePg/></w:sectPr>`;
  const NSX = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NSX}><w:body>${out.join('')}${sect}</w:body></w:document>`);
  const st = (id: string, name: string, rpr: string, ppr?: string, based?: string) => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/>${based?`<w:basedOn w:val="${based}"/>`:''}<w:qFormat/><w:pPr>${ppr||''}</w:pPr><w:rPr>${rpr}</w:rPr></w:style>`;
  const serif = '<w:rFonts w:ascii="Cormorant Garamond" w:hAnsi="Cormorant Garamond" w:cs="Times New Roman"/>', sans = '<w:rFonts w:ascii="Jost" w:hAnsi="Jost" w:cs="Arial"/>';
  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr>${sans}<w:sz w:val="21"/><w:color w:val="15181A"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
${st('Normal','Normal','')}${st('Title','Title',serif+'<w:sz w:val="72"/>','<w:spacing w:after="200" w:line="240" w:lineRule="auto"/>','Normal')}${st('Subtitle','Subtitle',serif+'<w:i/><w:sz w:val="32"/><w:color w:val="51575B"/>','','Normal')}
${st('Heading1','heading 1',serif+'<w:b w:val="0"/><w:sz w:val="48"/>','<w:keepNext/><w:spacing w:before="240" w:after="160"/><w:outlineLvl w:val="0"/>','Normal')}${st('Heading2','heading 2',serif+'<w:sz w:val="34"/>','<w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="1"/>','Normal')}${st('Heading3','heading 3',sans+'<w:b/><w:sz w:val="22"/>','<w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="2"/>','Normal')}
${st('Eyebrow','Eyebrow',sans+'<w:caps/><w:spacing w:val="40"/><w:sz w:val="16"/><w:color w:val="1F2E4A"/>','<w:spacing w:after="80"/>','Normal')}${st('Lead','Lead','<w:sz w:val="26"/>','','Normal')}${st('Quote','Quote',serif+'<w:i/><w:sz w:val="34"/>','<w:pBdr><w:top w:val="single" w:sz="4" w:space="8" w:color="0B0A08"/><w:bottom w:val="single" w:sz="4" w:space="8" w:color="0B0A08"/></w:pBdr><w:spacing w:before="240" w:after="240"/>','Normal')}
${st('Caption','Caption','<w:sz w:val="17"/><w:color w:val="51575B"/>','','Normal')}${st('TableText','Table text','<w:sz w:val="18"/>','<w:spacing w:after="0"/>','Normal')}${st('Footer','footer','<w:sz w:val="16"/><w:color w:val="51575B"/>','<w:jc w:val="center"/>','Normal')}</w:styles>`);
  zip.file('word/footer1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NSX}><w:p><w:pPr><w:pStyle w:val="Footer"/><w:jc w:val="${doc.settings.numPos==='outside'?'right':'center'}"/></w:pPr>${doc.settings.numbers?'<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>':''}</w:p></w:ftr>`);
  media.forEach(m=>zip.file('word/media/'+m.name, m.blob));
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${media.map(m=>`<Relationship Id="${m.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.name}"/>`).join('')}</Relationships>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`);
  zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xe(doc.title||doc.name)}</dc:title><dc:creator>${xe(doc.author||'Nonso Stitches')}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0,19)}Z</dcterms:created></cp:coreProperties>`);
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`);
  return zip.generateAsync({type:'blob', mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}); };

/* EPUB 3 */
export const blockXhtml = (b: Block & { __file?: string }, doc: DocDoc): string => { const t = xe(b.text||'').replace(/\n/g,'<br/>'); const al = b.al ? ` style="text-align:${b.al}"` : '';
  switch (b.t) { case 'title': return `<h1 class="title"${al}>${t}</h1>`; case 'subtitle': return `<p class="subtitle"${al}>${t}</p>`; case 'h1': return `<h1${al}>${t}</h1>`; case 'h2': return `<h2${al}>${t}</h2>`; case 'h3': return `<h3${al}>${t}</h3>`;
    case 'eyebrow': return `<p class="eyebrow"${al}>${t}</p>`; case 'lead': return `<p class="lead"${al}>${t}</p>`; case 'quote': return `<blockquote${al}><p>${t}</p>${b.cap?`<footer>${xe(b.cap)}</footer>`:''}</blockquote>`;
    case 'callout': case 'takeaways': return `<aside class="callout"><p class="eyebrow">${xe(b.label||(b.t==='takeaways'?'Key takeaways':'Note'))}</p>${b.t==='takeaways'?'<ol>'+rows(b.text).map(l=>`<li>${xe(l)}</li>`).join('')+'</ol>':`<p>${t}</p>`}</aside>`;
    case 'note': case 'byline': case 'contact': return `<p class="note"${al}>${t}</p>`; case 'list': { const tg = b.ord?'ol':'ul'; return `<${tg}>${rows(b.text).map(l=>`<li>${xe(l)}</li>`).join('')}</${tg}>`; }
    case 'table': { const rs = rows(b.text).map(cells); return `<table>${rs.map((r,i)=>`<tr>${r.map(c=>i===0?`<th>${xe(c)}</th>`:`<td>${xe(c)}</td>`).join('')}</tr>`).join('')}</table>`; }
    case 'kv': case 'timeline': case 'stats': case 'chart': case 'steps': return `<table>${rows(b.text).map(cells).map(r=>`<tr>${r.map(c=>`<td>${xe(c)}</td>`).join('')}</tr>`).join('')}</table>${b.cap?`<p class="note">${xe(b.cap)}</p>`:''}`;
    case 'columns': return b.text.split(/\n---\n/).map(c=>`<p>${xe(c).replace(/\n/g,'<br/>')}</p>`).join('');
    case 'image': return b.__file ? `<figure><img src="${b.__file}" alt="${xe(b.cap||b.label||'')}"/>${b.cap?`<figcaption>${xe(b.cap)}</figcaption>`:''}</figure>` : `<p class="note">[Image: ${xe(b.cap||b.label||'')}]</p>`;
    case 'gallery': return `<p class="note">${rows(b.text).map(c=>'[Image: '+xe(c)+']').join('<br/>')}</p>`;
    case 'logo': return `<p class="logo"><img src="images/logo.jpg" alt="Nonso Stitches"/></p>`;
    case 'toc': return `<p class="eyebrow">${t||'Contents'}</p><ol class="toc">${D.headings(doc).map(h=>`<li><a href="p${String(h.page+1).padStart(3,'0')}.xhtml">${xe(h.text)}</a></li>`).join('')}</ol>`;
    case 'exercise': return `<p>${t}</p>${'<hr class="line"/>'.repeat(b.lines||5)}`; case 'cta': return `${t?`<p>${t}</p>`:''}<p class="btn">${xe(b.btn||'Book a fitting')}</p>`;
    case 'divider': return '<hr/>'; case 'spacer': return '<p class="spacer">&#160;</p>'; case 'signature': return `<p class="sig">${t}</p>`; default: return `<p>${t}</p>`; } };
export const epub = async (doc: DocDoc): Promise<Blob> => { await load('zip'); await logo(); const zip = new JSZip(); const id = 'urn:uuid:' + (crypto.randomUUID ? crypto.randomUUID() : uid()+uid());
  zip.file('mimetype', 'application/epub+zip', {compression:'STORE'});
  zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
  zip.file('OEBPS/images/logo.jpg', await (await fetch(LOGO)).blob());
  for (const f of fontFiles) zip.file('OEBPS/fonts/'+f+'.woff2', await (await fetch('/assets/fonts/'+f+'.woff2')).blob());
  const cover = await raster(doc, 0, 'jpeg', {scale:2, quality:0.9}); zip.file('OEBPS/images/cover.jpg', cover);
  const css = `@font-face{font-family:'Cormorant Garamond';src:url(fonts/cormorant-garamond-latin.woff2)}@font-face{font-family:'Cormorant Garamond';font-style:italic;src:url(fonts/cormorant-garamond-italic-latin.woff2)}@font-face{font-family:'Jost';src:url(fonts/jost-latin.woff2)}
body{font-family:Jost,sans-serif;line-height:1.6;color:#15181A;margin:0 5%}h1,h2,.title,.subtitle,blockquote{font-family:'Cormorant Garamond',serif;font-weight:500}.title{font-size:2.6em;font-weight:400;line-height:1.05;margin:1em 0 .3em}h1{font-size:1.9em;line-height:1.1}h2{font-size:1.4em}h3{font-size:1em;font-weight:500}.subtitle{font-style:italic;font-size:1.25em;color:#51575B}
.eyebrow{font-size:.72em;letter-spacing:.24em;text-transform:uppercase;color:#1F2E4A;font-weight:500;margin:1.5em 0 .5em}.lead{font-size:1.15em}blockquote{font-style:italic;font-size:1.35em;border-top:1px solid #0B0A08;border-bottom:1px solid #0B0A08;margin:1.2em 0;padding:.6em 0}blockquote footer{font-family:Jost,sans-serif;font-style:normal;font-size:.55em;letter-spacing:.2em;text-transform:uppercase;color:#51575B}
.callout{border-top:1px solid #0B0A08;background:#F3F4F2;padding:.8em 1em;margin:1.2em 0}.note{font-size:.85em;color:#51575B}table{border-collapse:collapse;width:100%;font-size:.9em;margin:1em 0}th{text-align:left;border-bottom:1px solid #0B0A08}td,th{padding:.4em .6em .4em 0;border-bottom:1px solid #CDD1D1}figure{margin:1em 0}img{max-width:100%}figcaption{font-size:.8em;color:#51575B}.logo{text-align:center}.logo img{width:120px}
hr{border:0;border-top:1px dashed #0B0A08;margin:1.5em 0}hr.line{border-top:1px solid #959B9E;margin:1.6em 0}.btn{display:inline-block;background:#0B0A08;color:#F3F4F2;padding:.6em 1.2em;letter-spacing:.16em;text-transform:uppercase;font-size:.8em}.sig{border-top:1px solid #0B0A08;padding-top:.4em;margin-top:2.5em;width:60%}.toc{list-style:none;padding:0}.toc li{margin:.4em 0}.spacer{margin:1em 0}`;
  zip.file('OEBPS/style.css', css); const items: { id: string; href: string; type: string; props?: string; spine?: boolean }[] = []; let imgN = 0;
  for (let i = 0; i < doc.pages.length; i++) { const p = clone(doc.pages[i]); for (const b of p.blocks as (Block & { __file?: string })[]) { if (b.t==='image' && b.src) { const bl = await (await fetch(b.src)).blob(); const ext = bl.type.includes('png')?'png':'jpg'; const fn = `images/img${++imgN}.${ext}`; zip.file('OEBPS/'+fn, bl); b.__file = fn; items.push({id:'img'+imgN, href:fn, type: ext==='png'?'image/png':'image/jpeg'}); } }
    const fn = `p${String(i+1).padStart(3,'0')}.xhtml`; const body = i === 0 ? `<div style="text-align:center"><img src="images/cover.jpg" alt="${xe(doc.title)}" style="max-height:100%"/></div>` : p.blocks.map(b=>blockXhtml(b, doc)).join('\n');
    zip.file('OEBPS/'+fn, `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en"><head><title>${xe(p.name)}</title><link rel="stylesheet" href="style.css"/></head><body${i===0?' epub:type="cover"':''}>${body}</body></html>`); items.push({id:'p'+(i+1), href:fn, type:'application/xhtml+xml', spine:true}); }
  const hs = D.headings(doc); zip.file('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Contents</title><link rel="stylesheet" href="style.css"/></head><body><nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${(hs.length?hs:doc.pages.map((p,i)=>({text:p.name,page:i}))).map(h=>`<li><a href="p${String(h.page+1).padStart(3,'0')}.xhtml">${xe(h.text)}</a></li>`).join('')}</ol></nav><nav epub:type="landmarks" hidden=""><ol><li><a epub:type="cover" href="p001.xhtml">Cover</a></li></ol></nav></body></html>`);
  zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="en"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">${id}</dc:identifier><dc:title>${xe(doc.title||doc.name)}</dc:title><dc:creator>${xe(doc.author||'Nonso Stitches')}</dc:creator><dc:language>en</dc:language><dc:publisher>Nonso Stitches</dc:publisher><meta property="dcterms:modified">${new Date().toISOString().slice(0,19)}Z</meta><meta name="cover" content="cover-img"/></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="css" href="style.css" media-type="text/css"/><item id="cover-img" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/><item id="logo" href="images/logo.jpg" media-type="image/jpeg"/>${fontFiles.map(f=>`<item id="f-${f}" href="fonts/${f}.woff2" media-type="font/woff2"/>`).join('')}${items.map(it=>`<item id="${it.id}" href="${it.href}" media-type="${it.type}"/>`).join('')}</manifest><spine>${items.filter(i=>i.spine).map(i=>`<itemref idref="${i.id}"/>`).join('')}</spine></package>`);
  return zip.generateAsync({type:'blob', mimeType:'application/epub+zip'}); };

/* PPTX (editable text where possible) */
export const pptx = async (doc: AnyDoc): Promise<Blob> => { await load('pptx'); await load('h2i'); await prep(); const pp = new PptxGenJS(); const sz = R.size(doc,0); const W = sz.w/96, H = (sz.h||1080)/96; pp.defineLayout({name:'NS', width:W, height:H}); pp.layout = 'NS'; pp.title = (doc.kind==='doc' && doc.title) || doc.name; pp.author = 'Nonso Stitches';
  const hx = (c?: string) => String(c||'#000000').replace('#','').slice(0,6).toUpperCase(); const inch = (px: number) => px/96; const ffName = (f: string) => /Cormorant/.test(f) ? 'Cormorant Garamond' : 'Jost';
  for (let i = 0; i < doc.pages.length; i++) { const sl = pp.addSlide();
    if (doc.kind === 'graphic') { const pg = doc.pages[i]; sl.background = {color: hx(pg.bg)}; if (pg.bgSrc) sl.background = {data: pg.bgSrc};
      for (const e of (pg.els||[]).slice().sort((a,b)=>(a.z||0)-(b.z||0))) { if (e.hidden || e.guide) continue; const box = {x:inch(e.x), y:inch(e.y), w:inch(e.w), h:inch(Math.max(e.h,1))};
        if (e.t==='text') { const fs = e.fs||16; sl.addText(e.up ? String(e.text||'').toUpperCase() : String(e.text||''), Object.assign(box, {fontFace: e.ff==='display'?'Cormorant Garamond':'Jost', fontSize: Math.max(1,fs*0.75), color: hx(e.c), bold: (e.fw||400) >= 600, italic: !!e.it, align: e.al==='justify'?'justify':e.al, valign: e.va==='middle'?'middle':e.va==='bottom'?'bottom':'top', charSpacing: (e.ls||0)*fs*0.75, lineSpacingMultiple: e.lh||1.2, margin: e.pad ? e.pad*0.75 : 0, fill: e.bg ? {color:hx(e.bg)} : undefined, line: e.bd ? {color:hx(e.bd), width:(e.bw||1)*0.75} : undefined, transparency: e.op!=null ? Math.round((1-e.op)*100) : 0, fit:'none'}) as TextO); }
        else if (e.t==='logo') sl.addImage(Object.assign(box, {data: cache.logoData}));
        else if (e.t==='image') { if (e.src) sl.addImage(Object.assign(box, {data: e.src, sizing:{type: e.fit==='contain'?'contain':'cover', w:box.w, h:box.h}}) as ImageO); else sl.addText(e.label||'Photo', Object.assign(box, {fill:{color:hx((palettes[pg.palette||doc.palette]||palettes.ink).place)}, fontFace:'Jost', fontSize:Math.max(8,Math.min(e.w,e.h)*0.024), color:'959B9E', align:'center', valign:'middle'}) as TextO); }
        else if (e.t==='rect') sl.addShape(pp.ShapeType.rect, Object.assign(box, {fill: e.bg ? {color:hx(e.bg)} : {type:'none'}, line: e.bd ? {color:hx(e.bd), width:0.75} : {type:'none'}}) as ShapeO);
        else if (e.t==='line') sl.addShape(pp.ShapeType.line, {x:box.x, y:box.y, w:box.w, h:0, line:{color:hx(e.c), width:0.75, dashType: e.dash?'dash':'solid'}});
        else if (e.t==='ring') sl.addShape(pp.ShapeType.ellipse, Object.assign(box, {fill:{type:'none'}, line:{color:hx(e.c), width:(e.bw||2)*0.75}}) as ShapeO);
        else if (e.t==='ticks') { const b = await rasterNode(R_el(e, pg, doc), e.w, e.h); sl.addImage(Object.assign(box, {data:b})); } } continue; }
    const {host, node} = await pageNode(doc, i); try { const pr = node.getBoundingClientRect(); const pg = doc.pages[i]; sl.background = {color: hx((palettes[pg.bg]||palettes.paper).bg)};
      for (const bn of node.querySelectorAll('[data-block]')) { const r = bn.getBoundingClientRect(); const box = {x:inch(r.left-pr.left), y:inch(r.top-pr.top), w:inch(r.width), h:inch(Math.max(r.height,2))}; const bt = bn.getAttribute('data-bt') || '';
        if (r.bottom - pr.top > pr.height + 1 || r.height < 1) continue;
        const simple = ['eyebrow','title','subtitle','h1','h2','h3','lead','para','note','byline','contact'].includes(bt); const tn = bn.querySelector('p,h1,h2,h3,h4');
        if (simple && tn) { const cs = getComputedStyle(tn); const tc = tn.textContent || ''; sl.addText(cs.textTransform==='uppercase' ? tc.toUpperCase() : tc, Object.assign(box, {fontFace: ffName(cs.fontFamily), fontSize: parseFloat(cs.fontSize)*0.75, color: rgbHex(cs.color), bold: +cs.fontWeight >= 600, italic: cs.fontStyle==='italic', align: ['center','right','justify'].includes(cs.textAlign)?cs.textAlign:'left', valign:'top', charSpacing: (parseFloat(cs.letterSpacing)||0)*0.75, lineSpacingMultiple: (parseFloat(cs.lineHeight)/parseFloat(cs.fontSize))||1.3, margin:0, fit:'none'}) as TextO); }
        else { const u = await htmlToImage.toPng(bn as HTMLElement, {pixelRatio:2, fontEmbedCSS: await fontCSS(), width:r.width, height:r.height}); sl.addImage(Object.assign(box, {data:u})); } }
      if (doc.settings.numbers && !doc.pages[i].hideNum && !['cover','back'].includes(doc.pages[i].layout)) sl.addText(String(R.pageNum(doc,i)), {x:W-1.6, y:H-0.8, w:1, h:0.4, fontFace:'Jost', fontSize:14, color:'51575B', align:'right'});
    } finally { host.remove(); } }
  return pp.write({outputType:'blob'}) as Promise<Blob>; };
const rgbHex = (c: string) => { const m: (string | number)[] = c.match(/\d+(\.\d+)?/g)||[0,0,0]; return m.slice(0,3).map(v=>(+v).toString(16).padStart(2,'0')).join('').toUpperCase(); };
const R_el = (e: El, pg: GPage, doc: GraphicDoc) => `<div style="position:relative;width:${e.w}px;height:${e.h}px">${R.el(Object.assign({},e,{x:0,y:0}), {P:palettes[pg.palette||doc.palette]||palettes.ink, W:doc.W})}</div>`;
export const rasterNode = async (html: string, w: number, h: number) => { const host = await mount(html, w); try { return await htmlToImage.toPng(host.firstElementChild as HTMLElement, {width:w, height:h, fontEmbedCSS: await fontCSS()}); } finally { host.remove(); } };

/* dispatch */
export const formatsFor = (doc: AnyDoc): [string, string][] => { if (doc.kind === 'graphic') return [['png','PNG'],['jpeg','JPEG'],['svg','SVG (HTML-in-SVG)'],['pdf','PDF'],['pptx','PowerPoint (editable)'],['html','HTML'],['txt','Copy text (.txt)']];
  const f: [string, string][] = [['pdf','PDF (exact layout)'],['pdfprint','Print / Save as PDF (selectable text)'],['png','PNG pages'],['jpeg','JPEG pages']];
  if (doc.type === 'presentation') f.push(['pptx','PowerPoint (editable text)']);
  if (doc.format !== 'email' && doc.type !== 'presentation') f.push(['docx','Word (.docx)']);
  if (doc.type === 'ebook') f.push(['epub','EPUB 3']);
  if (doc.format === 'email') f.push(['emailhtml','Email HTML (table-based)']);
  f.push(['html','HTML (print-ready)'],['md','Markdown'],['txt','Plain text']); return f; };
export const isPerPage = (fmt: string): fmt is 'png' | 'jpeg' | 'svg' => ['png','jpeg','svg'].includes(fmt);
export interface RunOpts extends RasterOpts { page?: number; progress?: (i: number, n: number) => void; win?: Window | null }
/** Build one export as a single file (a ZIP when a per-page format covers several pages). Null for print. */
export const fileFor = async (doc: AnyDoc, fmt: string, o: RunOpts = {}): Promise<{ blob: Blob; name: string } | null> => { const name = (i?: number | null) => fname(doc, i, fmt);
  if (isPerPage(fmt)) { const idx = o.page != null ? [o.page] : doc.pages.map((_,i)=>i);
    if (idx.length === 1) return { blob: await raster(doc, idx[0], fmt, o), name: name(doc.pages.length>1?idx[0]:null) };
    await load('zip'); const zip = new JSZip(); for (const i of idx) { zip.file(name(i), await raster(doc, i, fmt, o)); if (o.progress) o.progress(i+1, idx.length); } return { blob: await zip.generateAsync({type:'blob'}), name: slug(doc.name)+'-'+fmt+'.zip' }; }
  if (fmt === 'pdf') return { blob: await pdf(doc, o), name: name() };
  if (fmt === 'pdfprint') return null;
  if (fmt === 'pptx') return { blob: await pptx(doc), name: name() };
  if (fmt === 'docx' && doc.kind === 'doc') return { blob: await docx(doc), name: name() };
  if (fmt === 'epub' && doc.kind === 'doc') return { blob: await epub(doc), name: name() };
  if (fmt === 'html') return { blob: new Blob([await htmlDoc(doc)], {type:'text/html'}), name: name() };
  if (fmt === 'emailhtml' && doc.kind === 'doc') return { blob: new Blob([emailHtml(doc)], {type:'text/html'}), name: slug(doc.name)+'-email.html' };
  if (fmt === 'md') return { blob: new Blob([md(doc)], {type:'text/markdown'}), name: name() };
  if (fmt === 'txt') return { blob: new Blob([txt(doc)], {type:'text/plain'}), name: name() };
  throw new Error('Unknown format'); };
export const run = async (doc: AnyDoc, fmt: string, o: RunOpts = {}): Promise<unknown> => {
  if (fmt === 'pdfprint') return print(doc, o.win);
  const f = await fileFor(doc, fmt, o); if (f) download(f.blob, f.name); return f; };

/* ---------- share sheet (iPhone, Android, Samsung): "Save to Photos", WhatsApp, etc. ---------- */
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', pdf: 'application/pdf', zip: 'application/zip', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', epub: 'application/epub+zip', html: 'text/html', md: 'text/markdown', txt: 'text/plain' };
const asFile = (blob: Blob, name: string) => new File([blob], name, { type: blob.type || MIME[name.split('.').pop() || ''] || 'application/octet-stream' });
/** True when this browser can share files (iOS 15+ Safari, Android Chrome, Samsung Internet). */
export const canShareFiles = (type = 'image/png') => { try { return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [new File([''], 'x', { type })] }); } catch { return false; } };
export const share = async (blob: Blob, name: string) => { const file = asFile(blob, name); if (!navigator.canShare?.({ files: [file] })) throw new Error('Sharing this file type isn’t supported here — use Download.'); await navigator.share({ files: [file], title: name }); };
/** Export then open the share sheet. Returns false when the user dismissed the sheet. */
export const runShare = async (doc: AnyDoc, fmt: string, o: RunOpts = {}): Promise<boolean> => {
  const f = await fileFor(doc, fmt, o); if (!f) throw new Error('Use Download for this format.');
  try { await share(f.blob, f.name); return true; } catch (e) { if ((e as Error).name === 'AbortError') return false; throw e; } };
export const bulk = async (docs: AnyDoc[], fmt: string, progress?: (n: number, total: number) => void) => { await load('zip'); const zip = new JSZip(); let n = 0; const total = docs.reduce((a,d)=>a + (isPerPage(fmt) ? d.pages.length : 1), 0);
  for (const d of docs) { const folder = zip.folder(slug(d.name) + (d.kind==='graphic'?`-${d.W}x${d.H}`:''))!;
    if (isPerPage(fmt)) { for (let i = 0; i < d.pages.length; i++) { folder.file(fname(d, d.pages.length>1?i:null, fmt), await raster(d, i, fmt)); progress?.(++n, total); } }
    else { const b = fmt==='pdf' ? await pdf(d) : fmt==='md' ? new Blob([md(d)]) : fmt==='txt' ? new Blob([txt(d)]) : fmt==='html' ? new Blob([await htmlDoc(d)]) : fmt==='docx' && d.kind==='doc' && d.format!=='email' ? await docx(d) : null; if (b) folder.file(fname(d, null, fmt), b); progress?.(++n, total); } }
  download(await zip.generateAsync({type:'blob'}), 'nonso-stitches-' + fmt + '-export.zip'); };
export const zipFiles = async (paths: string[], zipName: string) => { await load('zip'); const zip = new JSZip(); for (const p of paths) { const r = await fetch(p); if (!r.ok) throw new Error('Missing asset: '+p); zip.file(p.replace(/^\//, ''), await r.blob()); } download(await zip.generateAsync({type:'blob'}), zipName); };
