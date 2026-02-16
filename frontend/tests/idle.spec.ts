import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4200';

test('idle logout triggers after override timeout', async ({ page }) => {
  // Set a short override timeout (5s) and a fake token
  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.setItem('fleet_token', 'test-token');
    localStorage.setItem('fleet_idle_timeout_ms', '5000');
  });

  // Reload so app picks up auth state and idle service starts
  await page.reload();

  // Ensure authenticated state: header sign out visible
  await expect(page.locator('text=Sign Out')).toBeVisible({ timeout: 2000 });

  // Wait longer than override timeout
  await page.waitForTimeout(7000);

  // After timeout, token should be removed and sign-in page visible
  const token = await page.evaluate(() => localStorage.getItem('fleet_token'));
  expect(token).toBeNull();
  await expect(page.getByRole('heading', { name: 'Sign in to FleetHub' })).toBeVisible({ timeout: 2000 });
});
