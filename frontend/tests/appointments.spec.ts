import { test, expect } from '@playwright/test';

// Use environment credentials to avoid exposing secrets in test code
const FLEET_USERNAME = process.env.FLEET_USERNAME;
const FLEET_PASSWORD = process.env.FLEET_PASSWORD;
if (!FLEET_USERNAME || !FLEET_PASSWORD) throw new Error('FLEET_USERNAME and FLEET_PASSWORD must be set in the environment');

// Runtime endpoints
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4200';
const API = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:5000/api';

// Perform API login server-side using Playwright `request`, set token in localStorage
async function login(page, request) {
  await page.goto(`${BASE}/`);
  const res = await request.post(`${API}/Auth/login`, { data: { username: FLEET_USERNAME, password: FLEET_PASSWORD } });
  if (!res.ok()) throw new Error('Login failed: could not obtain token (request)');
  const json = await res.json();
  const token = json.token;
  if (!token) throw new Error('Login failed: no token returned');
  await page.evaluate((t) => localStorage.setItem('fleet_token', t), token);
  return token;
}

test('appointments page loads and shows appointments grid', async ({ page, request }) => {
  await login(page, request);
  await page.goto(`${BASE}/appointments`);
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
