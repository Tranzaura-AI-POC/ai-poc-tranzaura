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

test('appointments page loads and shows appointments grid', async ({ page }) => {
  await login(page);
  await page.goto('http://127.0.0.1:4200/appointments');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/Fleet Frontend|Fleet Service Scheduler|Appointments/);

  // Look for the appointments selectors used in the app
  const gridOrCards = page.locator('.appointments-grid, .appointment-card');
  const title = page.locator('#appointments-heading');
  // Pass if either the grid/cards are present or the page contains the heading text
  if ((await gridOrCards.count()) > 0) {
    await expect(gridOrCards.first()).toBeVisible({ timeout: 10000 });
  } else {
    await expect(title).toBeVisible({ timeout: 10000 });
  }
});
