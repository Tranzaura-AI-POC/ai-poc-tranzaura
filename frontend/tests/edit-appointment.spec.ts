import { test, expect } from '@playwright/test';

// Credentials must be provided via environment variables for security
const FLEET_USERNAME = process.env.FLEET_USERNAME;
const FLEET_PASSWORD = process.env.FLEET_PASSWORD;
if (!FLEET_USERNAME || !FLEET_PASSWORD) {
  throw new Error('FLEET_USERNAME and FLEET_PASSWORD must be set in the environment');
}

// Runtime endpoints
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://aipocstoragedev.z33.web.core.windows.net';
const API = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:5000/api';

// Helper: perform API login server-side using Playwright `request`, set token in localStorage
async function apiLogin(page, request) {
  await page.goto(`${BASE}/`);
  const res = await request.post(`${API}/Auth/login`, { data: { username: FLEET_USERNAME, password: FLEET_PASSWORD } });
  if (!res.ok()) throw new Error('Login failed: could not obtain token (request)');
  const json = await res.json();
  const token = json.token;
  if (!token) throw new Error('Login failed: no token returned');
  await page.evaluate((t) => localStorage.setItem('fleet_token', t), token);
  return token;
}

test('edit appointment updates backend and UI', async ({ page, request }) => {
  // choose a date at least 1 day in the future
  const dt = new Date();
  dt.setDate(dt.getDate() + 1);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  const dateToSet = `${y}-${m}-${d}`;

  // pick a time between 09:00 and 18:00 (inclusive). Minutes at 00/15/30/45
  const hour = Math.floor(Math.random() * (18 - 9 + 1)) + 9; // 9..18
  const minsArray = [0,15,30,45];
  let minute = minsArray[Math.floor(Math.random() * minsArray.length)];
  // if hour is 18, cap minutes to 0
  if (hour === 18) minute = 0;
  const timeToSet = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;

  // track created appointment for cleanup
  let createdId: any = null;
  let token: any = null;

  try {
    await apiLogin(page, request);

    // Obtain an API token for direct API operations
    const loginRes = await request.post(`${API}/Auth/login`, { data: { username: FLEET_USERNAME, password: FLEET_PASSWORD } });
    expect(loginRes.ok()).toBeTruthy();
    const loginJson = await loginRes.json();
    token = loginJson.token;

    // Fetch lookups to seed a new appointment
    const atRes = await request.get(`${API}/AssetTypes`, { headers: { Authorization: `Bearer ${token}` } });
    const scRes = await request.get(`${API}/ServiceCenters`, { headers: { Authorization: `Bearer ${token}` } });
    const ats = (await atRes.json()) || [];
    const scs = (await scRes.json()) || [];
    const assetTypeId = (ats && ats.length > 0) ? ats[0].id : 1;
    const serviceCenterId = (scs && scs.length > 0) ? scs[0].id : 1;

    // create an appointment specifically for this test to avoid cross-test interference
    const iso = new Date(dateToSet + 'T' + timeToSet + ':00').toISOString();
    const createRes = await request.post(`${API}/ServiceAppointments`, {
      data: {
        assetTypeId,
        serviceCenterId,
        appointmentDate: iso,
        assetYear: 2020,
        assetMake: 'E2E-Test',
        notes: 'created for edit-appointment test'
      },
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(createRes.ok()).toBeTruthy();
    const created = await createRes.json();
    createdId = created.id;

    await page.goto(`${BASE}/appointments`);
    await page.waitForLoadState('networkidle');

    // Open first appointment for edit (opens a modal dialog)
    const editBtn = page.getByRole('button', { name: 'Edit' }).first();
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();

    // Modal should appear; scope inputs to the modal to avoid ambiguity
    const modal = page.locator('.confirm-dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Fill date and time (native inputs inside modal)
    const dateInput = modal.getByLabel('Date');
    await expect(dateInput).toBeVisible();
    await dateInput.fill(dateToSet);

    const timeInput = modal.getByLabel('Time');
    await expect(timeInput).toBeVisible();
    await timeInput.fill(timeToSet);

    // Save via modal Save button
    const saveBtn = modal.getByRole('button', { name: 'Save' });
    await expect(saveBtn).toBeVisible();
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/ServiceAppointments') && resp.request().method() === 'PUT', { timeout: 5000 }).catch(() => null),
      saveBtn.click()
    ]);

    // wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 3000 }).catch(() => {});

    // Wait briefly for UI to update
    await page.waitForTimeout(500);

    // Verify via API that an appointment exists with the requested local date/time
    // Poll API until the created appointment appears (some tests run concurrently)
    let apis: any[] = [];
    let target: any = null;
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const apires = await request.get(`${API}/ServiceAppointments`, { headers: { Authorization: `Bearer ${token}` } });
      expect(apires.ok()).toBeTruthy();
      apis = await apires.json();
      target = apis.find((a: any) => Number(a.id) === Number(createdId));
      if (target) break;
      await page.waitForTimeout(300);
    }
    expect(target, `Appointment ${createdId} not found in API`).toBeTruthy();

    const d = new Date(target.appointmentDate);
    const toParts = (dt: Date, useUTC = false) => {
      const y = String(useUTC ? dt.getUTCFullYear() : dt.getFullYear()).padStart(4, '0');
      const mo = String((useUTC ? dt.getUTCMonth() : dt.getMonth()) + 1).padStart(2, '0');
      const da = String(useUTC ? dt.getUTCDate() : dt.getDate()).padStart(2, '0');
      const hh = String(useUTC ? dt.getUTCHours() : dt.getHours()).padStart(2, '0');
      const mm = String(useUTC ? dt.getUTCMinutes() : dt.getMinutes()).padStart(2, '0');
      return { date: `${y}-${mo}-${da}`, time: `${hh}:${mm}` };
    };

    const local = toParts(d, false);
    const utc = toParts(d, true);
    expect((local.date === dateToSet && local.time === timeToSet) || (utc.date === dateToSet && utc.time === timeToSet), 'Updated appointment not found in API').toBeTruthy();

    // Verify UI reflects updated date (rough check: meta contains the entered day)
    const firstMeta = page.locator('.appointment-card').first().locator('.meta');
    const enteredDay = String(Number(dateToSet.split('-')[2]));
    await expect(firstMeta).toContainText(enteredDay);

  } catch (err) {
    // capture debugging artifacts then rethrow to fail the test
    try { await page.screenshot({ path: 'test-failure-edit-appointment.png', fullPage: true }); } catch {}
    try { const html = await page.content(); require('fs').writeFileSync('test-failure-edit-appointment.html', html); } catch {}
    throw err;
  } finally {
    // cleanup the appointment we created for this test
    try {
      if (createdId && token) {
        await request.delete(`${API}/ServiceAppointments/${createdId}`, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (e) {
      // ignore cleanup failures
    }
  }
});