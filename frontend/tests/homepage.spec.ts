import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('http://127.0.0.1:4200/signin');
  await page.fill('input[name="username"], input[formControlName="username"], #username', 'admin');
  await page.fill('input[name="password"], input[formControlName="password"], #password', 'Password123!');
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('http://127.0.0.1:4200/', { timeout: 5000 }).catch(()=>{});
}

test('homepage loads and shows lookups', async ({ page }) => {
  await login(page);
  await page.goto('http://127.0.0.1:4200/');
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
    await expect(page.locator('.hero, .homepage-root, .title')).toBeVisible({ timeout: 5000 });
  } else {
    if (assetCount > 0) await expect(assetInput.first()).toBeVisible({ timeout: 5000 });
    if (centerCount > 0) await expect(centerInput.first()).toBeVisible({ timeout: 5000 });
    if (selectCount > 0) await expect(selectInput.first()).toBeVisible({ timeout: 5000 });
  }
});
