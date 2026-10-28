/* Graphic templates: layout engine + registry. Port of lib/ns-graphics.js. */
import { palettes, uid } from './core';
import type { El, Slots, GPage, GraphicDoc, GraphicTemplate, Frame, Palette, PaletteKey, TextEl } from './types';

/** Layout context: artboard size, palette, type scale k, margin m, aspect a. */
export interface Ctx { W: number; H: number; P: Palette; k: number; m: number; a: number }
type Box = { x: number; y: number; h: number; w?: number };
type TOpts = Partial<El>;
type Item = TextEl | El | false | undefined | '' | null | 0;
export interface Layout { label: string; fn: (s: Slots, c: Ctx) => unknown[] }

const R = Math.round, clamp = (v: number, a: number, b: number)=>Math.max(a,Math.min(b,v));

/* ---------- primitives ---------- */
function est(text: unknown, fs: number, w: number, o: TOpts){ const cw = o.ff==='display' ? (o.it?0.42:0.46) : (o.up ? 0.62 + (o.ls||0) : 0.53); const per = Math.max(1, Math.floor(w/(fs*cw))); return String(text||' ').split('\n').reduce((n,l)=>n+Math.max(1,Math.ceil(l.length/per)),0); }
function txt(id: string, text: unknown, x: number, y: number, w: number, opts?: TOpts): TextEl { const o = Object.assign({ff:'sans',fs:16,fw:400,al:'left',va:'top',lh:1.3,ls:0,c:'#000'} as TOpts, opts) as TextEl & { lh: number }; const pad = o.pad||0; const h = o.h || R(est(text,o.fs,w-pad*2,o)*o.fs*o.lh + pad*2 + o.fs*0.1); return Object.assign({id,t:'text',text:String(text||''),x:R(x),y:R(y),w:R(w)}, o, {h:R(h)}); }
const ty = {
  eyebrow:(c: Ctx,col?: string): TOpts=>({ff:'sans',fs:Math.max(10,R(22*c.k)),fw:500,up:true,ls:.24,lh:1.4,c:col||c.P.accent}),
  display:(c: Ctx,sc?: number): TOpts=>({ff:'display',fs:Math.max(14,R(92*c.k*(sc||1))),fw:400,lh:1.02,ls:-.015,c:c.P.text}),
  h:(c: Ctx,sc?: number): TOpts=>({ff:'display',fs:Math.max(13,R(52*c.k*(sc||1))),fw:500,lh:1.1,c:c.P.text}),
  body:(c: Ctx,sc?: number): TOpts=>({ff:'sans',fs:Math.max(10,R(30*c.k*(sc||1))),fw:400,lh:1.45,c:c.P.text2}),
  quote:(c: Ctx,sc?: number): TOpts=>({ff:'display',it:true,fs:Math.max(14,R(66*c.k*(sc||1))),fw:400,lh:1.2,c:c.P.text}),
  meta:(c: Ctx): TOpts=>({ff:'sans',fs:Math.max(10,R(22*c.k)),fw:400,lh:1.4,ls:.04,c:c.P.text2}),
  btn:(c: Ctx): TOpts & { fs: number; pad: number }=>({ff:'sans',fs:Math.max(9,R(22*c.k)),fw:500,up:true,ls:.16,lh:1,al:'center',va:'middle',bg:c.P.cta,c:c.P.ctaText,r:2,pad:Math.max(6,R(22*c.k))}),
};
function btn(c: Ctx, id: string, text: string, x: number, y: number): TextEl { const o = ty.btn(c); const w = R(text.length*o.fs*0.78 + o.pad*2.6); return txt(id, text, x, y, w, Object.assign(o,{h:R(o.fs+o.pad*2)})); }
function stack(els: El[], gap: number | number[]){ let y = 0; els.forEach((e,i)=>{ e.y = R(y); y += e.h + (Array.isArray(gap)?gap[i]||0:gap); }); return {els, h: y - (Array.isArray(gap)?gap[els.length-1]||0:gap)}; }
function place(st: { els: El[] }, x: number, y: number){ st.els.forEach(e=>{ e.x += x; e.y += y; }); return st.els; }
function anchor(c: Ctx, items: Item[], gap: number | number[], box: Box, va: string): TextEl[] { const st = stack(items.filter(Boolean) as El[], gap); const y = va==='bottom' ? box.y+box.h-st.h : va==='middle' ? box.y+(box.h-st.h)/2 : box.y; st.els.forEach(e=>{ e.x = box.x + (e.x||0); e.y = R(e.y + y); }); return st.els as TextEl[]; }
function logo(c: Ctx, x: number, y: number, L: number, o: { below?: boolean } = {}): El[] { if (L >= 120) return [{id:'logo',t:'logo',x:R(x),y:R(y),w:R(L),h:R(L)}]; L = clamp(L,44,52); const fs = R(L*0.3); const name = 'NONSO STITCHES'; const nw = R(name.length*fs*0.84);
  const nm = o.below ? txt('brandname',name,x,y+L+R(L*0.25),Math.max(nw,L),{ff:'display',fs,fw:500,ls:.18,c:c.P.text,lh:1.1}) : txt('brandname',name,x+L+R(L*0.35),y,nw,{ff:'display',fs,fw:500,ls:.18,c:c.P.text,va:'middle',h:L,lh:1.1});
  return [{id:'logo',t:'logo',x:R(x),y:R(y),w:L,h:L}, nm]; }
function img(id: string, x: number,y: number,w: number,h: number, label?: string): El { return {id,t:'image',x:R(x),y:R(y),w:R(w),h:R(h),src:'',fit:'cover',label:label||'Photo'}; }
function rule(c: Ctx, id: string, x: number, y: number, w: number, o: { c?: string; dash?: boolean } = {}): El { return {id,t:'line',x:R(x),y:R(y),w:R(w),h:1,c:o.c||c.P.rule,dash:o.dash!==false,bw:1}; }
function rect(id: string,x: number,y: number,w: number,h: number,bg: string,o?: TOpts): El { return Object.assign({id,t:'rect',x:R(x),y:R(y),w:R(w),h:R(h),bg},o||{}); }
const ctx = (W: number,H: number,P: Palette): Ctx=>({W,H,P,k:clamp(Math.sqrt(W*H)/1080,.2,3),m:R(Math.min(W,H)*0.075),a:W/H});
const list = (s: Slots,p: string)=>{ const out: [string, string][]=[]; for(let i=1;i<=8;i++){ if (s[p+i]!=null && s[p+i]!=='') out.push([p+i,s[p+i]]); } return out; };
const L0 = (c: Ctx)=>R(clamp(Math.min(c.W,c.H)*0.14,44,300));

/* ---------- layouts ---------- */
export const layouts: Record<string, Layout> = {}; const LY = layouts;
LY.statement = {label:'Statement', fn(s: Slots,c: Ctx){ const {W,H,m}=c; const Lg=L0(c); const w = W-m*2; const out=[...logo(c,m,m,Lg)];
  out.push(rule(c,'rule',m,m+Math.max(Lg,44)+R(m*0.6),w));
  const top = m+Math.max(Lg,44)+m; const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(c)), txt('title',s.title,0,0,w*(c.a>1.3?0.7:1),ty.display(c,s.titleScale||1)), s.body&&txt('body',s.body,0,0,Math.min(w,c.k*900),ty.body(c)), s.cta&&btn(c,'cta',s.cta,0,0)];
  return out.concat(anchor(c,items,[R(24*c.k),R(32*c.k),R(44*c.k)],{x:m,y:top,h:H-top-m},'bottom')); }};
LY.center = {label:'Centred', fn(s: Slots,c: Ctx){ const {W,H,m}=c; const w=W-m*2; const Lg=L0(c); const out=[...logo(c,(W-Lg)/2,m,Lg)];
  const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,Object.assign(ty.eyebrow(c),{al:'center'})), txt('title',s.title,0,0,w,Object.assign(ty.display(c,s.titleScale||1),{al:'center'})), s.body&&txt('body',s.body,R(w*0.1),0,w*0.8,Object.assign(ty.body(c),{al:'center'})), s.cta&&Object.assign(btn(c,'cta',s.cta,0,0))];
  const els = anchor(c,items,[R(24*c.k),R(32*c.k),R(44*c.k)],{x:m,y:m+Lg+m*0.5,h:H-Lg-m*2.5},'middle'); const b = els.find(e=>e.id==='cta'); if (b) b.x = R((W-b.w)/2); return out.concat(els); }};
LY.split = {label:'Image + text', fn(s: Slots,c: Ctx){ const {W,H,m}=c; const port = c.a < 0.9; const out=[];
  if (port){ const ih = R(H*0.52); out.push(img('image',0,0,W,ih,s.imageLabel)); const w=W-m*2; const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(c)), txt('title',s.title,0,0,w,ty.display(c,0.82*(s.titleScale||1))), s.body&&txt('body',s.body,0,0,w,ty.body(c)), s.cta&&btn(c,'cta',s.cta,0,0)];
    out.push(...anchor(c,items,[R(20*c.k),R(28*c.k),R(40*c.k)],{x:m,y:ih+m,h:H-ih-m*2},'top')); const Lg=clamp(R(m*1.1),44,140); out.push(...logo(c,W-m-Lg,H-m-Lg,Lg)); return out; }
  const iw = R(W*(s.imageRatio||0.5)); out.push(img('image',0,0,iw,H,s.imageLabel)); const x=iw+m, w=W-iw-m*2; const Lg=clamp(R(Math.min(w,H)*0.2),44,180);
  out.push(...logo(c,x,m,Lg)); const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(c)), txt('title',s.title,0,0,w,ty.display(c,0.72*(s.titleScale||1))), s.body&&txt('body',s.body,0,0,w,ty.body(c,0.9)), s.cta&&btn(c,'cta',s.cta,0,0)];
  return out.concat(anchor(c,items,[R(20*c.k),R(28*c.k),R(40*c.k)],{x,y:m+Lg+m*0.5,h:H-Lg-m*2.5},'bottom')); }};
LY.imageFull = {label:'Full-bleed image', fn(s: Slots,c: Ctx){ const {W,H,m}=c; const out=[img('image',0,0,W,H,s.imageLabel)]; const w=W-m*2;
  const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(c)), txt('title',s.title,0,0,w,ty.display(c,0.8*(s.titleScale||1))), s.body&&txt('body',s.body,0,0,w,ty.body(c)), s.cta&&btn(c,'cta',s.cta,0,0)];
  const st = stack(items.filter(Boolean),[R(20*c.k),R(28*c.k),R(40*c.k)]); const ph = st.h + m*2; out.push(rect('panel',0,H-ph,W,ph,c.P.bg)); out.push(...place(st,m,H-ph+m));
  const Lg=clamp(R(Math.min(W,H)*0.12),44,200); out.push(...logo(c,W-m-Lg,m,Lg)); return out; }};
LY.quote = {label:'Quote', fn(s: Slots,c: Ctx){ const {W,H,m}=c; const w=W-m*2; const Lg=clamp(R(Math.min(W,H)*0.12),44,200);
  const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(c)), txt('quote','\u201C'+String(s.quote||'').replace(/^\u201C|\u201D$/g,'')+'\u201D',0,0,w,ty.quote(c,s.titleScale||1)), rule(c,'rule',0,0,R(120*c.k)), s.attrib&&txt('attrib',s.attrib,0,0,w,Object.assign(ty.meta(c),{c:c.P.text,fw:500})), s.meta&&txt('meta',s.meta,0,0,w,ty.meta(c))];
  return (anchor(c,items,[R(32*c.k),R(40*c.k),R(28*c.k),R(8*c.k)],{x:m,y:m,h:H-m*2-Lg-m*0.5},'middle') as El[]).concat(logo(c,W-m-Lg,H-m-Lg,Lg)); }};
LY.stat = {label:'Statistic', fn(s: Slots,c: Ctx){ const {W,H,m}=c; const w=W-m*2; const Lg=L0(c); const out=[...logo(c,m,m,Lg), {id:'ticks',t:'ticks',x:m,y:m+Math.max(Lg,44)+R(m*0.6),w,h:R(16*c.k),c:c.P.rule}];
  const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(c)), txt('stat',s.stat,0,0,w,Object.assign(ty.display(c,2.4),{lh:0.9})), txt('title',s.title,0,0,w*0.85,ty.h(c,0.9)), s.body&&txt('body',s.body,0,0,w*0.85,ty.body(c,0.9))];
  return out.concat(anchor(c,items,[R(16*c.k),R(28*c.k),R(20*c.k)],{x:m,y:m+Lg+m,h:H-Lg-m*3},'bottom')); }};
LY.poll = {label:'Poll / options', fn(s: Slots,c: Ctx){ const {W,H,m}=c; const w=W-m*2; const opts=list(s,'opt'); const oh=R(Math.max(44,96*c.k));
  const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(c)), txt('title',s.title,0,0,w,ty.display(c,0.75))];
  opts.forEach(([id,t],i)=>items.push(txt(id,String.fromCharCode(65+i)+'   '+t,0,0,w,Object.assign(ty.body(c,1.05),{c:c.P.text,bd:c.P.text,bw:1,pad:R(26*c.k),h:oh,va:'middle'}))));
  if (s.meta) items.push(txt('meta',s.meta,0,0,w,ty.meta(c)));
  const gaps=items.map((e,i)=>i===0?R(20*c.k):i===1?R(48*c.k):R(18*c.k)); const Lg=clamp(R(Math.min(W,H)*0.1),44,160);
  return (anchor(c,items,gaps,{x:m,y:m,h:H-m*2-Lg},'middle') as El[]).concat(logo(c,W-m-Lg,H-m-Lg,Lg)); }};
LY.compare = {label:'Comparison', fn(s: Slots,c: Ctx){ const {W,H,m}=c; const w=W-m*2; const g=R(m*0.8); const cw=(w-g)/2; const out=[];
  const head=anchor(c,[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(c)), txt('title',s.title,0,0,w,ty.display(c,0.7))],R(20*c.k),{x:m,y:m,h:0},'top'); out.push(...head); const hb = head[head.length-1].y+head[head.length-1].h+R(m*0.8);
  [['a',s.headA,s.listA],['b',s.headB,s.listB]].forEach(([k,h,l],i)=>{ const x=m+i*(cw+g); out.push(rule(c,'rule'+k,x,hb,cw,{dash:false,c:c.P.text})); out.push(txt('head'+k,h,x,hb+R(24*c.k),cw,ty.h(c,0.8))); out.push(txt('list'+k,l,x,hb+R(24*c.k)+R(80*c.k),cw,Object.assign(ty.body(c),{lh:1.7}))); });
  const Lg=clamp(R(Math.min(W,H)*0.1),44,160); out.push(...logo(c,W-m-Lg,H-m-Lg,Lg)); return out; }};
LY.list = {label:'Numbered list', fn(s: Slots,c: Ctx){ const {W,H,m}=c; const w=W-m*2; const its=list(s,'item'); const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(c)), txt('title',s.title,0,0,w,ty.display(c,0.72))];
  its.forEach(([id,t],i)=>items.push(txt(id,String(i+1).padStart(2,'0')+'   '+t,0,0,w,Object.assign(ty.body(c,1.05),{c:c.P.text,bt:c.P.rule,pad:0,lh:1.45}))));
  if (s.cta) items.push(btn(c,'cta',s.cta,0,0)); const gaps=items.map((e,i)=>i===0?R(20*c.k):i===1?R(56*c.k):R(30*c.k)); const Lg=clamp(R(Math.min(W,H)*0.1),44,160);
  return (anchor(c,items,gaps,{x:m,y:m,h:H-m*2-Lg},'middle') as El[]).concat(logo(c,W-m-Lg,H-m-Lg,Lg)); }};
LY.event = {label:'Event', fn(s: Slots,c: Ctx){ const {W,H,m}=c; const w=W-m*2; const Lg=L0(c); const out=[...logo(c,m,m,Lg)];
  const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(c)), txt('date',s.date,0,0,w,Object.assign(ty.display(c,1.6),{lh:.95,c:c.P.accent==='#E0B04F'?c.P.accent:c.P.text})), rule(c,'rule',0,0,w), txt('title',s.title,0,0,w,ty.h(c,1)), s.meta&&txt('meta',s.meta,0,0,w,ty.body(c,0.9)), s.cta&&btn(c,'cta',s.cta,0,0)];
  return out.concat(anchor(c,items,[R(20*c.k),R(32*c.k),R(32*c.k),R(16*c.k),R(40*c.k)],{x:m,y:m+Lg+m,h:H-Lg-m*3},'bottom')); }};
LY.beforeAfter = {label:'Before / after', fn(s: Slots,c: Ctx){ const {W,H,m}=c; const w=W-m*2; const head=anchor(c,[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(c)), txt('title',s.title,0,0,w*0.8,ty.display(c,0.6))],R(16*c.k),{x:m,y:m,h:0},'top');
  const hb=head[head.length-1].y+head[head.length-1].h+R(m*0.6); const g=R(12*c.k); const iw=(w-g)/2; const ih=H-hb-m-R(60*c.k); const out=[...head, img('image',m,hb,iw,ih,s.imageLabel||'Before'), img('image2',m+iw+g,hb,iw,ih,s.image2Label||'After'),
  txt('labelA',s.labelA||'Before',m,hb+ih+R(16*c.k),iw,ty.eyebrow(c)), txt('labelB',s.labelB||'After',m+iw+g,hb+ih+R(16*c.k),iw,ty.eyebrow(c))]; const Lg=clamp(R(Math.min(W,H)*0.09),44,140); out.push(...logo(c,W-m-Lg,m,Lg)); return out; }};
LY.thumb = {label:'Thumbnail', fn(s: Slots,c: Ctx){ const {W,H,m}=c; const iw=R(W*0.46); const out=[img('image',W-iw,0,iw,H,s.imageLabel)]; const w=W-iw-m*2;
  const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,Object.assign(ty.eyebrow(c),{fs:R(30*c.k),bg:c.P.accent,c:c.P.bg,pad:R(10*c.k),al:'center'})), txt('title',s.title,0,0,w,Object.assign(ty.display(c,1.25*(s.titleScale||1)),{fw:500,lh:.95}))];
  const els=anchor(c,items,R(28*c.k),{x:m,y:m,h:H-m*2},'middle'); const eb=els.find(e=>e.id==='eyebrow'); if (eb) eb.w=R(eb.text.length*eb.fs*0.95+eb.pad*2); const Lg=clamp(R(H*0.18),44,160); return out.concat(els, logo(c,W-iw-m-Lg+m*0.5,H-m-Lg+m*0.5,Lg)); }};
LY.banner = {label:'Wide banner', fn(s: Slots,c: Ctx){ const {W,H}=c; const sa = s.safe ? {x:(W-s.safe[0])/2,y:(H-s.safe[1])/2,w:s.safe[0],h:s.safe[1]} : {x:0,y:0,w:W,h:H}; const m=R(sa.h*0.14); const k=clamp(sa.h/500,.25,3); const cc=Object.assign({},c,{k});
  const Lg=R(sa.h-m*2) >= 120 ? Math.min(R(sa.h*0.66),R(sa.h-m*2)) : 48; const out=[...logo(cc,sa.x+m,sa.y+(sa.h-Math.max(Lg,44))/2,Lg)]; const x=sa.x+m+Math.max(Lg,44)+m*(Lg<120?4.2:1); const w=sa.x+sa.w-m-x-(s.cta?R(320*k):0);
  const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(cc)), txt('title',s.title,0,0,w,Object.assign(ty.display(cc,0.9*(s.titleScale||1)))), s.body&&txt('body',s.body,0,0,w,ty.body(cc,0.85))];
  out.push(...anchor(cc,items,[R(14*k),R(16*k)],{x,y:sa.y+m*0.6,h:sa.h-m*1.2},'middle')); if (s.cta){ const b=btn(cc,'cta',s.cta,0,0); b.x=R(sa.x+sa.w-m-b.w); b.y=R(sa.y+(sa.h-b.h)/2); out.push(b); }
  if (s.safe) out.push({id:'safe',t:'rect',x:R(sa.x),y:R(sa.y),w:R(sa.w),h:R(sa.h),bd:c.P.text2,bw:1,dashBd:true,guide:true}); return out; }};
LY.logoCenter = {label:'Logo centred', fn(s: Slots,c: Ctx){ const {W,H,m}=c; const Lg=R(Math.min(W,H)*(s.title?0.46:0.62)); const out=[{id:'logo',t:'logo',x:R((W-Lg)/2),y:R(s.title?H*0.16:(H-Lg)/2),w:Lg,h:Lg}];
  if (s.title){ const w=W-m*2; out.push(...anchor(c,[txt('title',s.title,0,0,w,Object.assign(ty.display(c,1),{al:'center'})), s.body&&txt('body',s.body,0,0,w,Object.assign(ty.eyebrow(c),{al:'center',c:c.P.text2}))],R(24*c.k),{x:m,y:H*0.16+Lg+m*0.6,h:H*0.84-Lg-m*1.6},'middle')); } return out; }};
LY.avatar = {label:'Avatar', fn(s: Slots,c: Ctx){ const {W,H}=c; const v=s.avatar||'badge'; const out=[];
  if (v==='badge') out.push({id:'logo',t:'logo',x:0,y:0,w:W,h:H});
  else if (v==='padded') out.push({id:'logo',t:'logo',x:R(W*.1),y:R(H*.1),w:R(W*.8),h:R(H*.8)});
  else if (v==='ring'){ out.push({id:'ring',t:'ring',x:R(W*.06),y:R(H*.06),w:R(W*.88),h:R(H*.88),c:'#E0B04F',bw:Math.max(1,R(W/200))}); out.push({id:'logo',t:'logo',x:R(W*.2),y:R(H*.2),w:R(W*.6),h:R(H*.6)}); }
  else if (v==='portrait'){ out.push(img('image',0,0,W,H,s.imageLabel||'Portrait')); out.push({id:'logo',t:'logo',x:R(W*.66),y:R(H*.66),w:R(W*.3),h:R(H*.3)}); }
  else out.push({id:'logo',t:'logo',x:R(W*.18),y:R(H*.18),w:R(W*.64),h:R(H*.64)}); return out; }};
LY.hero = {label:'Web hero', fn(s: Slots,c: Ctx){ const {W,H}=c; const mob=W<700; const m=mob?20:W<1200?40:64; const k=mob?0.5:W<1200?0.7:0.9; const cc=Object.assign({},c,{k,m}); const nh=mob?64:80; const out=[];
  out.push(...logo(cc,m,(nh-48)/2,48)); out.push(rule(cc,'navrule',0,nh,W,{dash:false,c:c.P.text2}));
  if (!mob) out.push(txt('nav',s.nav||'Services     Our work     About     Contact',W-m-R(W*0.4),0,R(W*0.4)-(s.navCta?180:0),{ff:'sans',fs:14,ls:.04,c:c.P.text,va:'middle',h:nh,al:'right'}));
  if (s.navCta && !mob){ const b=btn(cc,'navCta',s.navCta,0,0); b.x=W-m-b.w; b.y=R((nh-b.h)/2); out.push(b); }
  const body = {x:m,y:nh,w:W-m*2,h:H-nh};
  if (s.layout2==='stack' || mob){ const ih=s.imageLabel?R(body.h*0.42):0; if (ih) out.push(img('image',0,H-ih,W,ih,s.imageLabel)); const w=body.w; const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(cc)), txt('title',s.title,0,0,w,ty.display(cc,mob?1:1)), s.body&&txt('body',s.body,0,0,Math.min(w,640),ty.body(cc,mob?1.1:0.9)), s.cta&&btn(cc,'cta',s.cta,0,0)];
    out.push(...anchor(cc,items,[16,24,32],{x:m,y:nh+m*0.8,h:body.h-ih-m*1.6},'middle')); return out; }
  const iw=R(W*0.42); if (s.imageLabel) out.push(img('image',W-iw,nh+1,iw,H-nh-1,s.imageLabel)); const w=W-iw-m*2-(s.imageLabel?m:0);
  const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(cc)), txt('title',s.title,0,0,w,ty.display(cc,1.05)), s.body&&txt('body',s.body,0,0,Math.min(w,600),ty.body(cc,0.85)), s.cta&&btn(cc,'cta',s.cta,0,0)];
  const els=anchor(cc,items,[16,28,40],{x:m,y:nh,h:body.h},'middle'); out.push(...els); if (s.cta2){ const b=els.find(e=>e.id==='cta')!; const b2=btn(cc,'cta2',s.cta2,0,0); Object.assign(b2,{x:b.x+b.w+16,y:b.y,bg:'',bd:c.P.text,bw:1,c:c.P.text}); out.push(b2); } return out; }};
LY.cards = {label:'Web cards', fn(s: Slots,c: Ctx){ const {W,H}=c; const mob=W<700; const m=mob?20:W<1200?40:64; const k=mob?0.5:W<1200?0.7:0.85; const cc=Object.assign({},c,{k,m}); const w=W-m*2; const out=[];
  out.push(...anchor(cc,[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(cc)), txt('title',s.title,0,0,Math.min(w,760),ty.display(cc,0.7))],16,{x:m,y:m,h:0},'top'));
  const its=list(s,'item'); const cols=mob?1:Math.min(its.length,W<1200?2:its.length); const g=24; const cw=(w-g*(cols-1))/cols; const top=out[out.length-1].y+out[out.length-1].h+m*0.8; const rows=Math.ceil(its.length/cols); const ch=Math.min(R((H-top-m-(rows-1)*g)/rows), 520);
  its.forEach(([id,t],i)=>{ const x=m+(i%cols)*(cw+g), y=top+Math.floor(i/cols)*(ch+g); const [ttl,...rest]=String(t).split('\n'); const ih = s.cardImages ? R(ch*0.5) : 0;
    out.push(rule(cc,'r'+id,x,y,cw,{dash:false,c:c.P.text})); if (ih) out.push(img('img'+id,x,y+1,cw,ih,'Photo')); out.push(txt(id,ttl,x,y+ih+16,cw,ty.h(cc,0.6))); out.push(txt('d'+id,rest.join('\n'),x,y+ih+16+R(52*k)+12,cw,ty.body(cc,mob?1.1:0.75))); });
  return out; }};
LY.form = {label:'Web form / contact', fn(s: Slots,c: Ctx){ const {W,H}=c; const mob=W<700; const m=mob?20:W<1200?40:64; const k=mob?0.5:W<1200?0.7:0.85; const cc=Object.assign({},c,{k,m}); const out=[];
  const lw=mob?W-m*2:R((W-m*3)*0.42); out.push(...anchor(cc,[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,lw,ty.eyebrow(cc)), txt('title',s.title,0,0,lw,ty.display(cc,0.75)), s.body&&txt('body',s.body,0,0,lw,ty.body(cc,mob?1.1:0.85))],[16,24],{x:m,y:m,h:mob?0:H-m*2},mob?'top':'middle'));
  const fx=mob?m:m*2+lw, fw=mob?W-m*2:W-fx-m; let fy=mob?out[out.length-1].y+out[out.length-1].h+32:m; const fields=list(s,'field');
  fields.forEach(([id,t])=>{ out.push(txt('l'+id,t,fx,fy,fw,{ff:'sans',fs:13,fw:500,ls:.04,c:c.P.text})); out.push(rect('box'+id,fx,fy+24,fw,48,c.P.panel,{bd:'#7F8588',bw:1,r:2})); fy+=24+48+20; });
  if (s.cta){ const b=btn(cc,'cta',s.cta,fx,fy+8); out.push(b); } return out; }};
LY.strip = {label:'Leaderboard strip', fn(s: Slots,c: Ctx){ const {W,H}=c; const m=R(H*0.2); const k=H/300; const cc=Object.assign({},c,{k:clamp(k,.18,1)}); const out=[...logo(cc,m*0.6,(H-Math.min(48,H-m))/2,Math.min(48,H-m))]; out[0].w=out[0].h=Math.min(48,H-R(H*.2)); out[0].y=R((H-out[0].h)/2);
  if (out[1]) { out[1].x=R(out[0].x+out[0].w+m*0.5); out[1].y=out[0].y; out[1].h=out[0].h; out[1].fs=R(Math.max(9,out[0].h*0.3)); out[1].w=R(14*out[1].fs*0.84); }
  const x=(out[1]?out[1].x+out[1].w:out[0].w)+m*1.2; const b=s.cta?btn(cc,'cta',s.cta,0,0):null; if (b){ b.fs=Math.max(9,R(H*0.16)); b.pad=R(H*0.15); b.h=R(b.fs+b.pad*2); b.w=R(s.cta.length*b.fs*0.78+b.pad*2.6); b.x=W-m-b.w; b.y=R((H-b.h)/2); }
  const w=(b?b.x:W)-x-m; out.push(txt('title',s.title,x,0,w,{ff:'display',fs:R(Math.max(12,H*0.3)),lh:1.05,c:c.P.text,va:'middle',h:H})); if (b) out.push(b); return out; }};
LY.tower = {label:'Skyscraper', fn(s: Slots,c: Ctx){ const {W,H}=c; const m=R(W*0.12); const w=W-m*2; const k=W/420; const cc=Object.assign({},c,{k}); const out=[...logo(cc,m,m,w>=120?w:48,{below:true})];
  const items=[s.eyebrow&&txt('eyebrow',s.eyebrow,0,0,w,ty.eyebrow(cc)), txt('title',s.title,0,0,w,ty.display(cc,0.9)), s.body&&txt('body',s.body,0,0,w,ty.body(cc,1)), s.cta&&btn(cc,'cta',s.cta,0,0)];
  const els=anchor(cc,items,[R(12*k),R(18*k),R(24*k)],{x:m,y:m+120,h:H-m*2-120},'bottom'); const b=els.find(e=>e.id==='cta'); if (b){ b.w=w; } return out.concat(els); }};

export const layoutOf = (name: string, W: number, H: number): string => { const a = W/H; if (!['avatar','logoCenter','hero','cards','form','banner'].includes(name)) { if (a > 3.6) return 'strip'; if (a < 0.36) return 'tower'; } if (name==='banner' && a > 6) return 'strip'; return name; };
export const layoutChoices = ['statement','center','split','imageFull','quote','stat','poll','list','compare','event','beforeAfter','thumb','banner','logoCenter','avatar','hero','cards','form'];

/* ---------- build ---------- */
export const buildEls = (layout: string, slots: Slots, W: number, H: number, palKey: PaletteKey): El[] => { const P = palettes[palKey] || palettes.ink; const c = ctx(W,H,P); const ly = LY[layoutOf(layout,W,H)] || LY.statement; const els = ly.fn(slots, c).filter(Boolean) as El[]; els.forEach((e,i)=>{ e.z = i; }); return els; };
export const slotIds = ['eyebrow','title','body','cta','cta2','quote','attrib','meta','stat','date','headA','headB','listA','listB','labelA','labelB','nav','navCta'];
export const harvest = (page: GPage): Slots => { const s = Object.assign({}, page.slots); (page.els||[]).forEach(e=>{ if (e.user) return; if (e.t==='text' && e.id in s) s[e.id] = e.id==='quote' ? String(e.text).replace(/^\u201C|\u201D$/g,'') : String(e.text).replace(/^(\d\d|[A-H])\s{3}/,''); if (e.t==='text' && /^(item|opt|field)\d$/.test(e.id)) s[e.id] = String(e.text).replace(/^(\d\d|[A-H])\s{3}/,''); }); (page.els||[]).forEach(e=>{ if (!e.user && e.t==='text' && /^ditem\d$/.test(e.id)) { const k=e.id.slice(1); s[k] = String(s[k]||'').split('\n')[0] + '\n' + e.text; } }); (page.els||[]).forEach(e=>{ if (e.t==='image' && e.src) { s['__src_'+e.id] = e.src; s['__fit_'+e.id] = e.fit; } }); return s; };
export const layoutPage = (page: GPage, W: number, H: number, palKey: PaletteKey, oldW?: number, oldH?: number): GPage => {
  const slots = page.els ? harvest(page) : page.slots; const els = buildEls(page.layout, slots, W, H, page.palette || palKey);
  els.forEach(e=>{ if (e.t==='image' && slots['__src_'+e.id]) { e.src = slots['__src_'+e.id]; e.fit = slots['__fit_'+e.id]||'cover'; } });
  if (page.cards) {} // card texts harvested via item slots
  const sx = oldW ? W/oldW : 1, sy = oldH ? H/oldH : 1, sf = Math.min(sx,sy);
  const user = (page.els||[]).filter(e=>e.user).map(e=>Object.assign({}, e, {x:R(e.x*sx), y:R(e.y*sy), w:R(e.w*sx), h:R(e.h*sy), fs:e.fs?R(e.fs*sf):e.fs}));
  return Object.assign({}, page, {slots, els: els.concat(user), bg: (palettes[page.palette||palKey]||palettes.ink).bg});
};
export const counter = (page: GPage, i: number, n: number, W: number, H: number, palKey: PaletteKey): GPage => { if (n < 2) return page; const P = palettes[page.palette||palKey]; const m = R(Math.min(W,H)*0.075); const fs = Math.max(10,R(22*Math.sqrt(W*H)/1080)); page.els = (page.els||[]).filter(e=>e.id!=='counter'); page.els.push({id:'counter',t:'text',text:String(i+1).padStart(2,'0')+' / '+String(n).padStart(2,'0'),x:W-m-200,y:m,w:200,h:fs*2,ff:'sans',fs,fw:500,ls:.16,al:'right',va:'top',lh:1.4,c:P.text2,z:999}); return page; };

/* ---------- registry ---------- */
const SZ: Record<string, [string, number, number][]> = {
  sq:[['Square post',1080,1080]], st:[['Story / reel',1080,1920]], pt:[['Portrait feed',1080,1350]], yt:[['YouTube thumbnail',1280,720]], av:[['Avatar',400,400],['Avatar @2x',800,800]],
  ad:[['Square',1080,1080],['Landscape 1.91:1',1200,628],['Story 9:16',1080,1920],['Medium rectangle',300,250],['Leaderboard',728,90],['Skyscraper',160,600],['Mobile banner',320,50],['Portrait 4:5',1080,1350]],
  web:[['Desktop',1440,900],['Tablet',834,1112],['Mobile',390,844]],
};
export const templates: GraphicTemplate[] = []; const T = templates;
const add = (cat: string, id: string, name: string, layout: string, palette: PaletteKey, slots: Slots, sizes?: [string, number, number][], extra?: Partial<GraphicTemplate>) => T.push(Object.assign({id, cat, name, layout, palette, slots, sizes: sizes || SZ.sq, variants:['ink','chalk','cotton','indigo','paper']}, extra||{}));
export const cats: [string, string, string][] = [
  ['social-square','Square posts','1080 × 1080'],['engagement','Engagement posts','1080 × 1080'],['carousel','Carousels','1080 × 1080 · multi-slide'],['stories','Stories & reels','1080 × 1920'],
  ['portrait','Portrait feed posts','1080 × 1350'],['youtube','YouTube thumbnails','1280 × 720'],['banners','Banners & covers','Per platform'],['avatars','Avatars','400 × 400'],
  ['ads','Advertising','Multi-format'],['web','Web sections','Desktop · tablet · mobile'],['editorial','Article banners & editorial','Per channel'],
];
// Square posts
add('social-square','sq-announcement','Announcement','statement','ink',{eyebrow:'Studio news',title:'Bookings for festive fittings are open.',body:'Tell us the date and the garment. We’ll plan your fittings backwards from there.',cta:'Book a fitting'});
add('social-square','sq-product-update','Service update','split','chalk',{eyebrow:'New in the studio',title:'Alterations, now by appointment.',body:'Bring in the pieces that almost fit. We’ll pin them while you wait.',cta:'Request an alteration',imageLabel:'Photo: tailor pinning a trouser hem, 4:5'});
add('social-square','sq-testimonial','Testimonial','quote','chalk',{eyebrow:'Client words',quote:'It fits like it was always mine.',attrib:'[Client first name]',meta:'[Garment] · [Occasion]'});
add('social-square','sq-educational','Educational tip','list','cotton',{eyebrow:'Fit notes',title:'Three signs your jacket needs a tailor',item1:'The shoulder seam sits past your shoulder.',item2:'The collar lifts away from your neck.',item3:'Buttoning it pulls an X across the front.'});
add('social-square','sq-statistic','Statistic','stat','ink',{eyebrow:'At the cutting table',stat:'[00]',title:'measurements taken for a made-to-measure suit.',body:'Replace with a confirmed figure before posting.'});
add('social-square','sq-launch','Launch','imageFull','ink',{eyebrow:'Now booking',title:'Made to fit you.',body:'Custom wear for men and women.',cta:'Book a fitting',imageLabel:'Photo: finished garment on client, full length'});
add('social-square','sq-quote','Brand statement','center','ink',{eyebrow:'Classic fits · Modern styles',title:'Every garment deserves thoughtful craftsmanship.'});
add('social-square','sq-founder-story','Founder story','split','paper',{eyebrow:'From the studio',title:'Why we measure twice.',body:'[Founder name] on the first garment that taught them fit is personal.',imageLabel:'Photo: founder at the cutting table, 4:5'});
add('social-square','sq-before-after','Before & after','beforeAfter','chalk',{eyebrow:'Alteration',title:'Taken in at the waist, hem shortened.',imageLabel:'Before — same garment, same light',image2Label:'After — same garment, same light'});
add('social-square','sq-event','Event','event','indigo',{eyebrow:'Open fitting day',date:'[Sat 00 Mon]',title:'Come in for measurements and fabric advice.',meta:'[Time] · [Address]',cta:'Reserve a slot'});
add('social-square','sq-cta','Call to action','statement','chalk',{eyebrow:'Occasion wear',title:'A better fit starts with you.',body:'Tell us the date. We’ll take it from there.',cta:'Start an inquiry'});
add('social-square','sq-behind-scenes','Behind the scenes','imageFull','chalk',{eyebrow:'At the cutting table',title:'Chalk, pins, patience.',imageLabel:'Photo: chalk-marking a hem, 1:1 detail'});
add('social-square','sq-comparison','Comparison','compare','paper',{eyebrow:'Fit notes',title:'Made to measure vs. altered',headA:'Made to measure',listA:'Cut from your measurements\nYour fabric, your design\nTwo or more fittings',headB:'Altered',listB:'Starts from a garment you own\nAdjusts length, waist, sleeves\nOften one fitting'});
// Engagement
add('engagement','eng-poll','Poll','poll','chalk',{eyebrow:'Your turn',title:'Which would you have made first?',opt1:'A suit for work',opt2:'An agbada for a wedding',opt3:'A dress for an occasion',meta:'Answer in the comments.'});
add('engagement','eng-question','Question','center','ink',{eyebrow:'Tell us',title:'What’s the one garment that has never fit you right?'});
add('engagement','eng-this-or-that','This or that','compare','cotton',{eyebrow:'This or that',title:'Which fit is yours?',headA:'Slim',listA:'Close through the chest\nTapered leg',headB:'Relaxed',listB:'Room through the body\nStraight leg'});
add('engagement','eng-fill-blank','Fill in the blank','statement','indigo',{eyebrow:'Finish the sentence',title:'A good fit makes me feel ______.',body:'Answer in the comments.'});
add('engagement','eng-community-spotlight','Community spotlight','split','chalk',{eyebrow:'Community spotlight',title:'[Client first name], in her wedding aso-ebi.',body:'Shared with permission.',imageLabel:'Photo: client in finished garment, 4:5'});
add('engagement','eng-quiz','Quiz','poll','ink',{eyebrow:'Quick quiz',title:'Where should trouser hems break?',opt1:'No break',opt2:'Slight break',opt3:'Full break',opt4:'It depends on the shoe',meta:'Answer tomorrow.'});
add('engagement','eng-caption-this','Caption this','imageFull','ink',{eyebrow:'Caption this',title:'Your best caption wins a free alteration.',body:'[Confirm offer before posting]',imageLabel:'Photo: playful fitting moment'});
// Carousels
const car = (id: string,name: string,pal: PaletteKey,frames: Frame[]) => add('carousel',id,name,frames[0].layout,pal,frames[0].slots,SZ.sq,{frames});
car('car-educational','Educational carousel','chalk',[
  {layout:'statement',slots:{eyebrow:'Fit notes',title:'How a suit should fit you.',body:'Five checks to do in the mirror.'}},
  {layout:'list',slots:{eyebrow:'01 · Shoulders',title:'The seam ends where your shoulder ends.',item1:'No dimple below the seam.',item2:'No overhang past the arm.'}},
  {layout:'list',slots:{eyebrow:'02 · Chest',title:'Buttoned, it lies flat.',item1:'No pulling into an X.',item2:'A fist fits between jacket and chest.'}},
  {layout:'list',slots:{eyebrow:'03 · Sleeves',title:'A little shirt cuff shows.',item1:'About 1–1.5 cm of cuff.',item2:'Arms relaxed at your sides.'}},
  {layout:'statement',palette:'ink',slots:{eyebrow:'Need a hand?',title:'Bring it in. We’ll check the fit with you.',cta:'Book a fitting'}}]);
car('car-how-it-works','How it works','ink',[
  {layout:'statement',slots:{eyebrow:'How it works',title:'From your measurements to the finished piece.'}},
  {layout:'statement',slots:{eyebrow:'Step 01',title:'Tell us the garment and the date.'}},
  {layout:'statement',slots:{eyebrow:'Step 02',title:'First fitting: measurements and fabric.'}},
  {layout:'statement',slots:{eyebrow:'Step 03',title:'Second fitting: we adjust on you.'}},
  {layout:'statement',slots:{eyebrow:'Step 04',title:'Collect it ready to wear.',cta:'Start an inquiry'}}]);
car('car-comparison','Comparison carousel','cotton',[
  {layout:'statement',slots:{eyebrow:'This or that',title:'Alter it, or make it new?'}},
  {layout:'compare',slots:{eyebrow:'The difference',title:'What each one does',headA:'Alter',listA:'Fixes length and width\nKeeps the garment you love',headB:'Make new',listB:'Your design from scratch\nYour measurements from the start'}},
  {layout:'statement',palette:'ink',slots:{eyebrow:'Not sure?',title:'Bring it in and we’ll tell you honestly.',cta:'Chat on WhatsApp'}}]);
car('car-lookbook','Lookbook carousel','ink',[
  {layout:'imageFull',slots:{eyebrow:'Lookbook',title:'Classic fits, modern styles.',imageLabel:'Photo: men’s look, full length'}},
  {layout:'imageFull',slots:{eyebrow:'Look 01',title:'Navy senator, slim leg.',imageLabel:'Photo: men’s senator, 4:5'}},
  {layout:'imageFull',slots:{eyebrow:'Look 02',title:'Iro and buba in wax print.',imageLabel:'Photo: women’s iro and buba, 4:5'}},
  {layout:'statement',slots:{eyebrow:'Yours next',title:'Made to your measurements.',cta:'Book a fitting'}}]);
car('car-testimonials','Testimonial carousel','chalk',[
  {layout:'center',slots:{eyebrow:'Client words',title:'In their words.'}},
  {layout:'quote',slots:{eyebrow:'Wedding agbada',quote:'[Client quote, used with permission]',attrib:'[First name]'}},
  {layout:'quote',slots:{eyebrow:'Office dresses',quote:'[Client quote, used with permission]',attrib:'[First name]'}},
  {layout:'statement',palette:'ink',slots:{eyebrow:'Your turn',title:'A better fit starts with you.',cta:'Book a fitting'}}]);
// Stories
add('stories','st-announcement','Announcement','statement','ink',{eyebrow:'Studio news',title:'Festive bookings are open.',body:'Book early for fittings before [date].',cta:'Book a fitting'},SZ.st);
add('stories','st-quote','Quote','quote','chalk',{eyebrow:'Client words',quote:'It fits like it was always mine.',attrib:'[Client first name]'},SZ.st);
add('stories','st-poll','Poll','poll','cotton',{eyebrow:'Your turn',title:'Slim or relaxed?',opt1:'Slim',opt2:'Relaxed',meta:'Vote with the sticker.'},SZ.st);
add('stories','st-behind-scenes','Behind the scenes','imageFull','ink',{eyebrow:'At the cutting table',title:'Second fitting, final pins.',imageLabel:'Photo: pinning at fitting, 9:16'},SZ.st);
add('stories','st-countdown','Event countdown','event','indigo',{eyebrow:'Open fitting day',date:'[3 days]',title:'until our open fitting day.',meta:'[Date] · [Address]',cta:'Reserve a slot'},SZ.st);
add('stories','st-testimonial','Testimonial','split','chalk',{eyebrow:'Client words',title:'“[Short client quote]”',body:'[First name] · [Garment]',imageLabel:'Photo: client in garment, 9:16'},SZ.st);
add('stories','st-product-update','Service update','split','paper',{eyebrow:'New',title:'Alterations, now by appointment.',cta:'Request an alteration',imageLabel:'Photo: alteration detail'},SZ.st);
add('stories','st-cta','Call to action','center','ink',{eyebrow:'Swipe up',title:'Made to fit you.',cta:'Book a fitting'},SZ.st);
// Portrait
add('portrait','pt-lookbook','Lookbook','imageFull','ink',{eyebrow:'Look 01',title:'Charcoal suit, made to measure.',imageLabel:'Photo: full-length portrait, 4:5'},SZ.pt);
add('portrait','pt-testimonial','Testimonial','quote','paper',{eyebrow:'Client words',quote:'They listened to how I wanted it to feel, not just look.',attrib:'[Client first name]',meta:'[Garment]'},SZ.pt);
add('portrait','pt-tip','Fit tip','list','cotton',{eyebrow:'Fit notes',title:'Measuring at home? Three rules.',item1:'Measure over thin clothing.',item2:'Keep the tape flat, not tight.',item3:'Ask someone else to hold it.'},SZ.pt);
add('portrait','pt-statistic','Statistic','stat','ink',{eyebrow:'In the studio',stat:'[00]',title:'fittings this month.',body:'Replace with a confirmed figure.'},SZ.pt);
add('portrait','pt-launch','Launch','split','chalk',{eyebrow:'Now booking',title:'Your style, thoughtfully tailored.',cta:'Book a fitting',imageLabel:'Photo: men’s and women’s looks together'},SZ.pt);
add('portrait','pt-founder','Founder story','imageFull','ink',{eyebrow:'From the studio',title:'[Founder name] on why fit is personal.',imageLabel:'Photo: founder portrait at work'},SZ.pt);
// YouTube
add('youtube','yt-tutorial','Tutorial','thumb','ink',{eyebrow:'How to',title:'Measure yourself properly',imageLabel:'Photo: tape measure at chest'},SZ.yt);
add('youtube','yt-vlog','Studio vlog','thumb','chalk',{eyebrow:'In the studio',title:'A wedding agbada, start to finish',imageLabel:'Photo: finished agbada'},SZ.yt);
add('youtube','yt-comparison','Before / after','beforeAfter','ink',{eyebrow:'Alteration',title:'Too big → just right',imageLabel:'Before',image2Label:'After'},SZ.yt);
// Banners
const bn = (id: string,name: string,W: number,H: number,pal: PaletteKey,slots: Slots,layout?: string,extra?: Partial<GraphicTemplate>) => add('banners',id,name,layout||'banner',pal,slots,[[name,W,H]],extra);
bn('bn-x','X header',1500,500,'ink',{eyebrow:'Men · Women · Custom wear',title:'Made to fit you.'});
bn('bn-linkedin-personal','LinkedIn personal banner',1584,396,'chalk',{eyebrow:'Nonso Stitches',title:'Clothing thoughtfully made to fit you.'});
bn('bn-linkedin-company','LinkedIn company cover',1128,191,'ink',{title:'Classic fits, modern styles.'});
bn('bn-facebook','Facebook cover',1640,624,'ink',{eyebrow:'Men · Women · Custom wear',title:'Your style, thoughtfully tailored.',cta:'Book a fitting'});
bn('bn-youtube','YouTube channel art',2560,1440,'ink',{eyebrow:'Men · Women · Custom wear',title:'Made to fit you.',safe:[1546,423]});
bn('bn-twitch','Twitch banner',1200,480,'indigo',{eyebrow:'Live from the studio',title:'Cutting-table sessions.'});
bn('bn-podcast','Podcast cover',3000,3000,'ink',{title:'[Podcast title]',body:'Nonso Stitches'},'logoCenter');
bn('bn-newsletter','Newsletter header',1200,400,'chalk',{eyebrow:'The fitting notes',title:'[Issue title]'});
bn('bn-website','Website banner',1920,640,'ink',{eyebrow:'Men · Women · Custom wear',title:'A better fit starts with you.',cta:'Book a fitting'});
bn('bn-event','Event banner',1920,1080,'indigo',{eyebrow:'Open fitting day',date:'[Sat 00 Mon]',title:'Measurements, fabric advice and fittings.',meta:'[Time] · [Address]',cta:'Reserve a slot'},'event');
bn('bn-community','Community banner',960,540,'ink',{eyebrow:'Community',title:'The Nonso Stitches circle.'});
// Avatars
[['av-badge','Badge — full bleed','badge','ink'],['av-padded','Badge — padded','padded','ink'],['av-chalk-tile','Chalk tile','tile','chalk'],['av-gold-ring','Gold ring','ring','ink'],['av-indigo','Indigo tile','tile','indigo'],['av-portrait','Portrait with tile','portrait','ink']].forEach(([id,n,v,p])=>add('avatars',id,n,'avatar',p as PaletteKey,{avatar:v},SZ.av));
// Ads
add('ads','ad-fitting','Book a fitting','statement','ink',{eyebrow:'Made to measure',title:'Made to fit you.',body:'Custom wear for men and women.',cta:'Book a fitting'},SZ.ad);
add('ads','ad-alteration','Alterations','split','chalk',{eyebrow:'Alterations',title:'Almost fits? Bring it in.',cta:'Request an alteration',imageLabel:'Photo: hem being pinned'},SZ.ad);
add('ads','ad-occasion','Occasion wear','imageFull','ink',{eyebrow:'Occasion wear',title:'Ready for the day.',cta:'Start an inquiry',imageLabel:'Photo: occasion outfit, men and women'},SZ.ad);
add('ads','ad-testimonial','Testimonial ad','quote','chalk',{eyebrow:'Client words',quote:'It fits like it was always mine.',attrib:'[Client first name]'},SZ.ad);
add('ads','ad-retarget','Retargeting','center','indigo',{eyebrow:'Still thinking about it?',title:'Your fitting is one message away.',cta:'Chat on WhatsApp'},SZ.ad);
// Web
add('web','web-hero','Landing hero','hero','chalk',{eyebrow:'Men · Women · Custom wear',title:'Made to fit you.',body:'Clothing thoughtfully made to fit you, your style and your life.',cta:'Book a fitting',cta2:'Chat on WhatsApp',navCta:'Book a fitting',imageLabel:'Photo: editorial, men’s and women’s looks, 3:4'},SZ.web);
add('web','web-services','Services','cards','paper',{eyebrow:'Services',title:'What we make and mend',item1:'Made to measure\nCut from your measurements, fitted on you.',item2:'Garment construction\nYour design, built properly from fabric.',item3:'Alterations\nHems, waists, sleeves — clothes that fit again.',item4:'Personalised pieces\nOne-off details that are yours alone.'},SZ.web);
add('web','web-testimonial','Testimonials','quote','cotton',{eyebrow:'Client words',quote:'They listened to how I wanted it to feel, not just look.',attrib:'[Client first name]',meta:'[Garment] · [Occasion]'},SZ.web);
add('web','web-cta','CTA band','center','ink',{eyebrow:'Ready when you are',title:'A better fit starts with you.',body:'Tell us the garment and the date.',cta:'Book a fitting'},SZ.web);
add('web','web-contact','Contact / inquiry','form','chalk',{eyebrow:'Start an inquiry',title:'Tell us what you need.',body:'We’ll reply on WhatsApp to arrange your fitting.',field1:'Your name',field2:'Phone or WhatsApp',field3:'What would you like made or altered?',cta:'Send inquiry'},SZ.web);
add('web','web-gallery','Gallery','cards','paper',{eyebrow:'Our work',title:'Recent pieces',item1:'Navy senator\nMen · made to measure',item2:'Wax-print dress\nWomen · made to measure',item3:'Charcoal suit\nMen · altered',cardImages:true},SZ.web);
add('web','web-about','About','split','paper',{eyebrow:'About the studio',title:'Every garment deserves thoughtful craftsmanship.',body:'[Studio story — to be supplied by the owner.]',imageLabel:'Photo: studio, cutting table'},SZ.web);
add('web','web-404','404 page','center','chalk',{eyebrow:'Page not found',title:'This page has slipped off the rail.',cta:'Back to home'},SZ.web);
// Editorial
const ed = (id: string,name: string,sizes: [string, number, number][],layout: string,pal: PaletteKey,extra?: Partial<GraphicTemplate>) => add('editorial',id,name,layout,pal,{eyebrow:'The fitting notes',title:'How a suit should fit you',body:'Five checks to do in the mirror before your next fitting.',imageLabel:'Photo: suit detail, shoulder seam'},sizes,Object.assign({article:true},extra||{}));
ed('ed-x-article','X article image (5:2)',[['X article 5:2',1500,600],['X article 5:2 @2x',3000,1200]],'banner','ink');
ed('ed-x-post','X post image',[['X post 16:9',1600,900]],'split','chalk');
ed('ed-linkedin-article','LinkedIn article cover',[['LinkedIn article',1920,1080]],'split','paper');
ed('ed-linkedin-post','LinkedIn post image',[['LinkedIn post 1.91:1',1200,627],['LinkedIn square',1200,1200]],'statement','ink');
ed('ed-medium','Medium header',[['Medium 16:9',1400,788]],'statement','chalk');
ed('ed-web-hero','Website article hero',[['Article hero',1920,800],['Article hero mobile',780,980]],'split','ink');
ed('ed-blog-promo','Blog promotion (Open Graph)',[['Open Graph',1200,630]],'statement','indigo');
ed('ed-newsletter-promo','Newsletter promotion',[['Newsletter promo',1200,600],['Newsletter inline',600,300]],'banner','chalk');
ed('ed-pinterest','Pinterest pin',[['Pinterest 2:3',1000,1500]],'split','chalk');

/* ---------- create a working graphic doc ---------- */
export interface CreateOpts { size?: number; palette?: PaletteKey; slots?: Slots }
export const create = (tpl: GraphicTemplate, opt: CreateOpts = {}): GraphicDoc => { const [,W,H] = tpl.sizes[opt.size||0]; const palette = opt.palette || tpl.palette;
  const frames: Frame[] = tpl.frames || [{layout:tpl.layout, slots:tpl.slots}];
  const pages = frames.map((f,i)=>{ const slots = Object.assign({}, f.slots, i===0 ? (opt.slots||{}) : {}); const p = layoutPage({id:uid(), name: frames.length>1 ? 'Slide '+(i+1) : 'Artboard', layout: tpl.layout==='avatar'?'avatar':f.layout, palette: f.palette, slots}, W, H, palette); return p; });
  pages.forEach((p,i)=>counter(p,i,pages.length,W,H,palette));
  return {kind:'graphic', tpl:tpl.id, name:tpl.name, W, H, sizeIndex:opt.size||0, palette, pages, updated:Date.now()}; };
export const relayout = (doc: GraphicDoc, W: number, H: number, palette: PaletteKey): GraphicDoc => { const oW = doc.W, oH = doc.H; const pages = doc.pages.map(p=>layoutPage(p, W, H, palette, oW, oH)); pages.forEach((p,i)=>counter(p,i,pages.length,W,H,palette)); return Object.assign({}, doc, {W, H, palette, pages}); };
export const blankFrame = (doc: GraphicDoc): GPage => layoutPage({id:uid(), name:'Slide', layout:'statement', slots:{eyebrow:'Eyebrow',title:'New slide title'}}, doc.W, doc.H, doc.palette);
