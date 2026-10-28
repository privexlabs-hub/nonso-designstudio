import { test, expect } from '@playwright/test';
import { clipboard, downloadOf, freshStorage, trackErrors, zipEntries } from './helpers';

test.beforeEach(async ({ page }) => { await freshStorage(page); });

test('theme toggle switches, persists across reloads and syncs between tabs', async ({ page, context }) => {
  await page.goto('/');
  const start = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.getByRole('button', { name: 'Switch colour theme' }).click();
  const next = start === 'dark' ? 'light' : 'dark';
  await expect(page.locator('html')).toHaveAttribute('data-theme', next);
  await expect(page.getByRole('button', { name: 'Switch colour theme' })).toHaveText(next === 'dark' ? 'Light mode' : 'Dark mode');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', next);
  const other = await context.newPage(); await other.goto('/voice/');
  await other.getByRole('button', { name: 'Switch colour theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', start!);
});

test('studio home: 96 templates, recently edited list comes from the editor', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/^96 templates — /)).toBeVisible();
  await expect(page.getByText('Nothing yet. Open any template')).toBeVisible();
  await page.goto('/editor/#t=sq-testimonial'); await expect(page.getByText('Saved in this browser')).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Testimonial' })).toHaveAttribute('href', '/editor/#t=sq-testimonial');
});

test('design system: copy actions put exact values on the clipboard', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/design-system/');
  await page.getByRole('button', { name: 'Copy Atelier Ink #0B0A08' }).click();
  expect(await clipboard(page)).toBe('#0B0A08');
  await page.getByRole('button', { name: 'rgb(11, 10, 8)' }).first().click();
  expect(await clipboard(page)).toBe('rgb(11, 10, 8)');
  await page.getByRole('button', { name: 'var(--ns-gold)' }).click();
  expect(await clipboard(page)).toBe('var(--ns-gold)');
  await page.getByRole('button', { name: '--color-text-primary' }).click();
  expect(await clipboard(page)).toBe('var(--color-text-primary)');
  await page.locator('#type').getByRole('button', { name: 'CSS' }).first().click();
  expect(await clipboard(page)).toBe('font-family:var(--font-display);font-size:var(--type-display-size);font-weight:400;line-height:0.96;letter-spacing:-0.015em;');
  await page.getByRole('button', { name: 'Copy CSS' }).first().click();
  expect(await clipboard(page)).toBe('background:repeating-linear-gradient(90deg,currentColor 0 6px,transparent 6px 10px);height:1px');
  await page.getByRole('button', { name: 'Copy icon name scissors' }).click();
  expect(await clipboard(page)).toBe('scissors');
  await expect(page.locator('#colour').getByText('9.9:1 · AA')).toBeVisible();
  await expect(page.locator('#colour').getByText(/· Fail/).first()).toBeVisible();
  await expect(page.locator('#slides figure')).toHaveCount(12);
  await expect(page.locator('#uikits a')).toHaveCount(8);
  expect(errors).toEqual([]);
});

test('playbook: chapters, swatch copy and previews', async ({ page }) => {
  await page.goto('/playbook/');
  await expect(page.getByRole('navigation', { name: 'Playbook chapters' }).getByRole('link')).toHaveCount(13);
  await page.locator('#pb-colour').getByRole('button', { name: /Thread Gold/ }).click();
  expect(await clipboard(page)).toBe('#E0B04F');
  await expect(page.locator('#pb-social a')).toHaveCount(5);
  await expect(page.locator('#pb-docs a')).toHaveCount(6);
});

test('voice: filter, copy reference and section, download .md and .txt', async ({ page }) => {
  await page.goto('/voice/');
  await page.getByRole('button', { name: 'Copy complete reference' }).click();
  const all = await clipboard(page);
  expect(all.startsWith('# Nonso Stitches — Brand voice & knowledge')).toBe(true);
  expect(all).toContain('## Brand description & positioning [Verified brand fact]');
  await page.getByRole('button', { name: /^Needs confirmation · \d+/ }).click();
  await expect(page.getByRole('button', { name: /^Needs confirmation/ })).toHaveAttribute('aria-pressed', 'true');
  const sections = page.locator('main section');
  const n = await sections.count(); expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) await expect(sections.nth(i).getByText('Needs confirmation', { exact: true })).toBeVisible();
  await sections.first().getByRole('button', { name: 'Copy section' }).click();
  expect((await clipboard(page)).startsWith('\n## ')).toBe(true);
  const md = await downloadOf(page, () => page.getByRole('button', { name: 'Download .md' }).click());
  expect(md.d.suggestedFilename()).toBe('nonso-stitches-brand-voice-knowledge.md');
  const txt = await downloadOf(page, () => page.getByRole('button', { name: 'Download .txt' }).click());
  expect(txt.buf.toString()).not.toMatch(/^#+ /m);
});

test('assets: per-file download, copy path, group ZIP and all-assets ZIP', async ({ page }) => {
  await page.goto('/assets/');
  const one = await downloadOf(page, () => page.getByRole('link', { name: 'Download' }).first().click());
  expect(one.d.suggestedFilename()).toBe('nonso-stitches-badge-primary.jpg');
  await page.getByRole('button', { name: 'Copy path' }).first().click();
  expect(await clipboard(page)).toBe('assets/logo/nonso-stitches-badge-primary.jpg');
  const grp = await downloadOf(page, () => page.getByRole('button', { name: 'Download group (ZIP)' }).nth(2).click());
  expect(grp.d.suggestedFilename()).toBe('nonso-stitches-avatars.zip');
  expect(await zipEntries(grp.buf)).toEqual(['assets/avatars/avatar-chalk-tile.png', 'assets/avatars/avatar-indigo-tile.png', 'assets/avatars/avatar-ink-full.png', 'assets/avatars/avatar-ink-padded.png']);
  const all = await downloadOf(page, () => page.getByRole('button', { name: 'Download all assets (ZIP)' }).click());
  expect(all.d.suggestedFilename()).toBe('nonso-stitches-brand-assets.zip');
  expect((await zipEntries(all.buf)).length).toBe(23);
});

test('templates: filter, search, bulk export ZIP, single download, banner generator', async ({ page }) => {
  await page.goto('/templates/');
  await expect(page.locator('article')).toHaveCount(96);
  await page.getByRole('button', { name: /^Avatars/ }).click();
  await expect(page.locator('article')).toHaveCount(6);
  await page.getByRole('button', { name: /^All/ }).click();
  await page.getByRole('searchbox', { name: 'Search templates' }).fill('zzzz');
  await expect(page.getByText('No templates match “zzzz”')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search templates' }).fill('poll');
  await expect(page.locator('article')).toHaveCount(2);
  await page.getByRole('button', { name: 'Select all shown' }).click();
  await expect(page.getByText('2 selected')).toBeVisible();
  await page.getByLabel('Bulk export format').selectOption('md');
  const z = await downloadOf(page, () => page.getByRole('button', { name: 'Export ZIP' }).click());
  expect(z.d.suggestedFilename()).toBe('nonso-stitches-md-export.zip');
  expect(await zipEntries(z.buf)).toEqual(['poll-1080x1080/poll-1080x1080.md', 'poll-1080x1920/poll-1080x1920.md']);
  const png = await downloadOf(page, () => page.locator('article').first().getByRole('button', { name: 'PNG' }).click());
  expect(png.d.suggestedFilename()).toBe('poll-1080x1080.png');
  expect(png.buf.subarray(1, 4).toString()).toBe('PNG');
  await page.getByRole('searchbox', { name: 'Search templates' }).fill('');
  await page.getByLabel('Article title').fill('How a jacket should fit');
  await page.getByLabel(/Subtitle/).fill('Six checks');
  await page.getByRole('combobox', { name: /^Channel/ }).selectOption('ed-linkedin-post');
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page).toHaveURL(/\/editor\/#t=ed-linkedin-post$/);
  await expect(page.locator('[data-el="title"]').first()).toHaveText('How a jacket should fit');
  await expect(page.locator('[data-el="body"]').first()).toHaveText('Six checks');
});

test('templates: edited badge and reset', async ({ page }) => {
  await page.goto('/editor/#t=sq-cta');
  await page.getByRole('tab', { name: 'Document' }).click();
  await page.getByLabel('Title', { exact: true }).fill('Edited title');
  await expect(page.getByText('Saved in this browser')).toBeVisible();
  await page.goto('/templates/');
  const card = page.locator('article', { hasText: 'Call to action' }).first();
  await expect(card.getByText('Edited')).toBeVisible();
  await card.getByRole('button', { name: 'Reset' }).click();
  await expect(card.getByText('Edited')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('ns:trash:sq-cta'))).toContain('Edited title');
});
