/* Document templates: formats, block types, page libraries per document type. Port of lib/ns-docs.js. */
import { uid, clone } from './core';
import type { Block, BlockType, DPage, DocDoc, DocTemplate, Format, PageLayout, PaletteKey } from './types';

export const formats: Record<string, Format> = {
  a4:{label:'A4 portrait', w:794, h:1123, m:76, base:1, mm:'210 × 297 mm'},
  letter:{label:'US Letter', w:816, h:1056, m:76, base:1, mm:'8.5 × 11 in'},
  ebook:{label:'Book 6 × 9 in', w:576, h:864, m:58, base:0.9, mm:'6 × 9 in'},
  a5:{label:'A5 book', w:559, h:794, m:54, base:0.86, mm:'148 × 210 mm'},
  slide:{label:'Slide 16:9', w:1920, h:1080, m:120, base:2.1, mm:'1920 × 1080 px'},
  slide43:{label:'Slide 4:3', w:1440, h:1080, m:100, base:1.9, mm:'1440 × 1080 px'},
  email:{label:'Email 600 px', w:600, h:0, m:40, base:1, mm:'600 px wide, auto height'},
};
export const blockTypes: Record<BlockType, string> = {
  eyebrow:'Eyebrow', title:'Title', subtitle:'Subtitle', h1:'Heading 1', h2:'Heading 2', h3:'Heading 3', lead:'Lead paragraph', para:'Paragraph', quote:'Pull quote', callout:'Callout', note:'Note',
  list:'List', table:'Table', image:'Image / figure', gallery:'Gallery', stats:'Statistics', chart:'Bar chart', timeline:'Timeline', kv:'Key–value rows', steps:'Numbered steps', columns:'Two columns',
  toc:'Table of contents', takeaways:'Key takeaways', exercise:'Exercise', byline:'Byline / metadata', cta:'Call to action', logo:'Logo', divider:'Divider', spacer:'Spacer', signature:'Signature', contact:'Contact details',
};
export const blockHelp: Partial<Record<BlockType, string>> = { list:'One item per line.', table:'One row per line, cells separated by |. First row is the header.', stats:'One per line: value | label', chart:'One per line: label | number', timeline:'One per line: when | what', kv:'One per line: key | value',
  steps:'One per line: step title | description', columns:'Separate the two columns with a line containing ---', gallery:'One caption per line (one image each).', takeaways:'One takeaway per line.', exercise:'Prompt text. Answer lines are added below.', cta:'Line 1: message. Button label in the Button field.', contact:'One detail per line.', toc:'Generated from Heading 1 and Title blocks. Text is the TOC heading.' };
let n = 0;
/** Block constructor. */
export const B = (t: BlockType, text?: string, o?: Partial<Block>): Block => Object.assign({id:'b'+(++n)+uid().slice(0,3), t, text: text||''}, o||{});
/** Page factory constructor: returns a function that builds a fresh page each call. */
export type PageFactory = () => DPage;
export const P = (name: string, layout: PageLayout, blocks: () => Block[], o?: Partial<DPage>): PageFactory => () => Object.assign({id:uid(), name, layout, bg: (layout==='cover'||layout==='divider'||layout==='back' ? 'ink' : 'paper') as PaletteKey, blocks: blocks()}, o||{});

const lorem = {
  fit:'A garment fits when it follows your body without pulling, gaping or collapsing. That depends on more than a size label. It depends on your posture, how you move, the fabric, and the occasion.',
  measure:'Measurements are where every made-to-measure garment begins. We take them standing relaxed, over light clothing, and we write down how you like things to sit as well as the numbers.',
  fitting:'A fitting is a conversation. We pin, chalk and adjust on you, and ask how it feels when you sit, reach and walk. Most garments need two fittings; some occasion pieces need three.',
  alter:'Most ready-made clothing is cut for an average body that nobody has. An alteration closes the gap: a shorter hem, a taken-in waist, a sleeve that ends where your wrist does.',
};

/* ---------- page libraries ---------- */
export const lib: Record<string, Record<string, PageFactory>> = {}; const L = lib;
L.ebook = {
  cover:P('Front cover','cover',()=>[B('logo','',{sz:1.2}),B('spacer','',{sz:3}),B('title','The Fit Guide',{al:'center'}),B('subtitle','How clothing should fit you — and what to ask your tailor',{al:'center'}),B('spacer','',{sz:2}),B('byline','Nonso Stitches',{al:'center'})],{va:'middle',hideNum:true}),
  halftitle:P('Half title','page',()=>[B('spacer','',{sz:8}),B('h1','The Fit Guide',{al:'center'})],{hideNum:true,hideHeader:true}),
  title:P('Title page','page',()=>[B('spacer','',{sz:6}),B('title','The Fit Guide',{al:'center'}),B('subtitle','How clothing should fit you',{al:'center'}),B('spacer','',{sz:6}),B('byline','[Author name]\nNonso Stitches',{al:'center'})],{hideNum:true,hideHeader:true}),
  copyright:P('Copyright','page',()=>[B('spacer','',{sz:14}),B('note','Copyright © [Year] Nonso Stitches. All rights reserved.\nNo part of this publication may be reproduced without written permission, except brief quotations in reviews.\nFirst edition [Year]. ISBN [to be assigned].\nTypeset in Cormorant Garamond and Jost.')],{hideNum:true,hideHeader:true}),
  dedication:P('Dedication','page',()=>[B('spacer','',{sz:10}),B('quote','For everyone who has ever been told to “just size up”.',{al:'center'})],{hideNum:true,hideHeader:true}),
  epigraph:P('Epigraph','page',()=>[B('spacer','',{sz:10}),B('quote','Every garment deserves thoughtful craftsmanship; every customer deserves a fit that feels personal.',{al:'center',cap:'— Nonso Stitches'})],{hideNum:true,hideHeader:true}),
  toc:P('Contents','page',()=>[B('eyebrow','Contents'),B('toc','Contents')],{hideHeader:true}),
  foreword:P('Foreword','page',()=>[B('eyebrow','Foreword'),B('h1','Foreword'),B('para','[Foreword by an invited contributor. Confirm the writer and their words before publishing.]'),B('para',lorem.fit),B('signature','[Name]\n[Role]')]),
  preface:P('Preface','page',()=>[B('eyebrow','Preface'),B('h1','Preface'),B('para','This guide collects what we explain most often at the cutting table: how a garment should sit, what to look for in the mirror, and what to ask for at a fitting.'),B('para',lorem.measure)]),
  intro:P('Introduction','page',()=>[B('eyebrow','Introduction'),B('h1','Why fit is personal'),B('lead','Two people can wear the same size and need completely different garments.'),B('para',lorem.fit),B('para',lorem.fitting)]),
  part:P('Part opener','divider',()=>[B('eyebrow','Part one'),B('title','Measure'),B('subtitle','Where every garment begins')],{va:'middle',hideHeader:true}),
  chapter:P('Chapter opener','page',()=>[B('spacer','',{sz:5}),B('eyebrow','Chapter 1'),B('h1','Taking your measurements'),B('divider',''),B('lead','The tape measure is the least interesting tool in the studio — and the most important.'),B('para',lorem.measure)],{hideHeader:true}),
  section:P('Body — sections','page',()=>[B('h2','Chest, waist and hip'),B('para','Measure the chest at the fullest part with your arms relaxed. Measure the natural waist where you bend sideways. Measure the hip at the fullest part of the seat.'),B('h3','A note on ease'),B('para','Ease is the room we add for movement. A tailored jacket needs less than a kaftan; a dance outfit needs more than a dinner suit.'),B('para',lorem.fit,{al:'justify'})]),
  quotes:P('Body — quote & callout','page',()=>[B('para',lorem.fitting,{al:'justify'}),B('quote','A good fit is something you stop noticing.'),B('callout','Measure over thin clothing, keep the tape flat, and ask someone else to hold it.',{label:'Tip'}),B('para',lorem.alter,{al:'justify'})]),
  figure:P('Body — figure & table','page',()=>[B('image','',{cap:'Figure 1.1 — Where to measure the chest, waist and hip.',ratio:'3:2',label:'Diagram or photo: measuring points'}),B('table','Measurement | Where | Tip\nChest | Fullest part | Arms relaxed\nWaist | Natural waist | Don’t hold your breath\nHip | Fullest part of seat | Feet together'),B('note','All measurements in cm or in; write down which.')]),
  lists:P('Body — lists & notes','page',()=>[B('h2','What to bring to your first fitting'),B('list','The shoes you’ll wear with the garment\nA photo of the style you like\nYour fabric, if you have it\nThe date you need it by'),B('h3','What we’ll ask you'),B('list','How you want it to feel\nWhere you’ll wear it\nAnything that has never fit you right',{ord:true}),B('note','Fitting length and number of fittings vary by garment.')]),
  casestudy:P('Case study','page',()=>[B('eyebrow','Case study'),B('h2','[Client first name]’s wedding agbada'),B('kv','Garment | Agbada, three pieces\nFittings | [number]\nTimeline | [weeks]'),B('para','[Describe the brief, the fit challenge and the solution. Use a real client story with permission.]'),B('quote','[Client quote, used with permission]',{cap:'— [First name]'})]),
  exercise:P('Exercise','page',()=>[B('eyebrow','Exercise'),B('h2','Your mirror check'),B('exercise','Put on your best-fitting jacket. Note where it feels right and where it pulls.',{lines:6})]),
  reflection:P('Reflection','page',()=>[B('eyebrow','Reflection'),B('h2','Think about it'),B('exercise','Which garment in your wardrobe do you wear most? Why does it work?',{lines:8})]),
  takeaways:P('Key takeaways','page',()=>[B('takeaways','Measure relaxed, over thin clothing.\nWrite down how you like it to sit, not just numbers.\nBring your shoes to the fitting.',{label:'Key takeaways'})]),
  summary:P('Chapter summary','page',()=>[B('eyebrow','Chapter summary'),B('h2','In this chapter'),B('para','We covered where to measure, how much ease to allow, and what to bring to a first fitting.'),B('divider','')]),
  conclusion:P('Conclusion','page',()=>[B('eyebrow','Conclusion'),B('h1','A better fit starts with you'),B('para',lorem.fit),B('para','Bring this guide to your next fitting. Point at the page. We’ll take it from there.')]),
  appendix:P('Appendix','page',()=>[B('eyebrow','Appendix A'),B('h1','Measurement record'),B('table','Measurement | Value | Date\nChest |  | \nWaist |  | \nHip |  | \nInseam |  | \nSleeve |  | ')]),
  references:P('References','page',()=>[B('eyebrow','References'),B('h1','References'),B('list','[Author, Title, Publisher, Year]\n[Author, Title, Publisher, Year]',{ord:true})]),
  bibliography:P('Bibliography','page',()=>[B('eyebrow','Bibliography'),B('h1','Further reading'),B('list','[Author, Title, Publisher, Year]\n[Author, Title, Publisher, Year]')]),
  acknowledgements:P('Acknowledgements','page',()=>[B('eyebrow','Acknowledgements'),B('h1','Thank you'),B('para','[Thank the clients, studio team and collaborators who made this book possible.]')]),
  author:P('About the author','page',()=>[B('eyebrow','About the author'),B('image','',{ratio:'1:1',label:'Author portrait',w:0.4}),B('h2','[Author name]'),B('para','[Short biography — to be supplied. Do not invent experience or credentials.]')]),
  cta:P('Final call to action','divider',()=>[B('eyebrow','Ready when you are'),B('title','Book a fitting'),B('cta','Tell us the garment and the date. We’ll plan your fittings from there.',{btn:'Book a fitting'}),B('contact','[Phone / WhatsApp]\n[Address]\n[Website]')],{va:'middle',hideHeader:true}),
  back:P('Back cover','back',()=>[B('lead','How should a suit sit on your shoulders? Where should a hem break? What should you ask at a fitting?'),B('para','The Fit Guide answers the questions we hear most at the cutting table — for men and women, for made-to-measure and alterations.'),B('spacer','',{sz:4}),B('logo','',{sz:0.8})],{va:'bottom',hideNum:true,hideHeader:true}),
};
L.report = {
  cover:P('Cover','cover',()=>[B('logo','',{sz:0.8}),B('spacer','',{sz:6}),B('eyebrow','Annual report'),B('title','[Year] studio report'),B('subtitle','Nonso Stitches · Prepared [date]')],{va:'bottom',hideNum:true}),
  toc:P('Contents','page',()=>[B('eyebrow','Contents'),B('toc','Contents')]),
  exec:P('Executive summary','page',()=>[B('eyebrow','01'),B('h1','Executive summary'),B('lead','[One-paragraph summary of the year — confirmed figures only.]'),B('stats','[00] | fittings\n[00] | alterations\n[00] | new clients'),B('para','[Key points and decisions.]')]),
  intro:P('Introduction & scope','page',()=>[B('eyebrow','02'),B('h1','Introduction'),B('para','[Purpose of the report and the period covered.]'),B('kv','Period | [Start] – [End]\nPrepared by | [Name]\nAudience | [Team / partners]')]),
  research:P('Research & method','page',()=>[B('eyebrow','03'),B('h1','Research & method'),B('para','[How data was collected: booking records, client feedback, surveys.]'),B('list','[Source 1]\n[Source 2]\n[Source 3]')]),
  findings:P('Findings','page',()=>[B('eyebrow','04'),B('h1','Findings'),B('h2','[Finding one]'),B('para','[Evidence and detail.]'),B('h2','[Finding two]'),B('para','[Evidence and detail.]'),B('callout','[Most important finding in one sentence.]',{label:'Key finding'})]),
  data:P('Data visualisation','page',()=>[B('eyebrow','05'),B('h1','Bookings by service'),B('chart','Made to measure | 40\nAlterations | 32\nGarment construction | 18\nPersonalised pieces | 10',{cap:'Sample values — replace with confirmed data.'}),B('table','Service | Q1 | Q2 | Q3 | Q4\nMade to measure | – | – | – | –\nAlterations | – | – | – | –')]),
  analysis:P('Analysis','page',()=>[B('eyebrow','06'),B('h1','Analysis'),B('para','[What the findings mean and why.]'),B('columns','[Strengths]\n---\n[Challenges]')]),
  recs:P('Recommendations','page',()=>[B('eyebrow','07'),B('h1','Recommendations'),B('steps','[Recommendation one] | [Why and how]\n[Recommendation two] | [Why and how]\n[Recommendation three] | [Why and how]')]),
  conclusion:P('Conclusion','page',()=>[B('eyebrow','08'),B('h1','Conclusion'),B('para','[Summary and next steps.]')]),
  appendix:P('Appendix','page',()=>[B('eyebrow','Appendix'),B('h1','Supporting data'),B('table','Item | Value\n[Item] | [Value]')]),
  references:P('References','page',()=>[B('eyebrow','References'),B('h1','References'),B('list','[Source]\n[Source]',{ord:true})]),
  back:P('Back cover','back',()=>[B('logo','',{sz:0.8}),B('contact','[Address]\n[Phone / WhatsApp]\n[Website]')],{va:'bottom',hideNum:true,hideHeader:true}),
};
L.whitepaper = {
  cover:P('Cover','cover',()=>[B('logo','',{sz:0.8}),B('spacer','',{sz:6}),B('eyebrow','Whitepaper'),B('title','Fit before fabric'),B('subtitle','Why measurement-led tailoring reduces remakes')],{va:'bottom',hideNum:true}),
  abstract:P('Executive summary','page',()=>[B('eyebrow','Summary'),B('h1','Executive summary'),B('lead','[The argument in three sentences.]'),B('takeaways','[Key point]\n[Key point]\n[Key point]',{label:'In brief'})]),
  problem:P('Problem statement','page',()=>[B('eyebrow','01'),B('h1','The problem'),B('para',lorem.alter),B('callout','[State the problem in one sentence.]',{label:'Problem'})]),
  research:P('Research','page',()=>[B('eyebrow','02'),B('h1','Research'),B('para','[Methods and sources. Cite only real sources.]'),B('list','[Source]\n[Source]')]),
  evidence:P('Evidence','page',()=>[B('eyebrow','03'),B('h1','Evidence'),B('stats','[00%] | [measure]\n[00%] | [measure]'),B('chart','[Label] | 60\n[Label] | 25\n[Label] | 15',{cap:'Sample values — replace with sourced data.'})]),
  framework:P('Solution framework','page',()=>[B('eyebrow','04'),B('h1','The framework'),B('steps','Measure | Record fit preferences as well as numbers\nDraft | Cut a pattern from the measurements\nFit | Adjust on the body, at least twice\nFinish | Press, check, hand over')]),
  casestudy:P('Case study','page',()=>[B('eyebrow','05'),B('h1','In practice'),B('kv','Client | [First name]\nGarment | [Garment]\nResult | [Outcome]'),B('para','[Short narrative.]')]),
  recs:P('Recommendations','page',()=>[B('eyebrow','06'),B('h1','Recommendations'),B('list','[Recommendation]\n[Recommendation]',{ord:true})]),
  conclusion:P('Conclusion','page',()=>[B('eyebrow','07'),B('h1','Conclusion'),B('para','[Conclusion.]')]),
  references:P('References','page',()=>[B('eyebrow','References'),B('h1','References'),B('list','[Source]\n[Source]',{ord:true})]),
  about:P('About & CTA','divider',()=>[B('logo','',{sz:0.7}),B('h1','About Nonso Stitches'),B('para','A fashion and tailoring business making custom clothing for men and women.'),B('cta','Talk to us about fit.',{btn:'Book a fitting'})],{va:'middle',hideHeader:true}),
};
L.proposal = {
  cover:P('Cover','cover',()=>[B('logo','',{sz:0.8}),B('spacer','',{sz:6}),B('eyebrow','Proposal'),B('title','[Project name]'),B('subtitle','Prepared for [Client] · [Date]')],{va:'bottom',hideNum:true}),
  letter:P('Cover letter','page',()=>[B('para','Dear [Client name],'),B('para','Thank you for considering Nonso Stitches for [project]. This proposal sets out what we’ll make, how we’ll work with you, and what it costs.'),B('signature','[Name]\nNonso Stitches')]),
  client:P('Client & project','page',()=>[B('eyebrow','01'),B('h1','Client & project'),B('kv','Client | [Organisation / name]\nContact | [Name, phone]\nProject | [e.g. staff uniforms, wedding party]\nPeople | [number] (men and women)\nNeeded by | [Date]')]),
  objectives:P('Objectives','page',()=>[B('eyebrow','02'),B('h1','Objectives'),B('list','Every person fitted individually\nConsistent look across the group\nReady by [date]')]),
  scope:P('Scope','page',()=>[B('eyebrow','03'),B('h1','Scope of work'),B('columns','Included\n• Measurements for each person\n• Two fittings\n• Final press\n---\nNot included\n• Fabric (unless agreed)\n• Delivery outside [area]')]),
  deliverables:P('Deliverables','page',()=>[B('eyebrow','04'),B('h1','Deliverables'),B('table','Item | Quantity | Notes\n[Garment] | [00] | [Fabric, colour]\n[Garment] | [00] | [Fabric, colour]')]),
  timeline:P('Timeline & milestones','page',()=>[B('eyebrow','05'),B('h1','Timeline'),B('timeline','Week 1 | Measurements and fabric selection\nWeek 2–3 | Cutting and first fittings\nWeek 4 | Second fittings and adjustments\nWeek 5 | Final press and handover'),B('note','Milestone dates confirmed on acceptance.')]),
  team:P('Team','page',()=>[B('eyebrow','06'),B('h1','Who you’ll work with'),B('kv','[Name] | [Role]\n[Name] | [Role]')]),
  pricing:P('Pricing & investment','page',()=>[B('eyebrow','07'),B('h1','Investment'),B('table','Item | Qty | Unit | Total\n[Garment] | [00] | ₦[0,000] | ₦[0,000]\n[Garment] | [00] | ₦[0,000] | ₦[0,000]\nTotal |  |  | ₦[0,000]'),B('note','Prices to be confirmed from the current price list.')]),
  terms:P('Terms','page',()=>[B('eyebrow','08'),B('h1','Terms'),B('list','[Deposit terms]\n[Payment schedule]\n[Changes and remakes]\n[Collection / delivery]',{ord:true})]),
  testimonials:P('Testimonials','page',()=>[B('eyebrow','09'),B('h1','From our clients'),B('quote','[Client quote, used with permission]',{cap:'— [First name], [garment]'})]),
  next:P('Next steps','divider',()=>[B('eyebrow','Next steps'),B('title','Let’s get started'),B('steps','Confirm | Reply to accept this proposal\nDeposit | [Deposit terms]\nMeasure | We book everyone’s first fitting'),B('signature','Accepted by: ____________________   Date: __________')],{va:'middle',hideHeader:true}),
};
L.casestudy = {
  cover:P('Cover','cover',()=>[B('logo','',{sz:0.8}),B('spacer','',{sz:5}),B('eyebrow','Case study'),B('title','[Client]’s [garment]'),B('subtitle','[One-line result]')],{va:'bottom',hideNum:true}),
  context:P('Customer context','page',()=>[B('eyebrow','Context'),B('h1','The client'),B('kv','Client | [First name, with permission]\nOccasion | [Occasion]\nGarment | [Garment]\nTimeline | [weeks]'),B('image','',{ratio:'3:2',label:'Photo: client in finished garment'})]),
  challenge:P('Challenge','page',()=>[B('eyebrow','Challenge'),B('h1','What wasn’t working'),B('para','[Fit problem in the client’s words.]')]),
  solution:P('Solution','page',()=>[B('eyebrow','Solution'),B('h1','What we did'),B('para','[Approach.]')]),
  implementation:P('Implementation','page',()=>[B('eyebrow','Implementation'),B('h1','How it came together'),B('steps','Measure | [Detail]\nFirst fitting | [Detail]\nSecond fitting | [Detail]\nHandover | [Detail]')]),
  results:P('Results & metrics','page',()=>[B('eyebrow','Results'),B('h1','The result'),B('stats','[0] | fittings\n[0] | weeks\n[0] | remakes'),B('gallery','Before\nAfter')]),
  testimonial:P('Testimonial','page',()=>[B('quote','[Client quote, used with permission]',{cap:'— [First name]'})],{va:'middle'}),
  lessons:P('Lessons','page',()=>[B('eyebrow','Lessons'),B('h1','What we learned'),B('takeaways','[Lesson]\n[Lesson]',{label:'Lessons'})]),
  cta:P('Call to action','divider',()=>[B('title','Your fitting next?'),B('cta','Tell us the garment and the date.',{btn:'Book a fitting'})],{va:'middle',hideHeader:true}),
};
L.presentation = {
  cover:P('Cover','cover',()=>[B('logo','',{sz:0.5}),B('spacer','',{sz:2}),B('eyebrow','Nonso Stitches'),B('title','Made to fit you'),B('subtitle','[Presentation subtitle] · [Date]')],{va:'bottom'}),
  agenda:P('Agenda','slide',()=>[B('eyebrow','Agenda'),B('h1','Today'),B('list','Who we are\nHow we work\nWhat we make\nNext steps',{ord:true})]),
  divider:P('Section divider','divider',()=>[B('eyebrow','01'),B('title','How we work')],{va:'middle'}),
  problem:P('Problem','slide',()=>[B('eyebrow','The problem'),B('h1','Ready-made rarely fits.'),B('lead',lorem.alter)]),
  insight:P('Insight','slide',()=>[B('eyebrow','Insight'),B('quote','A good fit is something you stop noticing.')],{va:'middle'}),
  data:P('Data','slide',()=>[B('eyebrow','In numbers'),B('h1','[Headline about the numbers]'),B('stats','[00] | fittings\n[00] | alterations\n[00] | clients')]),
  chart:P('Chart','slide',()=>[B('eyebrow','Bookings'),B('h1','Bookings by service'),B('chart','Made to measure | 40\nAlterations | 32\nConstruction | 18\nPersonalised | 10',{cap:'Sample values — replace with confirmed data.'})]),
  comparison:P('Comparison','slide',()=>[B('eyebrow','Comparison'),B('h1','Alter or make new?'),B('columns','Alter\nKeeps the garment you love. Adjusts length and width.\n---\nMake new\nYour design, from your measurements.')]),
  framework:P('Framework','slide',()=>[B('eyebrow','Framework'),B('h1','Four steps to a fit'),B('steps','Measure | Numbers and preferences\nDraft | Pattern from your measurements\nFit | Adjusted on you\nFinish | Pressed and checked')]),
  process:P('Process','slide',()=>[B('eyebrow','Process'),B('h1','Your first fitting'),B('timeline','0 min | Conversation about the garment\n10 min | Measurements\n25 min | Fabric and style choices\n40 min | Next steps agreed')]),
  timeline:P('Timeline','slide',()=>[B('eyebrow','Timeline'),B('h1','From inquiry to handover'),B('timeline','Week 1 | Measure\nWeek 2 | First fitting\nWeek 3 | Second fitting\nWeek 4 | Handover')]),
  casestudy:P('Case study','slide',()=>[B('eyebrow','Case study'),B('h1','[Client]’s [garment]'),B('columns','Challenge\n[Detail]\n---\nResult\n[Detail]')]),
  quote:P('Quote','divider',()=>[B('quote','[Client quote, used with permission]',{cap:'— [First name]'})],{va:'middle'}),
  team:P('Team','slide',()=>[B('eyebrow','Team'),B('h1','Who you’ll meet'),B('kv','[Name] | [Role]\n[Name] | [Role]\n[Name] | [Role]')]),
  pricing:P('Pricing','slide',()=>[B('eyebrow','Pricing'),B('h1','Investment'),B('table','Service | From\nMade to measure | ₦[0,000]\nAlterations | ₦[0,000]\nPersonalised pieces | ₦[0,000]'),B('note','Prices to be confirmed.')]),
  summary:P('Summary','slide',()=>[B('eyebrow','Summary'),B('h1','In short'),B('takeaways','Made to your measurements\nMen’s and women’s clothing\nFittings until it fits',{label:'Takeaways'})]),
  closing:P('Closing','cover',()=>[B('logo','',{sz:0.5}),B('title','Thank you'),B('cta','Let’s talk about your next garment.',{btn:'Book a fitting'}),B('contact','[Phone / WhatsApp] · [Website]')],{va:'middle'}),
};
L.article = {
  hero:P('Hero & title','page',()=>[B('eyebrow','The fitting notes'),B('title','How a suit should fit you'),B('subtitle','Five checks to do in the mirror before your next fitting.'),B('byline','By [Author] · [Date] · 6 min read'),B('image','',{ratio:'16:9',label:'Hero photo: suit shoulder detail',cap:'[Caption]'})],{hideHeader:true}),
  body:P('Body','page',()=>[B('lead','Most suits are bought for the chest and altered for everything else.'),B('para',lorem.fit),B('h2','1. Shoulders'),B('para','The shoulder seam should end where your shoulder ends. Look for a dimple just below it — that means the jacket is too wide.'),B('h2','2. Chest'),B('para','Buttoned, the front should lie flat. An X of creases means it’s too tight.'),B('quote','A good fit is something you stop noticing.')]),
  media:P('Images & gallery','page',()=>[B('image','',{ratio:'3:2',label:'Photo: sleeve length detail',cap:'About 1–1.5 cm of shirt cuff should show.'}),B('gallery','Shoulder\nSleeve\nHem')]),
  data:P('Statistics & chart','page',()=>[B('stats','[00] | readers asked about sleeves\n[00] | about hems'),B('chart','Sleeves | 45\nHems | 30\nShoulders | 25',{cap:'Sample values — replace or remove.'}),B('callout','Shoulders are the hardest to alter. Buy for the shoulder; tailor the rest.',{label:'Tip'})]),
  lists:P('Lists & callouts','page',()=>[B('h2','Your five-point mirror check'),B('list','Shoulders\nChest\nSleeves\nJacket length\nTrouser break',{ord:true}),B('note','Bring the shoes you’ll wear to your fitting.')]),
  conclusion:P('Conclusion','page',()=>[B('h2','Conclusion'),B('para','If two or more of these checks fail, bring it in. Most can be fixed.'),B('divider',''),B('eyebrow','Related'),B('list','Measuring yourself at home\nWhat happens at a fitting'),B('kv','About the author | [Short bio — to be supplied]'),B('cta','Not sure about your suit? We’ll check it with you.',{btn:'Book a fitting'})]),
};
L.newsletter = {
  header:P('Header','email',()=>[B('logo','',{sz:0.5,al:'center'}),B('eyebrow','The fitting notes · Issue [00]',{al:'center'})],{bg:'ink'}),
  intro:P('Introduction','email',()=>[B('h2','Good morning,'),B('para','Here’s what’s been on the cutting table this month, and a few dates for your diary.')]),
  featured:P('Featured story','email',()=>[B('image','',{ratio:'3:2',label:'Photo: featured garment'}),B('eyebrow','Featured'),B('h2','A wedding agbada, start to finish'),B('para','[Short summary of the story.]'),B('cta','',{btn:'Read the story'})]),
  articles:P('Article blocks','email',()=>[B('eyebrow','Also this month'),B('h3','Measuring at home'),B('para','Three rules for accurate measurements.'),B('divider',''),B('h3','What happens at a fitting'),B('para','About 40 minutes, and what to bring.')]),
  announcement:P('Announcement','email',()=>[B('callout','Festive bookings are open. Book before [date] for fittings in time.',{label:'Studio news'})],{bg:'cotton'}),
  event:P('Event','email',()=>[B('eyebrow','Event'),B('h2','Open fitting day'),B('kv','When | [Date, time]\nWhere | [Address]'),B('cta','',{btn:'Reserve a slot'})]),
  quote:P('Quote','email',()=>[B('quote','[Client quote, used with permission]',{cap:'— [First name]',al:'center'})]),
  image:P('Image','email',()=>[B('image','',{ratio:'16:9',label:'Photo: studio detail',cap:'[Caption]'})]),
  stats:P('Statistics','email',()=>[B('stats','[00] | fittings this month\n[00] | alterations')]),
  cta:P('Call to action','email',()=>[B('h2','Ready for a better fit?',{al:'center'}),B('cta','Tell us the garment and the date.',{btn:'Book a fitting',al:'center'})],{bg:'ink'}),
  footer:P('Footer','email',()=>[B('note','Nonso Stitches · [Address]\nYou’re receiving this because you signed up at [where]. [Unsubscribe]',{al:'center'})]),
};
L.resume = {
  page1:P('Header, profile & experience','page',()=>[B('title','[Full name]',{sz:0.7}),B('byline','[Role, e.g. Tailor] · [City] · [Phone] · [Email] · [Portfolio]'),B('divider',''),B('h3','Profile'),B('para','[Two-sentence profile.]'),B('h3','Summary'),B('list','[Strength]\n[Strength]\n[Strength]'),B('h3','Experience'),B('kv','[Role], [Employer] | [Start] – [End]\n[Role], [Employer] | [Start] – [End]'),B('para','[Responsibilities and achievements.]')],{hideHeader:true}),
  page2:P('Education & skills','page',()=>[B('h3','Education'),B('kv','[Qualification], [Institution] | [Year]'),B('h3','Skills'),B('columns','Construction\n[Skill]\n[Skill]\n---\nTools\n[Skill]\n[Skill]'),B('h3','Certifications'),B('list','[Certification, issuer, year]'),B('h3','Projects'),B('kv','[Project] | [Year]')],{hideHeader:true}),
  page3:P('Awards, publications & references','page',()=>[B('h3','Awards'),B('list','[Award, year]'),B('h3','Publications'),B('list','[Title, publication, year]'),B('h3','References'),B('kv','[Name], [Role] | [Contact]'),B('h3','Contact'),B('contact','[Phone]\n[Email]\n[Portfolio]')],{hideHeader:true}),
};
L.email = {
  header:L.newsletter.header, footer:L.newsletter.footer,
  body:P('Body','email',()=>[B('h2','Heading'),B('para','Body text.')]),
  cta:L.newsletter.cta, image:L.newsletter.image, kv:P('Details','email',()=>[B('kv','When | [Date]\nWhere | [Address]')]),
};

/* ---------- document templates ---------- */
export const templates: DocTemplate[] = []; const DT = templates;
const doc = (id: string, type: string, name: string, format: string, keys: string[], extra?: Partial<DocTemplate>) => DT.push(Object.assign({id, cat:'documents', type, name, format, keys}, extra||{}));
export const typeLabels: Record<string, string> = {ebook:'Book / ebook', report:'Report', whitepaper:'Whitepaper', proposal:'Proposal', casestudy:'Case study', presentation:'Presentation', article:'Article / blog post', newsletter:'Newsletter', resume:'Resume / CV', email:'Email'};
export const typeFormats: Record<string, string[]> = {ebook:['ebook','a5','a4','letter'], report:['a4','letter'], whitepaper:['a4','letter'], proposal:['a4','letter'], casestudy:['a4','letter'], presentation:['slide','slide43'], article:['a4','letter'], newsletter:['email'], resume:['a4','letter'], email:['email']};
doc('doc-ebook','ebook','The Fit Guide (ebook)','ebook',['cover','halftitle','title','copyright','dedication','epigraph','toc','foreword','preface','intro','part','chapter','section','quotes','figure','lists','casestudy','exercise','reflection','takeaways','summary','part','chapter','section','quotes','takeaways','conclusion','appendix','references','bibliography','acknowledgements','author','cta','back'],{overrides:{21:{blocks:[['eyebrow','Part two'],['title','Fit'],['subtitle','Adjusting on the body']]},22:{blocks:[['eyebrow','Chapter 2'],['h1','Your fittings'],['lead','Fittings are where a garment becomes yours.']]},23:{blocks:[['h2','The first fitting'],['h3','What we check']]}}});
doc('doc-report','report','Studio report','a4',['cover','toc','exec','intro','research','findings','data','analysis','recs','conclusion','appendix','references','back']);
doc('doc-whitepaper','whitepaper','Whitepaper','a4',['cover','abstract','problem','research','evidence','framework','casestudy','recs','conclusion','references','about']);
doc('doc-proposal','proposal','Client proposal','a4',['cover','letter','client','objectives','scope','deliverables','timeline','team','pricing','terms','testimonials','next']);
doc('doc-casestudy','casestudy','Case study','a4',['cover','context','challenge','solution','implementation','results','testimonial','lessons','cta']);
doc('doc-presentation','presentation','Service presentation','slide',['cover','agenda','divider','problem','insight','data','chart','comparison','framework','process','timeline','casestudy','quote','team','pricing','summary','closing']);
doc('doc-article','article','Article / blog post','a4',['hero','body','media','data','lists','conclusion']);
doc('doc-newsletter','newsletter','Newsletter','email',['header','intro','featured','articles','announcement','event','quote','image','stats','cta','footer']);
doc('doc-resume','resume','Resume / CV','a4',['page1','page2','page3']);
const em = (id: string, name: string, pages: () => DPage[]) => DT.push({id, cat:'email', type:'email', name, format:'email', custom:pages});
em('em-welcome','Welcome email',()=>[L.email.header(), P('Body','email',()=>[B('h2','Welcome to Nonso Stitches'),B('para','Thank you for getting in touch. Here’s what happens next: we’ll message you on WhatsApp to arrange your first fitting.'),B('steps','Tell us the garment | And the date you need it\nFirst fitting | Measurements and fabric\nSecond fitting | We adjust on you')])(), L.email.cta(), L.email.footer()]);
em('em-confirmation','Fitting confirmation',()=>[L.email.header(), P('Body','email',()=>[B('h2','Your fitting is booked'),B('para','Thank you, [First name]. We’ll see you at the studio.'),B('kv','Date | [Day, date]\nTime | [Time]\nDuration | [About 40 minutes — confirm]\nWhere | [Address]'),B('note','Please bring the shoes you’ll wear with the garment.')])(), P('CTA','email',()=>[B('cta','Need to change the time?',{btn:'Chat on WhatsApp'})])(), L.email.footer()]);
em('em-promotion','Seasonal booking',()=>[L.email.header(), P('Hero','email',()=>[B('image','',{ratio:'3:2',label:'Photo: occasion outfits, men and women'}),B('h2','Festive fittings are open'),B('para','Book before [date] and we’ll plan your fittings in time.'),B('cta','',{btn:'Book a fitting'})])(), L.email.footer()]);
em('em-ready','Order ready for collection',()=>[L.email.header(), P('Body','email',()=>[B('h2','Your [garment] is ready'),B('para','Good news, [First name]. Your [garment] has had its final press and is ready to collect.'),B('kv','Collect from | [Address]\nOpening hours | [Hours]')])(), L.email.footer()]);
em('em-review','Review request',()=>[L.email.header(), P('Body','email',()=>[B('h2','How does it fit?'),B('para','It’s been a few weeks since you collected your [garment]. If anything needs adjusting, tell us. If you’re happy, a short review helps others find us.'),B('cta','',{btn:'Leave a review'})])(), L.email.footer()]);
em('em-alteration','Alteration received',()=>[L.email.header(), P('Body','email',()=>[B('h2','We’ve got your alteration'),B('kv','Garment | [Garment]\nWork | [e.g. Hem shortened 3 cm]\nReady by | [Date]'),B('para','We’ll message you when it’s ready.')])(), L.email.footer()]);

export const create = (tpl: DocTemplate, opt: { format?: string } = {}): DocDoc => { const lib = L[tpl.type] || L.email; let pages: DPage[] = tpl.custom ? tpl.custom() : (tpl.keys||[]).map((k,i)=>{ const p = lib[k](); const ov = tpl.overrides && tpl.overrides[i]; if (ov) { const used = new Set<Block>(); ov.blocks.forEach(([t,text])=>{ const b = p.blocks.find(x=>x.t===t && !used.has(x)); if (b) { b.text = text; used.add(b); } }); } return p; });
  pages = clone(pages);
  return {kind:'doc', tpl:tpl.id, type:tpl.type, name:tpl.name, format:opt.format||tpl.format, title: (pages[0].blocks.find(b=>b.t==='title')||{}).text || tpl.name, author:'Nonso Stitches',
    settings:{numbers:true, numStart:1, numPos:'center', header:true, theme:'paper'}, pages, updated:Date.now()}; };
export const newPage = (type: string, key: string): DPage => { const lib = L[type] || L.email; const p = clone((lib[key]||Object.values(lib)[0])()); p.id = uid(); p.blocks.forEach(b=>b.id='b'+uid()); return p; };
export const blankPage = (fmt: string): DPage => ({id:uid(), name:'Blank page', layout: fmt==='email'?'email':(fmt||'').startsWith('slide')?'slide':'page', bg:'paper', blocks:[B('h2','New page'),B('para','Start writing here.')]});
export interface Heading { text: string; page: number; lvl: number }
export const headings = (doc: { pages: DPage[] }): Heading[] => { const out: Heading[]=[]; doc.pages.forEach((p,i)=>{ p.blocks.forEach(b=>{ if ((b.t==='h1') || (b.t==='title' && (p.layout==='divider'))) out.push({text:b.text, page:i, lvl: b.t==='title'?0:1}); }); }); return out; };
