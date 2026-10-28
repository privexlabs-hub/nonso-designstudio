// Loads each route, reports console errors / page errors, horizontal overflow at several widths, and saves screenshots.
import { chromium } from '@playwright/test';
const base = process.argv[2], out = process.argv[3], routes = process.argv[4].split(',');
const widths = (process.argv[5] || '1280,375').split(',').map(Number);
const b = await chromium.launch();
for (const w of widths) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
  for (const r of routes) {
    const p = await ctx.newPage(); const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message.slice(0, 200)));
    await p.goto(base + r, { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    const ov = await p.evaluate(() => { const d = document.documentElement; const wide = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > d.clientWidth + 1 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 5).map(e => e.tagName + '.' + (e.className && e.className.baseVal === undefined ? e.className : '').toString().slice(0, 40)); return { sw: d.scrollWidth, cw: d.clientWidth, wide }; });
    await p.screenshot({ path: `${out}/${r.replace(/[^a-z]/gi, '_') || 'home'}-${w}.png`, fullPage: false });
    console.log(w, r, 'overflow:', ov.sw > ov.cw ? `${ov.sw}>${ov.cw} ${ov.wide.join(' ')}` : 'none', errs.length ? 'ERRORS: ' + errs.join(' | ') : '');
    await p.close();
  }
  await ctx.close();
}
await b.close();
