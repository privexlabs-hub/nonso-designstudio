import { expect, type Page, type Download } from '@playwright/test';
import fs from 'node:fs';
import JSZip from 'jszip';

/** Collect console errors and uncaught exceptions for a page. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|Download the React DevTools/.test(m.text())) errors.push(m.text()); });
  return errors;
}
export async function downloadOf(page: Page, action: () => Promise<unknown>): Promise<{ d: Download; buf: Buffer }> {
  const [d] = await Promise.all([page.waitForEvent('download', { timeout: 60_000 }), action()]);
  const p = await d.path(); const buf = fs.readFileSync(p!);
  expect(buf.length).toBeGreaterThan(0);
  return { d, buf };
}
export const zipEntries = async (buf: Buffer) => Object.keys((await JSZip.loadAsync(buf)).files).filter(n => !n.endsWith('/')).sort();
export const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
/** Clear studio storage so each test starts from the original templates. */
export async function freshStorage(page: Page) { await page.goto('/'); await page.evaluate(() => localStorage.clear()); }
