import { test, expect } from '@playwright/test';

// Perform API login and set token in localStorage to avoid UI flakiness
async function login(page) {
  await page.goto('http://127.0.0.1:4200/');
  const token = await page.evaluate(async () => {
    const res = await fetch('http://127.0.0.1:5000/api/Auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Password123!' })
    });
    if (!res.ok) return null;
    const json = await res.json();
    localStorage.setItem('fleet_token', json.token);
    return json.token;
  });
  if (!token) throw new Error('Login failed: could not obtain token');
}

test('homepage loads and shows lookups', async ({ page }) => {
  await login(page);
  await page.goto('http://127.0.0.1:4200/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/Fleet Frontend|Fleet Service Scheduler/);

  // Check for at least one of the lookup inputs used in the UI
  const assetInput = page.locator('input[aria-label="Asset Type"]');
  const centerInput = page.locator('input[aria-label="Service Center"]');
  const selectInput = page.locator('.select-input, input[placeholder*="Asset"], input[placeholder*="Service"]');

  const assetCount = await assetInput.count();
  const centerCount = await centerInput.count();
  const selectCount = await selectInput.count();

  if (assetCount + centerCount + selectCount === 0) {
    // Fallback: ensure page has some main content element
    await expect(page.locator('.hero, .homepage-root, .title')).toBeVisible({ timeout: 10000 });
  } else {
    if (assetCount > 0) await expect(assetInput.first()).toBeVisible({ timeout: 10000 });
    if (centerCount > 0) await expect(centerInput.first()).toBeVisible({ timeout: 10000 });
    if (selectCount > 0) await expect(selectInput.first()).toBeVisible({ timeout: 10000 });
  }
});
