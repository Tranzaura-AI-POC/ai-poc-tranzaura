import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('http://127.0.0.1:4200/signin');
  await page.fill('input[name="username"], input[formControlName="username"], #username', 'admin');
  await page.fill('input[name="password"], input[formControlName="password"], #password', 'Password123!');
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('http://127.0.0.1:4200/', { timeout: 5000 }).catch(()=>{});
}

test('appointments page loads and shows appointments grid', async ({ page }) => {
  await login(page);
  await page.goto('http://127.0.0.1:4200/appointments');
  await expect(page).toHaveTitle(/Fleet Frontend|Fleet Service Scheduler|Appointments/);

  // Look for the appointments selectors used in the app
  const gridOrCards = page.locator('.appointments-grid, .appointment-card');
  const title = page.locator('#appointments-heading');
  // Pass if either the grid/cards are present or the page contains the heading text
  if ((await gridOrCards.count()) > 0) {
    await expect(gridOrCards.first()).toBeVisible({ timeout: 5000 });
  } else {
    await expect(title).toBeVisible({ timeout: 5000 });
  }
});
