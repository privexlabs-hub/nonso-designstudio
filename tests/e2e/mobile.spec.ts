import { test, expect, type Page } from '@playwright/test';
import { freshStorage } from './helpers';

const saved = (page: Page, id: string) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), 'ns:doc:' + id);

test.beforeEach(async ({ page }) => { await freshStorage(page); });

test('editor panels switch with the bottom tabs and the canvas works by touch', async ({ page }) => {
  await page.goto('/editor/#t=sq-announcement');
  const tabs = page.getByRole('navigation', { name: 'Editor panels' });
  await expect(tabs).toBeVisible();
  await expect(page.getByRole('main', { name: 'Canvas' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeHidden();
  await tabs.getByRole('button', { name: 'Pages' }).click();
  await expect(page.getByRole('complementary', { name: 'Pages' })).toBeVisible();
  await tabs.getByRole('button', { name: 'Canvas' }).click();
  const cta = page.locator('[data-pw="0"] [data-el="cta"]'); const b = (await cta.boundingBox())!;
  const before = (await saved(page, 'sq-announcement')).pages[0].els.find((e: { id: string }) => e.id === 'cta');
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  const fire = (type: string, cx: number, cy: number, target: 'el' | 'win') => target === 'el'
    ? cta.dispatchEvent(type, { pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: cx, clientY: cy, bubbles: true, button: 0 })
    : page.evaluate(([t, a, c]) => window.dispatchEvent(new PointerEvent(t as string, { pointerType: 'touch', pointerId: 7, clientX: a as number, clientY: c as number, bubbles: true })), [type, cx, cy]);
  await fire('pointerdown', x, y, 'el');
  for (let i = 1; i <= 5; i++) await fire('pointermove', x + i * 8, y + i * 4, 'win');
  await fire('pointerup', x + 40, y + 20, 'win');
  await expect(page.getByText('Saved in this browser')).toBeHidden({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(600);
  const after = (await saved(page, 'sq-announcement')).pages[0].els.find((e: { id: string }) => e.id === 'cta');
  expect(after.x).toBeGreaterThan(before.x + 20);
  await tabs.getByRole('button', { name: /Edit/ }).click();
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible();
  await expect(page.getByLabel('Text', { exact: true })).toHaveValue('Book a fitting');
});

test('template bulk bar docks to the bottom on phones', async ({ page }) => {
  await page.goto('/templates/');
  const bar = page.getByRole('region', { name: 'Bulk export' });
  const box = (await bar.boundingBox())!; const vh = page.viewportSize()!.height;
  expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(vh - 2);
});
