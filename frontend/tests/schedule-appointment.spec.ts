import { test, expect } from '@playwright/test';

// Reuse API login to set localStorage token
async function login(page) {
  await page.goto('/');
  // create a unique username per test run to avoid conflicts and ensure role assignment
  const unique = `e2e_admin_${Date.now()}`;
  const password = 'Password123!';

  const token = await page.evaluate(async (opts) => {
    const u = opts.u;
    const p = opts.p;
    async function doLogin(username) {
      const res = await fetch('/api/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: p })
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.token;
    }

    // Always attempt to register first (use unique username)
    try {
      await fetch('/api/Auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p, role: 'Admin' })
      });
    } catch { /* ignore */ }

    const t = await doLogin(u);
    if (t) localStorage.setItem('fleet_token', t);
    return t;
  }, { u: unique, p: password });

  if (!token) throw new Error('Login failed: could not obtain token (register or login)');
}

test('schedule an appointment from homepage and delete it', async ({ page }) => {
  await login(page);

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Fill Asset Type (use first available fallback or API-provided option)
  const assetTypeInput = page.locator('input[aria-label="Asset Type"]');
  await assetTypeInput.fill('Truck');
  // open the dropdown then click matching item
  await page.locator('input[aria-label="Asset Type"] + button.select-toggle').click();
  const assetOption = page.locator('.options-list .option-item', { hasText: 'Truck' }).first();
  await assetOption.waitFor({ state: 'visible', timeout: 5000 });
  await assetOption.click();

  // Asset Make
  const makeInput = page.locator('input[aria-label="Asset Make"]');
  await makeInput.fill('Ford');
  await page.locator('input[aria-label="Asset Make"] + button.select-toggle').click();
  const makeOption = page.locator('.options-list .option-item', { hasText: 'Ford' }).first();
  await makeOption.waitFor({ state: 'visible', timeout: 3000 });
  await makeOption.click();

  // Asset Year
  const yearInput = page.locator('input[aria-label="Asset Year"]');
  const year = new Date();
  const yearStr = String(year.getFullYear());
  await yearInput.fill(yearStr);
  await page.locator('input[aria-label="Asset Year"] + button.select-toggle').click();
  const yearOption = page.locator('.options-list .option-item', { hasText: yearStr }).first();
  await yearOption.waitFor({ state: 'visible', timeout: 3000 });
  await yearOption.click();

  // Service Center
  const centerInput = page.locator('input[aria-label="Service Center"]');
  await centerInput.fill('Central');
  await page.locator('input[aria-label="Service Center"] + button.select-toggle').click();
  const centerOption = page.locator('.options-list .option-item', { hasText: 'Central' }).first();
  await centerOption.waitFor({ state: 'visible', timeout: 5000 });
  await centerOption.click();

  // Inspection Type
  const inspectionInput = page.locator('input[aria-label="Inspection Type"]');
  await inspectionInput.fill('Service & Safety Inspection');
  await page.locator('input[aria-label="Inspection Type"] + button.select-toggle').click();
  const inspectionOption = page.locator('.options-list .option-item', { hasText: 'Service & Safety Inspection' }).first();
  await inspectionOption.waitFor({ state: 'visible', timeout: 3000 });
  await inspectionOption.click();

  // Appointment Date (use tomorrow)
  const dt = new Date();
  dt.setDate(dt.getDate() + 1);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const dateInput = page.locator('input[aria-label="Appointment Date"]');
  await dateInput.fill(dateStr);

  // Appointment Time
  const timeInput = page.locator('input[aria-label="Appointment Time"]');
  await timeInput.fill('09:30');

  // Notes (use unique text to identify later)
  const uniqueNote = `E2E test appointment ${Date.now()}`;
  const notes = page.locator('textarea[aria-label="Notes"]');
  await notes.fill(uniqueNote);

  // Submit and capture the POST response so we can assert it succeeded
  const [postResp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/ServiceAppointments') && r.request().method() === 'POST'),
    page.locator('button:has-text("Save Appointment")').click()
  ]);

  if (!postResp.ok()) {
    const status = postResp.status();
    let body = '';
    try { body = await postResp.text(); } catch { /* ignore */ }
    throw new Error(`Appointment POST failed: ${status} ${body}`);
  }

  // Confirm saved message (give a bit more time for UI updates)
  await expect(page.locator('text=Appointment saved successfully!')).toBeVisible({ timeout: 10000 });

  // Find the created appointment via API and delete it
  const deleted = await page.evaluate(async (note) => {
    const token = localStorage.getItem('fleet_token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    // fetch all appointments
    const res = await fetch('/api/ServiceAppointments', { headers });
    if (!res.ok) return false;
    const list = await res.json();
    const match = (list || []).find((a: any) => a.notes === note || (a.notes || '').includes(note));
    if (!match) return false;
    const del = await fetch(`/api/ServiceAppointments/${match.id}`, { method: 'DELETE', headers });
    return del.ok;
  }, uniqueNote);

  expect(deleted).toBeTruthy();
});
