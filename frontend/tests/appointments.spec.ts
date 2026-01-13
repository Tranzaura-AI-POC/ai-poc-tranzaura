import { test, expect } from '@playwright/test';

test('appointments page loads and shows appointments grid', async ({ page }) => {
  await page.goto('http://127.0.0.1:4200/appointments');
  await expect(page).toHaveTitle(/Fleet Frontend|Fleet Service Scheduler|Appointments/);

  // Look for any of the appointments selectors used in the app
  const container = page.locator('.appointments-grid, .appointment-card, text=Appointments');
  await expect(container).toBeVisible({ timeout: 5000 });
});
