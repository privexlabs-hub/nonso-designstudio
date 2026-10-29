import { test, expect, type Page } from '@playwright/test';
import { clipboard, downloadOf, freshStorage, trackErrors, zipEntries } from './helpers';

const saved = (page: Page, id: string) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), 'ns:doc:' + id);
const waitSaved = (page: Page) => expect(page.getByText('Saved in this browser')).toBeVisible();
const el = (page: Page, id: string) => page.locator(`[data-pw="0"] [data-el="${id}"]`);

test.beforeEach(async ({ page }) => { await freshStorage(page); });

test('unknown template shows an error with a way back', async ({ page }) => {
  await page.goto('/editor/#t=nope');
  await expect(page.getByText('Template “nope” was not found. It may have been renamed.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to the template library' })).toBeVisible();
});

test('graphic: select, drag, nudge, resize, undo/redo, autosave', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/editor/#t=sq-announcement'); await waitSaved(page);
  const cta = el(page, 'cta'); const box = (await cta.boundingBox())!;
  const before = (await saved(page, 'sq-announcement')).pages[0].els.find((e: { id: string }) => e.id === 'cta');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 30, { steps: 6 }); await page.mouse.up();
  await expect(page.locator('strong', { hasText: 'Text' }).first()).toBeVisible();
  await waitSaved(page);
  let after = (await saved(page, 'sq-announcement')).pages[0].els.find((e: { id: string }) => e.id === 'cta');
  expect(after.x).toBeGreaterThan(before.x + 50); expect(after.y).toBeGreaterThan(before.y + 20);
  await page.locator('body').click({ position: { x: 5, y: 300 } }).catch(() => {});
  await cta.click(); await page.keyboard.press('Shift+ArrowLeft'); await page.keyboard.press('ArrowUp');
  await waitSaved(page);
  const nudged = (await saved(page, 'sq-announcement')).pages[0].els.find((e: { id: string }) => e.id === 'cta');
  expect(nudged.x).toBe(after.x - 10); expect(nudged.y).toBe(after.y - 1);
  const h = (await page.locator('[data-handle]').boundingBox())!;
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down(); await page.mouse.move(h.x + 80, h.y + 40, { steps: 5 }); await page.mouse.up();
  await waitSaved(page);
  after = (await saved(page, 'sq-announcement')).pages[0].els.find((e: { id: string }) => e.id === 'cta');
  expect(after.w).toBeGreaterThan(nudged.w + 50);
  await page.getByRole('button', { name: 'Undo' }).click(); await page.getByRole('button', { name: 'Undo' }).click(); await page.getByRole('button', { name: 'Undo' }).click(); await page.getByRole('button', { name: 'Undo' }).click();
  await waitSaved(page);
  const undone = (await saved(page, 'sq-announcement')).pages[0].els.find((e: { id: string }) => e.id === 'cta');
  expect([undone.x, undone.y, undone.w]).toEqual([before.x, before.y, before.w]);
  await page.keyboard.press('Control+Shift+Z'); await waitSaved(page);
  expect((await saved(page, 'sq-announcement')).pages[0].els.find((e: { id: string }) => e.id === 'cta').x).not.toBe(before.x);
  expect(errors).toEqual([]);
});

test('graphic: inline text editing, inspector fields, add/duplicate/delete elements, layers', async ({ page }) => {
  await page.goto('/editor/#t=sq-announcement'); await waitSaved(page);
  await el(page, 'title').dblclick();
  await page.keyboard.type('Made to fit.'); await page.keyboard.press('Escape');
  await expect(el(page, 'title')).toHaveText('Made to fit.');
  await el(page, 'title').click();
  await page.getByLabel('Size (px)').fill('80');
  await page.getByRole('button', { name: 'CAPS' }).click();
  await page.getByRole('button', { name: '#E0B04F' }).first().click();
  await waitSaved(page);
  const t = (await saved(page, 'sq-announcement')).pages[0].els.find((e: { id: string }) => e.id === 'title');
  expect([t.text, t.fs, t.up, t.c]).toEqual(['Made to fit.', 80, true, '#E0B04F']);
  for (const name of ['Heading', 'Text', 'Eyebrow', 'Button', 'Logo', 'Shape', 'Stitch line', 'Measure ticks']) await page.getByRole('button', { name, exact: true }).click();
  await waitSaved(page);
  const els = (await saved(page, 'sq-announcement')).pages[0].els;
  expect(els.filter((e: { user?: boolean }) => e.user).length).toBe(8);
  await page.keyboard.press('Control+d'); await page.keyboard.press('Delete');
  await page.getByRole('tab', { name: 'Page' }).click();
  await page.getByRole('button', { name: 'Hide' }).first().click();
  await waitSaved(page);
  expect((await saved(page, 'sq-announcement')).pages[0].els.some((e: { hidden?: boolean }) => e.hidden)).toBe(true);
});

test('graphic: image upload is placed and downscaled', async ({ page }) => {
  await page.goto('/editor/#t=sq-launch'); await waitSaved(page);
  await el(page, 'image').click();
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 2600; c.height = 1300; const x = c.getContext('2d')!; x.fillStyle = '#1F2E4A'; x.fillRect(0, 0, 2600, 1300); return c.toDataURL('image/png'); });
  await page.locator('input[type=file]').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(png.split(',')[1], 'base64') });
  await expect(page.locator('[data-pw="0"] [data-el="image"] img')).toBeVisible();
  await waitSaved(page);
  const src = (await saved(page, 'sq-launch')).pages[0].els.find((e: { id: string }) => e.id === 'image').src as string;
  const dims = await page.evaluate(s => new Promise<number[]>(r => { const i = new Image(); i.onload = () => r([i.width, i.height]); i.src = s; }), src);
  expect(dims).toEqual([2000, 1000]);
});

test('graphic: size, custom size, variation and layout switching keep text', async ({ page }) => {
  await page.goto('/editor/#t=ad-fitting'); await waitSaved(page);
  await page.getByRole('tab', { name: 'Document' }).click();
  await page.getByLabel('Title', { exact: true }).fill('Kept title');
  await page.getByLabel('Size').selectOption({ label: 'Leaderboard — 728 × 90' });
  await waitSaved(page);
  let d = await saved(page, 'ad-fitting'); expect([d.W, d.H]).toEqual([728, 90]);
  expect(d.pages[0].els.find((e: { id: string }) => e.id === 'title').text).toBe('Kept title');
  await page.getByLabel('Width').fill('1000'); await page.getByLabel('Height').fill('500'); await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByRole('button', { name: 'Indigo' }).click();
  await waitSaved(page);
  d = await saved(page, 'ad-fitting'); expect([d.W, d.H, d.palette]).toEqual([1000, 500, 'indigo']);
  await expect(page.getByLabel('Size')).toHaveValue('custom');
  await page.getByRole('tab', { name: 'Page' }).click();
  await page.getByLabel('Layout').selectOption('center');
  await waitSaved(page);
  d = await saved(page, 'ad-fitting'); expect(d.pages[0].layout).toBe('center');
  expect(d.pages[0].els.find((e: { id: string }) => e.id === 'title').text).toBe('Kept title');
  await page.getByRole('tab', { name: 'Document' }).click();
  await page.getByRole('button', { name: 'Reset to original template' }).click();
  await waitSaved(page);
  d = await saved(page, 'ad-fitting'); expect([d.W, d.H, d.palette]).toEqual([1080, 1080, 'ink']);
  await page.getByRole('button', { name: 'Undo' }).click(); await waitSaved(page);
  expect((await saved(page, 'ad-fitting')).palette).toBe('indigo');
});

test('carousel pages: add, duplicate, reorder by drag and buttons, delete, counters update', async ({ page }) => {
  await page.goto('/editor/#t=car-how-it-works'); await waitSaved(page);
  const pages = page.getByRole('list', { name: /Pages/ }).locator('> li');
  await expect(pages).toHaveCount(5);
  await page.getByLabel('Page template').selectOption('layout:quote');
  await page.getByRole('button', { name: 'Insert after' }).click();
  await expect(pages).toHaveCount(6);
  await pages.nth(0).getByRole('button', { name: 'Duplicate page' }).click();
  await expect(pages).toHaveCount(7);
  await pages.nth(6).getByRole('button', { name: 'Move page up' }).click();
  const g0 = (await pages.nth(0).locator('[role=button][title="Drag to reorder"]').boundingBox())!; const g3 = (await pages.nth(3).boundingBox())!;
  await page.mouse.move(g0.x + g0.width / 2, g0.y + g0.height / 2); await page.mouse.down(); await page.mouse.move(g0.x + 4, g3.y + g3.height - 4, { steps: 8 }); await page.mouse.up();
  await waitSaved(page);
  const d = await saved(page, 'car-how-it-works');
  expect(d.pages.length).toBe(7);
  expect(d.pages[3].els.find((e: { id: string }) => e.id === 'title').text).toBe('From your measurements to the finished piece.');
  expect(d.pages.map((p: { els: { id: string; text: string }[] }) => p.els.find(e => e.id === 'counter')!.text)).toEqual(['01 / 07', '02 / 07', '03 / 07', '04 / 07', '05 / 07', '06 / 07', '07 / 07']);
  await pages.nth(1).getByRole('button', { name: 'Delete page' }).click();
  await expect(pages).toHaveCount(6);
  await pages.nth(4).getByRole('button', { name: /Go to page 5/ }).click();
  await expect(page.getByText('Page 5 of 6')).toBeVisible();
  /* edits autosave after a 400 ms debounce — poll storage instead of reading it once */
  await expect.poll(async () => (await saved(page, 'car-how-it-works')).pages[0].els.find((e: { id: string }) => e.id === 'counter').text).toBe('01 / 06');
});

test('document: blocks, inline edit, page settings, numbering, overflow to new page', async ({ page }) => {
  await page.goto('/editor/#t=doc-report'); await waitSaved(page);
  await page.getByRole('list', { name: /Pages/ }).locator('> li').nth(3).getByRole('button', { name: /Go to page 4/ }).click();
  const p = page.locator('[data-pw="3"]');
  const firstPara = p.locator('[data-bt="para"]').first();
  await firstPara.dblclick(); await page.keyboard.type('Rewritten paragraph.'); await page.keyboard.press('Escape');
  await expect(firstPara).toHaveText('Rewritten paragraph.');
  await firstPara.click();
  await page.getByLabel('Block type', { exact: true }).selectOption('lead');
  await page.getByRole('button', { name: 'Centre' }).click();
  await page.getByLabel('Block type to add').selectOption('para');
  for (let i = 0; i < 40; i++) await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText(/page\(s\) overflow/)).toBeVisible();
  await page.getByRole('tab', { name: 'Page' }).click();
  await expect(page.getByText('Content on this page is clipped at the bottom margin.')).toBeVisible();
  await page.getByRole('button', { name: 'Move overflow to a new page' }).click();
  await waitSaved(page);
  const d = await saved(page, 'doc-report');
  expect(d.pages[4].name).toMatch(/\(cont\.\)$/);
  await page.getByLabel('Running header (right side)').fill('Section A');
  await page.getByRole('tab', { name: 'Document' }).click();
  await page.getByLabel('First page number').fill('5');
  await page.getByLabel('Position').selectOption('outside');
  await page.getByLabel('Page size').selectOption('letter');
  await waitSaved(page);
  const d2 = await saved(page, 'doc-report');
  expect([d2.format, d2.settings.numStart, d2.settings.numPos, d2.pages[3].section]).toEqual(['letter', 5, 'outside', 'Section A']);
  await expect(page.getByRole('list', { name: /Pages/ }).locator('> li').first()).toContainText('05 · p.5');
});

test('exports: every format downloads a valid file', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto('/editor/#t=sq-quote'); await waitSaved(page);
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const fmt = page.getByLabel('Format');
  const run = async (f: string, check: (name: string, buf: Buffer) => void | Promise<void>) => {
    await fmt.selectOption(f); const r = await downloadOf(page, () => page.locator('button', { hasText: /^Export / }).last().click()); await check(r.d.suggestedFilename(), r.buf);
    await expect(page.getByRole('complementary', { name: 'Inspector' }).getByText(/^Downloaded /)).toBeVisible();
  };
  await run('png', (n, b) => { expect(n).toBe('brand-statement-1080x1080.png'); expect(b.subarray(1, 4).toString()).toBe('PNG'); });
  await run('jpeg', (n, b) => { expect(n).toBe('brand-statement-1080x1080.jpg'); expect(b[0]).toBe(0xff); });
  await run('svg', (n, b) => { expect(n.endsWith('.svg')).toBe(true); expect(b.toString()).toContain('<svg'); });
  await run('pdf', (n, b) => { expect(n.endsWith('.pdf')).toBe(true); expect(b.subarray(0, 5).toString()).toBe('%PDF-'); });
  await run('pptx', async (n, b) => { expect(n.endsWith('.pptx')).toBe(true); expect(await zipEntries(b)).toContain('ppt/presentation.xml'); });
  await run('html', (n, b) => { expect(n.endsWith('.html')).toBe(true); expect(b.toString()).toContain('@font-face'); });
  await run('txt', (_n, b) => expect(b.toString()).toContain('Every garment deserves thoughtful craftsmanship.'));
  await page.getByRole('button', { name: 'Copy all text (Markdown)' }).click();
  expect(await clipboard(page)).toContain('## Artboard');

  await page.goto('/editor/#t=doc-ebook'); await waitSaved(page);
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await run('docx', async (n, b) => { expect(n).toBe('the-fit-guide-ebook.docx'); const e = await zipEntries(b); expect(e).toEqual(expect.arrayContaining(['word/document.xml', 'word/styles.xml', 'word/footer1.xml', '[Content_Types].xml', 'docProps/core.xml'])); });
  await run('epub', async (n, b) => { expect(n.endsWith('.epub')).toBe(true); const e = await zipEntries(b); expect(e[0] === 'META-INF/container.xml' || e.includes('mimetype')).toBe(true); expect(e).toEqual(expect.arrayContaining(['mimetype', 'OEBPS/content.opf', 'OEBPS/nav.xhtml', 'OEBPS/images/cover.jpg', 'OEBPS/p034.xhtml'])); });
  await run('md', (_n, b) => expect(b.toString()).toContain('# The Fit Guide'));
  await fmt.selectOption('png'); await page.getByRole('button', { name: 'Current page' }).click();
  const one = await downloadOf(page, () => page.locator('button', { hasText: /^Export / }).last().click());
  expect(one.d.suggestedFilename()).toBe('the-fit-guide-ebook-p01.png');

  await page.goto('/editor/#t=em-welcome'); await waitSaved(page);
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await run('emailhtml', (n, b) => { expect(n).toBe('welcome-email-email.html'); expect(b.toString()).toContain('role="presentation"'); });

  await page.goto('/editor/#t=doc-presentation'); await waitSaved(page);
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await run('pptx', async (_n, b) => { const e = await zipEntries(b); expect(e.filter(x => /^ppt\/slides\/slide\d+\.xml$/.test(x)).length).toBe(17); });
});
