import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4200',
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10000,
    ignoreHTTPSErrors: true,
  },
  // Do not start a web server from Playwright to avoid interfering with an
  // existing `ng serve` dev server. Tests will use the running server at
  // `baseURL` (127.0.0.1:4200).
  // If you need Playwright to start a server in CI, add a separate config
  // or set `webServer` dynamically in CI scripts.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
