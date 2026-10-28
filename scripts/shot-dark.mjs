// Dark-mode screenshot: node scripts/shot-dark.mjs <url> <selector|-> <width> <out.png> [height]
import { chromium } from '@playwright/test';
const [url, sel, w, out, h] = process.argv.slice(2);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: +w, height: +(h || 900) }, colorScheme: 'dark' });
const p = await ctx.newPage(); await p.addInitScript(() => localStorage.setItem('ns-theme', 'dark'));
await p.goto(url, { waitUntil: 'networkidle' });
if (sel !== '-') await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'start' }), sel);
await p.waitForTimeout(1000); await p.screenshot({ path: out }); await b.close();
