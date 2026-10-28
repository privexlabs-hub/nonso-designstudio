/* Brand voice & knowledge reference. status: verified | proposed | confirm. Port of lib/ns-voice.js. */
import { version } from './core';

export type VoiceStatus = 'verified' | 'proposed' | 'confirm';
export interface VoiceSection { id: string; title: string; status: VoiceStatus; body: string }

export const voice: VoiceSection[] = [
{id:'about', title:'Brand description & positioning', status:'verified', body:
`Name: Nonso Stitches
What we are: a fashion and tailoring business making custom clothing for men and women.
Services: made-to-measure outfits, garment construction, alterations, and personalised pieces.
Logo tagline: "Classic Fits · Modern Styles"
Logo service line: "Men | Women | Custom Wear"
Core promise: Clothing thoughtfully made to fit you, your style, and your life.
Central idea: Every garment deserves thoughtful craftsmanship; every customer deserves a fit that feels personal.
Positioning (proposed): a contemporary bespoke studio — precise, calm and personal — not a gilded luxury label.`},
{id:'mission', title:'Mission, vision & purpose', status:'proposed', body:
`Purpose (from core promise): make clothing that fits the person — their body, their style and the way they live.
Mission (proposed wording, confirm with owner): To make every client's clothing fit well and feel personal, from the first measurement to the final press.
Vision: NOT YET ESTABLISHED. Do not write a vision statement on the brand's behalf until the owner supplies one.`},
{id:'audience', title:'Target audience & segments', status:'proposed', body:
`Primary: men and women who want clothing made or adjusted to fit them (the logo gives men's and women's clothing equal weight — always address both).
Segments (proposed, confirm with owner):
- Occasion clients — weddings, aso-ebi, ceremonies, celebrations; need a reliable fit by a fixed date.
- Everyday and workwear clients — suits, senator, kaftan, dresses, office wear.
- Alteration clients — ready-made or existing garments that need hemming, taking in or letting out.
- Personalised-piece clients — a one-off design, a remake, a family set.
Needs and motivations: a garment that fits properly; clear timelines; being listened to about style; not having to explain twice; confidence on the day.
Problems we solve: off-the-rack clothes that don't fit; unreliable tailors and missed dates; unclear pricing; fit issues they can't describe.
Desired outcomes: comfort, a fit that looks intentional, being ready on time, a garment they keep wearing.`},
{id:'value', title:'Value proposition & differentiators', status:'proposed', body:
`Value proposition: Clothing made to your measurements and your style, with fittings that make sure it actually fits.
Differentiators we may claim (supported by the brief):
- Made to measure, not off the rack.
- Men's and women's clothing, both given equal care.
- Both making and alterations under one roof.
- Personal: you talk to the people making your clothes.
Differentiators we may NOT claim until confirmed: years of experience, number of clients, awards, fabric sourcing, specific turnaround guarantees, delivery coverage, prices.`},
{id:'services', title:'Services & benefits', status:'verified', body:
`1. Made-to-measure outfits — cut from your measurements. Benefit: fits your body, not a size chart.
2. Garment construction — we make the piece from fabric (yours or sourced). Benefit: the design you want, built properly.
3. Alterations — hemming, taking in, letting out, adjusting. Benefit: clothes you already own fit again.
4. Personalised pieces — one-off and custom details. Benefit: something that is yours alone.
Service names are verified; prices, durations and what's included in each are NOT — leave as [placeholders].`},
{id:'personality', title:'Brand personality & communication principles', status:'proposed', body:
`Personality: warm, confident, clear, personal, detail-oriented.
Principles:
1. Specifics over superlatives — name the garment, the occasion and the fit issue.
2. Talk about fit, comfort and style — not luxury.
3. Reassure without overpromising — say what happens next and when.
4. Both audiences, always — men's and women's examples together.
5. Measured, not decorated — short sentences, plain punctuation, no emoji.`},
{id:'tone', title:'Tone of voice by context', status:'proposed', body:
`Social posts: warm and specific; one garment, one story. "Two fittings, one navy kaftan, a very happy groom's brother."
Service pages: clear and practical; answer what, how long, what to bring.
Booking and confirmations: reassuring and exact — date, time, duration, channel.
Customer care / WhatsApp: personal, polite, first name, one question at a time. "Good morning Adaeze, this is Nonso Stitches. Does Saturday at 10:30 work for your first fitting? It takes about 40 minutes."
Errors and problems: calm, own it, say what to do next.
Campaigns / editorial: more expressive — short serif statements, italic quotes, full-bleed images.`},
{id:'style', title:'Writing style, vocabulary & terminology', status:'proposed', body:
`Person: "we" (the studio) speaking to "you". Sign-offs may be personal (owner name to be confirmed).
Casing: sentence case for headlines, body, labels and form fields. UPPERCASE only for eyebrows and buttons (handled by design, write them in sentence case).
Numbers: Naira sign with thousands separators (₦85,000); units as in / cm; ranges with an en dash (3–5 days).
Preferred words: fit, fitting, measurements, made to measure, made for you, alteration, hem, take in, let out, fabric, finish, occasion, comfortable, ready.
Garment names to use naturally: suit, trousers, shirt, dress, kaftan, agbada, senator, iro and buba, aso-ebi, wax print, workwear.
Buttons: Book a fitting · Start an inquiry · Chat on WhatsApp · Request an alteration · Send inquiry.`},
{id:'avoid', title:'Words, claims & approaches to avoid', status:'proposed', body:
`Avoid words: couture, elite, unparalleled, discerning, exquisite, luxury (as a claim), world-class, best in town, perfect fit guaranteed, cheap.
Avoid: emoji in brand copy; exclamation-mark stacks; all-caps sentences; hashtags walls (max 3–5 relevant tags).
Avoid claims: guarantees, years in business, customer counts, awards, "same-day" or any turnaround not confirmed, price comparisons with competitors.
Avoid imagery language implying off-the-rack sales (racks, "shop now", "in stock").
Avoid addressing only men or only women in general brand messages.`},
{id:'pillars', title:'Messaging pillars & key messages', status:'proposed', body:
`1. Fit — "Made to fit you." Measurements, fittings, adjustments.
2. Craft — "Every garment deserves thoughtful craftsmanship." Seams, hems, finishing, process.
3. Personal — "Your style, thoughtfully tailored." Listening, choices, one-off details.
4. Reliability — "From your measurements to the finished piece." Clear steps, clear dates.
Key messages: A better fit starts with you. · Classic fits, modern styles. · Men, women, custom wear.`},
{id:'content', title:'Content pillars & editorial principles', status:'proposed', body:
`Content mix (mirrors photography mix): 40% finished garments on real people · 40% process and detail (measuring, chalk, pinning, seams, hems) · 20% people and fittings.
Pillars:
- The finished piece — garment, occasion, fit notes.
- At the cutting table — process, technique, before/after alterations.
- Fit advice — how a suit should sit, measuring at home, fabric care.
- Clients — stories and testimonials (with written permission).
- Studio news — opening hours, booking windows, seasonal deadlines.
Principles: one idea per post; men's and women's content alternate; never invent a client story; always get consent before naming or showing a client.`},
{id:'cta', title:'Calls to action & conventions', status:'proposed', body:
`Primary CTA: Book a fitting.
Secondary: Chat on WhatsApp · Start an inquiry · Request an alteration · See the work.
Form: verb first, 2–4 words, sentence case in copy (rendered uppercase on buttons).
Always pair a CTA with what happens next: "We'll message you on WhatsApp within one working day." (timing to be confirmed)`},
{id:'channels', title:'Social, article, newsletter & marketing guidelines', status:'proposed', body:
`Instagram / Facebook: caption 1–3 short sentences, specific garment + occasion; first line works alone; up to 5 relevant hashtags at the end; no emoji.
Stories / reels: one line of text per frame, max ~8 words; logo tile in a calm corner.
LinkedIn / articles: practical fit and fabric advice; 600–1,200 words; H2 every 150–250 words; end with one CTA.
X: one specific observation or tip; link to the article or booking.
Newsletter: subject line ≤ 45 characters, sentence case; one featured story, up to three short items, one CTA; sign off as the studio.
Ads: headline ≤ 6 words, body ≤ 20 words, one CTA; no prices or deadlines unless confirmed.`},
{id:'facts', title:'Brand facts & constraints', status:'confirm', body:
`Verified: name, logo, tagline, service line, service categories, men's and women's clothing.
NEEDS CONFIRMATION before publishing (use [placeholders] until supplied):
- Location / city and address (the design-system examples mention Enugu — not confirmed).
- Founder / owner name (examples sign off "Chinonso" — not confirmed).
- Phone, WhatsApp number, email, website, social handles.
- Opening hours and booking process.
- Prices or price ranges.
- Turnaround times (examples use "3–5 days" for alterations and "40 minutes" per fitting — not confirmed).
- Delivery, shipping or remote-measurement options.
- Years in business, client numbers, notable clients, awards.
Brand constraints: logo is a raster badge only (no vector, mono, reversed or horizontal versions exist). Gold is never text on light grounds.`},
{id:'examples', title:'Correct & incorrect examples', status:'proposed', body:
`Do: "Trousers too long? Waist too loose? Bring them in — we'll pin them while you wait."
Don't: "Unparalleled luxury tailoring for the discerning elite."
Do: "Thank you, Adaeze. We'll message you on WhatsApp to arrange your fitting."
Don't: "Your order has been received!!! 🎉"
Do: "A navy senator, cut to his measurements, ready for Saturday."
Don't: "The best tailor in town. Perfect fit guaranteed."
Do: "Enter a phone or WhatsApp number we can reach, e.g. 0803 123 4567."
Don't: "Invalid input."`},
{id:'ai', title:'AI instructions, generation guidelines & quality checks', status:'proposed', body:
`You are writing for Nonso Stitches, a tailoring business making custom clothing for men and women. Follow this reference exactly.
1. Use the tone, vocabulary and CTAs above. Write in British/Nigerian English spelling (colour, personalised).
2. Never invent facts: no prices, dates, locations, names, client stories, statistics, turnaround times or guarantees unless provided in the prompt. Use [square-bracket placeholders] instead.
3. Address men and women equally across a content set.
4. No emoji. No words from the avoid list.
5. Keep headlines in sentence case, ≤ 8 words.
Quality check before returning:
- [ ] Every factual claim is from the verified list or the prompt.
- [ ] Placeholders remain where facts are missing.
- [ ] One clear CTA from the approved list.
- [ ] Specific garment, occasion or fit issue is named.
- [ ] No avoided words, no emoji, no superlatives.`},
{id:'accuracy', title:'Rules for factual accuracy', status:'proposed', body:
`- Treat "NEEDS CONFIRMATION" items as unknown, even if an example uses them.
- Testimonials and client stories must be real, quoted with permission, and attributed by first name only unless the client agrees otherwise.
- Before/after photos must show the actual garment; no retouching of fit.
- Prices: only from the current price list; always in ₦ with separators.
- If a request needs a fact that isn't here, return a placeholder and a note listing what's missing.`},
];
export const voiceStatus: Record<VoiceStatus, string> = { verified: 'Verified brand fact', proposed: 'Proposed — derived from brief/design system', confirm: 'Needs confirmation' };
export const voiceText = (sections?: VoiceSection[]) => {
  const head = `# Nonso Stitches — Brand voice & knowledge\n\nVersion ${version} · Labels: [Verified] = confirmed brand fact; [Proposed] = derived guidance; [Needs confirmation] = do not state as fact.\n`;
  return head + (sections || voice).map(s => `\n## ${s.title} [${voiceStatus[s.status].split(' —')[0]}]\n\n${s.body}\n`).join('');
};
