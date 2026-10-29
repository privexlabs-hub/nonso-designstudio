import { defineConfig, devices } from '@playwright/test';

/* E2E against the static export (npm run build → out/). Set BASE_URL to test a running dev server instead. */
const port = 4310;
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list']],
  use: { baseURL: process.env.BASE_URL || `http://localhost:${port}`, acceptDownloads: true, trace: 'retain-on-failure' },
  webServer: process.env.BASE_URL ? undefined : { command: `npx --yes serve@14.2.4 out -l ${port} --no-clipboard`, port, reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] }, testIgnore: /mobile\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], permissions: ['clipboard-read', 'clipboard-write'] }, testMatch: /mobile|responsive/ },
    /* Real phone sizes and user agents on Chromium with touch — the iPhone profiles exercise the iOS code paths (canvas cap, print fallback) */
    ...([
      ['iphone-se', { ...devices['iPhone SE'], defaultBrowserType: 'chromium' }],
      ['iphone-15-pro-max', { ...devices['iPhone 15 Pro Max'], defaultBrowserType: 'chromium' }],
      ['galaxy-s24', { ...devices['Galaxy S24'], defaultBrowserType: 'chromium' }],
      ['phone-landscape', { ...devices['iPhone 13 landscape'], defaultBrowserType: 'chromium' }],
      ['ipad-mini', { ...devices['iPad Mini'], defaultBrowserType: 'chromium' }],
    ] as const).map(([name, use]) => ({ name, use: { ...use, permissions: ['clipboard-read', 'clipboard-write'] }, testMatch: /mobile\.spec/ })),
    /* iPhone Safari engine: needs WebKit's system libraries (`sudo npx playwright install-deps webkit`), so it is opt-in via PW_WEBKIT=1 */
    ...(process.env.PW_WEBKIT ? [{ name: 'iphone-webkit', use: { ...devices['iPhone 13'] }, testMatch: /mobile|responsive/ }] : []),
  ],
});
