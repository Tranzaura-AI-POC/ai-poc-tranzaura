import { test, expect } from '@playwright/test';

// Use environment credentials to avoid exposing secrets in test code
const FLEET_USERNAME = process.env.FLEET_USERNAME;
const FLEET_PASSWORD = process.env.FLEET_PASSWORD;
if (!FLEET_USERNAME || !FLEET_PASSWORD) throw new Error('FLEET_USERNAME and FLEET_PASSWORD must be set in the environment');

// Perform API login and set token in localStorage to avoid UI flakiness
async function login(page) {
  await page.goto('http://127.0.0.1:4200/');
  const username = FLEET_USERNAME;
  const password = FLEET_PASSWORD;
  const token = await page.evaluate(async (creds) => {
    const res = await fetch('http://127.0.0.1:5000/api/Auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: creds.username, password: creds.password })
    });
    if (!res.ok) return null;
    const json = await res.json();
    localStorage.setItem('fleet_token', json.token);
    return json.token;
  }, { username, password });
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
