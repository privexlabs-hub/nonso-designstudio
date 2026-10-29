/* Phones & tablets: runs on Pixel 7, iPhone SE, iPhone 15 Pro Max, Galaxy S24, phone landscape and iPad Mini profiles. */
import { test, expect, type Page } from '@playwright/test';
import { downloadOf, freshStorage, zipEntries } from './helpers';

const saved = (page: Page, id: string) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), 'ns:doc:' + id);
const savedEl = async (page: Page, id: string, el: string) => (await saved(page, id)).pages[0].els.find((e: { id: string }) => e.id === el);
const tabs = (page: Page) => page.getByRole('navigation', { name: 'Editor panels' });
const openPanel = (page: Page, name: 'Pages' | 'Canvas' | 'Edit') => tabs(page).getByRole('button', { name: new RegExp('^' + name) }).click();
const settle = (page: Page) => page.waitForTimeout(700); /* edits autosave after 400 ms */
const isIPhone = (page: Page) => page.evaluate(() => /iPhone|iPad/.test(navigator.userAgent));

test.beforeEach(async ({ page }) => { await freshStorage(page); });

test('editor panels switch with the bottom tabs and the canvas works by touch', async ({ page }) => {
  await page.goto('/editor/#t=sq-announcement');
  await expect(tabs(page)).toBeVisible();
  await expect(page.getByRole('main', { name: 'Canvas' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeHidden();
  await openPanel(page, 'Pages');
  await expect(page.getByRole('complementary', { name: 'Pages' })).toBeVisible();
  await openPanel(page, 'Canvas');
  const cta = page.locator('[data-pw="0"] [data-el="cta"]');
  await expect(cta).toBeVisible(); await page.waitForTimeout(300); /* switching to Canvas repaints it */
  const b = (await cta.boundingBox())!;
  const before = await savedEl(page, 'sq-announcement', 'cta');
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  const fire = (type: string, cx: number, cy: number, target: 'el' | 'win') => target === 'el'
    ? cta.dispatchEvent(type, { pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: cx, clientY: cy, bubbles: true, button: 0 })
    : page.evaluate(([t, a, c]) => window.dispatchEvent(new PointerEvent(t as string, { pointerType: 'touch', pointerId: 7, clientX: a as number, clientY: c as number, bubbles: true })), [type, cx, cy]);
  await fire('pointerdown', x, y, 'el');
  for (let i = 1; i <= 5; i++) await fire('pointermove', x + i * 8, y + i * 4, 'win');
  await fire('pointerup', x + 40, y + 20, 'win');
  await settle(page);
  expect((await savedEl(page, 'sq-announcement', 'cta')).x).toBeGreaterThan(before.x + 20);
  await openPanel(page, 'Edit');
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible();
  await expect(page.getByLabel('Text', { exact: true })).toHaveValue('Book a fitting');
});

test('graphic: tap, "Edit selected", change text, size, colour and alignment; live preview follows', async ({ page }) => {
  await page.goto('/editor/#t=sq-announcement');
  await page.locator('[data-pw="0"] [data-el="title"]').tap();
  await page.getByRole('button', { name: 'Edit selected' }).click();
  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await expect(inspector).toBeVisible();
  const preview = inspector.getByRole('button', { name: /Live preview of page 1/ });
  await expect(preview).toBeVisible();
  await page.getByLabel('Text', { exact: true }).fill('Tailored on my phone');
  await page.getByLabel('Size (px)').fill('70');
  await inspector.getByRole('button', { name: 'Centre' }).click();
  await inspector.getByRole('button', { name: '#E0B04F' }).first().click();
  await expect(preview.locator('[data-text]', { hasText: 'Tailored on my phone' })).toBeVisible();
  await settle(page);
  const t = await savedEl(page, 'sq-announcement', 'title');
  expect([t.text, t.fs, t.al, t.c]).toEqual(['Tailored on my phone', 70, 'center', '#E0B04F']);
  await inspector.getByRole('tab', { name: 'Document' }).click();
  await page.getByLabel('Size').selectOption({ index: 0 });
  await inspector.getByRole('button', { name: 'Chalk' }).click();
  await settle(page);
  expect((await saved(page, 'sq-announcement')).palette).toBe('chalk');
  expect((await savedEl(page, 'sq-announcement', 'title')).text).toBe('Tailored on my phone');
});

test('pages: add, duplicate, reorder and delete from the Pages panel', async ({ page }) => {
  await page.goto('/editor/#t=car-how-it-works');
  await openPanel(page, 'Pages');
  const rows = page.getByRole('list', { name: /Pages/ }).locator('> li');
  await expect(rows).toHaveCount(5);
  await page.getByRole('button', { name: 'Insert after' }).click();
  await openPanel(page, 'Pages');
  await expect(rows).toHaveCount(6);
  await rows.nth(0).getByRole('button', { name: 'Duplicate page' }).click();
  await openPanel(page, 'Pages');
  await expect(rows).toHaveCount(7);
  await rows.nth(2).getByRole('button', { name: 'Move page up' }).click();
  await openPanel(page, 'Pages');
  await rows.nth(6).getByRole('button', { name: 'Delete page' }).click();
  await openPanel(page, 'Pages');
  await expect(rows).toHaveCount(6);
  await settle(page);
  expect((await saved(page, 'car-how-it-works')).pages).toHaveLength(6);
});

test('image upload from the phone places a photo', async ({ page }) => {
  await page.goto('/editor/#t=sq-launch');
  await page.locator('[data-pw="0"] [data-el="image"]').tap();
  await page.getByRole('button', { name: 'Edit selected' }).click();
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 1200; c.height = 900; const x = c.getContext('2d')!; x.fillStyle = '#1F2E4A'; x.fillRect(0, 0, 1200, 900); return c.toDataURL('image/png'); });
  await page.locator('input[type=file]').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(png.split(',')[1], 'base64') });
  await expect(page.getByRole('button', { name: 'Replace image' })).toBeVisible();
  await settle(page);
  expect((await savedEl(page, 'sq-launch', 'image')).src).toMatch(/^data:image\//);
});

test('document: tap a block, edit it, add blocks, page settings and overflow on a phone', async ({ page }) => {
  await page.goto('/editor/#t=doc-article');
  await page.locator('[data-pw="0"] [data-bt="title"]').first().tap();
  await page.getByRole('button', { name: 'Edit selected' }).click();
  await page.getByLabel('Content').fill('Edited on a phone.');
  await page.getByLabel('Block type to add').selectOption('para');
  for (let i = 0; i < 40; i++) await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('tab', { name: 'Page' }).click();
  await page.getByLabel('Running header (right side)').fill('Phone edit');
  await expect(page.getByText('Content on this page is clipped at the bottom margin.')).toBeVisible();
  await page.getByRole('button', { name: 'Move overflow to a new page' }).click();
  await settle(page);
  const d = await saved(page, 'doc-article');
  expect(d.pages[0].blocks.some((b: { text: string }) => b.text === 'Edited on a phone.')).toBe(true);
  expect(d.pages[0].section).toBe('Phone edit');
  expect(d.pages[1].name).toMatch(/\(cont\.\)$/);
});

test('downloads work on the phone: PNG, multi-page ZIP, PDF and Word', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/editor/#t=car-lookbook');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const exportBtn = page.locator('button', { hasText: /^Export / }).last();
  const fmt = page.getByLabel('Format');
  await fmt.selectOption('png');
  await page.getByRole('button', { name: 'Current page' }).click();
  const one = await downloadOf(page, () => exportBtn.click());
  expect(one.d.suggestedFilename()).toBe('lookbook-carousel-1080x1080-p01.png');
  await page.getByRole('button', { name: /^All pages/ }).click();
  const zip = await downloadOf(page, () => exportBtn.click());
  expect(await zipEntries(zip.buf)).toHaveLength(4);
  await fmt.selectOption('pdf');
  const pdf = await downloadOf(page, () => exportBtn.click());
  expect(pdf.buf.subarray(0, 5).toString()).toBe('%PDF-');
  await page.goto('/editor/#t=doc-casestudy');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByLabel('Format').selectOption('docx');
  const docx = await downloadOf(page, () => page.locator('button', { hasText: /^Export / }).last().click());
  expect(await zipEntries(docx.buf)).toContain('word/document.xml');
});

test('iPhone: large exports are capped to what Safari can render', async ({ page }) => {
  test.skip(!(await isIPhone(page)), 'iOS user agents only');
  await page.goto('/editor/#t=st-announcement');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await expect(page.getByRole('button', { name: /^3× · 3240×5760 \(max 2\.\d+× here\)/ })).toBeVisible();
  await page.getByRole('button', { name: /^3×/ }).click();
  await expect(page.getByText(/export will be limited to 2\.\d+×/)).toBeVisible();
  const r = await downloadOf(page, () => page.locator('button', { hasText: /^Export / }).last().click());
  const [w, h] = [r.buf.readUInt32BE(16), r.buf.readUInt32BE(20)];
  expect(w * h).toBeLessThanOrEqual(16_777_216);
  await expect(page.getByText(/limited to 2\.\d+× on this device/).first()).toBeVisible();
});

test('share sheet: "Share / Save to Photos" hands the PNG to the phone', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: string[] };
    w.__shared = [];
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: async (d: { files: File[] }) => { w.__shared.push(...d.files.map(f => f.name + '|' + f.type + '|' + f.size)); }, configurable: true });
  });
  await page.goto('/editor/#t=sq-quote');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByRole('button', { name: 'Share / Save to Photos' }).click();
  await expect(page.getByText(/^Shared brand-statement-1080x1080/).first()).toBeVisible();
  const shared = await page.evaluate(() => (window as unknown as { __shared: string[] }).__shared);
  expect(shared).toHaveLength(1);
  expect(shared[0]).toMatch(/^brand-statement-1080x1080\.png\|image\/png\|\d+$/);
  await page.goto('/templates/');
  await expect(page.getByRole('button', { name: 'Share Announcement' }).first()).toBeVisible();
});

test('no iOS zoom: every visible form field is at least 16px', async ({ page }) => {
  const check = async () => {
    const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]), select, textarea')]
      .filter(e => e.offsetParent !== null && parseFloat(getComputedStyle(e).fontSize) < 16).map(e => (e.getAttribute('aria-label') || e.id || e.tagName) + ' ' + getComputedStyle(e).fontSize));
    expect(small).toEqual([]);
  };
  await page.goto('/templates/'); await check();
  await page.goto('/design-system/'); await check();
  await page.goto('/editor/#t=sq-announcement');
  await page.locator('[data-pw="0"] [data-el="title"]').tap();
  await page.getByRole('button', { name: 'Edit selected' }).click(); await check();
  await page.getByRole('tab', { name: 'Document' }).click(); await check();
  await page.getByRole('tab', { name: 'Export' }).click(); await check();
});

test('template bulk bar docks to the bottom on phones', async ({ page }) => {
  test.skip(page.viewportSize()!.width >= 700, 'docked bar is for phone widths');
  await page.goto('/templates/');
  const bar = page.getByRole('region', { name: 'Bulk export' });
  const box = (await bar.boundingBox())!; const vh = page.viewportSize()!.height;
  expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(vh - 2);
});
