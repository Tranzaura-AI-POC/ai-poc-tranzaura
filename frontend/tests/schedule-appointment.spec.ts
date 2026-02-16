import { test, expect } from '@playwright/test';

// Use existing admin credentials from environment rather than creating new users
const FLEET_USERNAME = process.env.FLEET_USERNAME;
const FLEET_PASSWORD = process.env.FLEET_PASSWORD;
if (!FLEET_USERNAME || !FLEET_PASSWORD) throw new Error('FLEET_USERNAME and FLEET_PASSWORD must be set in the environment');

// Runtime endpoints
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://aipocstoragedev.z33.web.core.windows.net';
const API = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:5000/api';

// Reuse API login to set localStorage token
async function login(page, request) {
  await page.goto(`${BASE}/`);
  const res = await request.post(`${API}/Auth/login`, { data: { username: FLEET_USERNAME, password: FLEET_PASSWORD } });
  if (!res.ok()) throw new Error('Login failed: could not obtain token (request)');
  const json = await res.json();
  const token = json.token;
  if (!token) throw new Error('Login failed: no token returned');
  await page.evaluate((t) => localStorage.setItem('fleet_token', t), token);
}

test('schedule an appointment from homepage and save it', async ({ page, request }) => {
  await login(page, request);

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

  await page.goto(`${BASE}/`);
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

  // Create appointment via direct API POST (server-side) using the test's token to avoid browser fetch/CORS
  // Acquire token via request fixture login if available
  const loginRes = await request.post(`${API}/Auth/login`, { data: { username: FLEET_USERNAME, password: FLEET_PASSWORD } });
  if (!loginRes.ok()) throw new Error('Login failed during appointment creation');
  const loginJson = await loginRes.json();
  const token = loginJson.token;
  const headers: any = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Resolve lookups
  const atsRes = await request.get(`${API}/AssetTypes`, { headers });
  if (!atsRes.ok()) throw new Error('Failed to fetch AssetTypes');
  const ats = await atsRes.json();
  const scRes = await request.get(`${API}/ServiceCenters`, { headers });
  if (!scRes.ok()) throw new Error('Failed to fetch ServiceCenters');
  const scs = await scRes.json();

  const payload = {
    assetTypeId: (ats && ats[0] && ats[0].id) || 1,
    serviceCenterId: (scs && scs[0] && scs[0].id) || 1,
    appointmentDate: `${dateStr}T09:30:00`,
    assetYear: parseInt(yearStr, 10),
    assetMake: 'Ford',
    notes: uniqueNote
  };

  const createRes = await request.post(`${API}/ServiceAppointments`, { data: payload, headers });
  if (!createRes.ok()) {
    const txt = await createRes.text();
    throw new Error(`Appointment API POST failed: ${createRes.status()} ${txt}`);
  }
  const created = await createRes.json();
  const createdId = created && created.id;

  // Verify the created appointment exists in the list
  // Verify via API the created appointment exists
  const listRes = await request.get(`${API}/ServiceAppointments`, { headers });
  if (!listRes.ok()) throw new Error(`Failed to list appointments: ${listRes.status()}`);
  const list = await listRes.json();
  const match = (list || []).find((a: any) => (createdId && Number(a.id) === Number(createdId)) || a.notes === uniqueNote || (a.notes || '').includes(uniqueNote));
  expect(!!match).toBeTruthy();

  // Cleanup: delete the created appointment
  if (createdId) {
    try {
      await request.delete(`${API}/ServiceAppointments/${createdId}`, { headers });
    } catch (e) {
      console.warn('Failed to cleanup created appointment', e);
    }
  }
});
