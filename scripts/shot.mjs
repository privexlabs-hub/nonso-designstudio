// Screenshot one route scrolled to a selector: node scripts/shot.mjs <url> <selector> <width> <out.png> [height]
import { chromium } from '@playwright/test';
const [url, sel, w, out, h] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +(h || 900) } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
await p.goto(url, { waitUntil: 'networkidle' });
if (sel && sel !== '-') { await p.locator(sel).first().scrollIntoViewIfNeeded(); await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'start' }), sel); }
await p.waitForTimeout(1200); await p.screenshot({ path: out });
if (errs.length) console.log('ERRORS', errs.join('\n'));
await b.close();
