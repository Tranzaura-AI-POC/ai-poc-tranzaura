import { test, expect } from '@playwright/test';

// Credentials must be provided via environment variables for security
const FLEET_USERNAME = process.env.FLEET_USERNAME;
const FLEET_PASSWORD = process.env.FLEET_PASSWORD;
if (!FLEET_USERNAME || !FLEET_PASSWORD) {
  throw new Error('FLEET_USERNAME and FLEET_PASSWORD must be set in the environment');
}

// Runtime endpoints
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4200';
const API = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:5000/api';
// Helper: perform API login and set token in localStorage for UI interactions
async function apiLogin(page) {
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

test('delete appointment removes item and is reflected in API', async ({ page, request }) => {
  try {
    await apiLogin(page);

    // Obtain API token and create an appointment to delete (isolated)
    const loginRes = await request.post(`${API}/Auth/login`, { data: { username: FLEET_USERNAME, password: FLEET_PASSWORD } });
    expect(loginRes.ok()).toBeTruthy();
    const loginJson = await loginRes.json();
    const token = loginJson.token;

    // create appointment for deletion
    const dt = new Date();
    dt.setDate(dt.getDate() + 7);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const dateToSet = `${y}-${m}-${d}`;
    const iso = new Date(dateToSet + 'T09:00:00').toISOString();
    const createRes = await request.post(`${API}/ServiceAppointments`, {
      data: { assetTypeId: 1, serviceCenterId: 1, appointmentDate: iso, assetMake: 'E2E-Delete', assetYear: 2021, notes: 'to delete' },
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(createRes.ok()).toBeTruthy();
    const created = await createRes.json();
    const apptId = created.id;

    await page.goto(`${BASE}/appointments`);
    await page.waitForLoadState('networkidle');

    // locate the card we just created
    const firstCard = page.locator(`.appointment-card[data-id="${apptId}"]`);
    await expect(firstCard).toBeVisible({ timeout: 5000 });

    // Click the Delete button within that card and confirm
    const deleteBtn = firstCard.getByRole('button', { name: 'Delete' });
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();

    const modal = page.locator('.confirm-dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });
    const confirmBtn = modal.getByRole('button', { name: 'Delete' });

    // Wait for DELETE request to the API and click confirm
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/ServiceAppointments') && resp.request().method() === 'DELETE', { timeout: 5000 }).catch(() => null),
      confirmBtn.click()
    ]);

    // Give UI a moment to update
    await page.waitForTimeout(500);

    // Verify via API the appointment id is no longer present
    const apires = await request.get(`${API}/ServiceAppointments`, { headers: { Authorization: `Bearer ${token}` } });
    expect(apires.ok()).toBeTruthy();
    const apis = await apires.json();

    const found = apis.find((a: any) => Number(a.id) === apptId);
    expect(found, `Appointment ${apptId} still present after delete`).toBeFalsy();

  } catch (err) {
    // capture debugging artifacts then rethrow to fail the test
    try { await page.screenshot({ path: 'test-failure-delete-appointment.png', fullPage: true }); } catch {}
    try { const html = await page.content(); require('fs').writeFileSync('test-failure-delete-appointment.html', html); } catch {}
    throw err;
  }
});