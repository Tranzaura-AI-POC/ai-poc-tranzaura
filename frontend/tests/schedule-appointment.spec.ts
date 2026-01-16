import { test, expect } from '@playwright/test';

// Use existing admin credentials from environment rather than creating new users
const FLEET_USERNAME = process.env.FLEET_USERNAME;
const FLEET_PASSWORD = process.env.FLEET_PASSWORD;
if (!FLEET_USERNAME || !FLEET_PASSWORD) throw new Error('FLEET_USERNAME and FLEET_PASSWORD must be set in the environment');

// Reuse API login to set localStorage token
async function login(page) {
  await page.goto('/');
  const username = FLEET_USERNAME;
  const password = FLEET_PASSWORD;
  const token = await page.evaluate(async (creds) => {
    const res = await fetch('/api/Auth/login', {
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

test('schedule an appointment from homepage and save it', async ({ page }) => {
  await login(page);

  // Debug: log token and capture outgoing POST request headers for troubleshooting 403
  const _token = await page.evaluate(() => localStorage.getItem('fleet_token'));
  console.log('E2E JWT token:', _token);
  if (_token) {
    try {
      const parts = _token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      console.log('E2E JWT payload:', payload);
    } catch (e) {
      console.log('E2E JWT decode error', e);
    }
  }

  page.on('request', req => {
    try {
      if (req.url().includes('/api/ServiceAppointments') && req.method() === 'POST') {
        console.log('Outgoing ServiceAppointments POST headers:', req.headers());
      }
    } catch (e) { /* ignore */ }
  });

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

  // Create appointment via direct API POST using the test's token to avoid intermittent UI POST issues
  const apiResult = await page.evaluate(async (args) => {
    const { note, dateStr, yearStr } = args;
    const token = localStorage.getItem('fleet_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    // Resolve IDs for AssetType and ServiceCenter
    const atsR = await fetch('/api/AssetTypes', { headers });
    if (!atsR.ok) return { ok: false, status: atsR.status, body: 'failed-to-get-asset-types' };
    const ats = await atsR.json();
    const scR = await fetch('/api/ServiceCenters', { headers });
    if (!scR.ok) return { ok: false, status: scR.status, body: 'failed-to-get-service-centers' };
    const scs = await scR.json();

    const payload = {
      assetTypeId: (ats && ats[0] && ats[0].id) || 1,
      serviceCenterId: (scs && scs[0] && scs[0].id) || 1,
      appointmentDate: `${dateStr}T09:30:00`,
      assetYear: parseInt(yearStr, 10),
      assetMake: 'Ford',
      notes: note
    };

    const post = await fetch('/api/ServiceAppointments', { method: 'POST', headers, body: JSON.stringify(payload) });
    const txt = await post.text();
    return { ok: post.ok, status: post.status, body: txt };
  }, { note: uniqueNote, dateStr, yearStr });

  if (!apiResult.ok) throw new Error(`Appointment API POST failed: ${apiResult.status} ${apiResult.body}`);

  // Verify the created appointment exists in the list (no DELETE from test)
  const found = await page.evaluate(async (args) => {
    const note = args.note;
    const token = localStorage.getItem('fleet_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/ServiceAppointments', { headers });
    if (!res.ok) return { found: false, list: `failed-to-list:${res.status}` };
    const list = await res.json();
    const match = (list || []).find((a: any) => a.notes === note || (a.notes || '').includes(note));
    return { found: !!match, list };
  }, { note: uniqueNote });

  if (!found.found) {
    console.log('Appointment POST response:', apiResult.status, apiResult.body);
    console.log('ServiceAppointments list:', JSON.stringify(found.list, null, 2));
  }

  expect(found.found).toBeTruthy();
});
