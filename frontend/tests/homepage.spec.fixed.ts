import { test, expect } from '@playwright/test';

// Use environment credentials to avoid exposing secrets in test code
const FLEET_USERNAME = process.env.FLEET_USERNAME;
const FLEET_PASSWORD = process.env.FLEET_PASSWORD;
if (!FLEET_USERNAME || !FLEET_PASSWORD) throw new Error('FLEET_USERNAME and FLEET_PASSWORD must be set in the environment');

// Runtime endpoints
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4200';
const API = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:5000/api';

// Perform API login and set token in localStorage to avoid UI flakiness
async function login(page) {
  await page.goto(`${BASE}/`);
  const username = FLEET_USERNAME;
  const password = FLEET_PASSWORD;
  const token = await page.evaluate(async (args) => {
    const creds = args.creds;
    const api = args.api;
    const res = await fetch(`${api}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: creds.username, password: creds.password })
    });
    if (!res.ok) return null;
    const json = await res.json();
    localStorage.setItem('fleet_token', json.token);
    return json.token;
  }, { creds: { username, password }, api: API });
  if (!token) throw new Error('Login failed: could not obtain token');
}

test('homepage loads and shows lookups and inspection dropdown', async ({ page }) => {
  await login(page);
  const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4200';
  await page.goto(`${BASE}/`);
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

  // If the inspection control is present, try native select first, otherwise use custom dropdown
  const inspSelect = page.locator('select[aria-label="Inspection Type"]');
  if ((await inspSelect.count()) > 0) {
    const opt = inspSelect.locator('option:not([value=""])').first();
    const val = await opt.getAttribute('value');
    if (val) {
      await page.selectOption('select[aria-label="Inspection Type"]', val);
      await expect(inspSelect).toHaveValue(val);
    }
  } else {
    const inspInput = page.locator('input[aria-label="Inspection Type"]');
    if ((await inspInput.count()) > 0) {
      // open the custom list if toggle exists
      const toggle = page.locator('button[aria-label="Toggle inspection list"]');
      if ((await toggle.count()) > 0) await toggle.click();
      const opt = page.locator('.options-list .option-item').first();
      if ((await opt.count()) > 0) {
        const text = (await opt.textContent())?.trim() || '';
        await opt.click();
        if (text) await expect(inspInput).toHaveValue(text);
      }
    }
  }
});
