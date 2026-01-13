import { test, expect } from '@playwright/test';

test('homepage loads and shows dropdowns', async ({ page }) => {
  await page.goto('http://127.0.0.1:4200/');
  await expect(page).toHaveTitle(/Fleet Frontend|Fleet Service Scheduler/);

  // The UI now uses custom inputs for lookups; target by aria-label / class
  const assetInput = page.locator('input[aria-label="Asset Type"]');
  await expect(assetInput).toBeVisible({ timeout: 5000 });

  const centerInput = page.locator('input[aria-label="Service Center"]');
  await expect(centerInput).toBeVisible({ timeout: 5000 });

  // Date input (native date input present)
  const dateInput = page.locator('input[formControlName="appointmentDate"]');
  await expect(dateInput).toBeVisible();
});
