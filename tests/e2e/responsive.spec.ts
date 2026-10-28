import { test, expect } from '@playwright/test';
import { trackErrors } from './helpers';

const routes = ['/', '/design-system/', '/playbook/', '/voice/', '/assets/', '/templates/', '/editor/#t=sq-announcement', '/editor/#t=doc-ebook', '/editor/#t=em-welcome'];
const widths = [320, 360, 375, 390, 414, 768, 834, 1024, 1280, 1440, 1920];

for (const w of widths) {
  test(`no horizontal overflow or errors at ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    const errors = trackErrors(page);
    for (const r of routes) {
      await page.goto(r); await page.waitForLoadState('networkidle');
      const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(o.sw, `${r} overflows at ${w}px`).toBeLessThanOrEqual(o.cw);
    }
    expect(errors).toEqual([]);
  });
}

test('mobile header nav scrolls and every link is reachable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  for (const name of ['Studio', 'Design system', 'Brand playbook', 'Voice & knowledge', 'Assets', 'Templates']) {
    const link = nav.getByRole('link', { name }); await link.scrollIntoViewIfNeeded(); await expect(link).toBeVisible();
  }
});
