import { test, expect } from '@playwright/test';

// Credentials must be provided via environment variables for security
const FLEET_USERNAME = process.env.FLEET_USERNAME;
const FLEET_PASSWORD = process.env.FLEET_PASSWORD;
if (!FLEET_USERNAME || !FLEET_PASSWORD) {
  throw new Error('FLEET_USERNAME and FLEET_PASSWORD must be set in the environment');
}

// Helper: perform API login and set token in localStorage for UI interactions
async function apiLogin(page) {
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

  try {
    await apiLogin(page);

    await page.goto('http://127.0.0.1:4200/appointments');
    await page.waitForLoadState('networkidle');

    // Open first appointment for edit
    const editBtn = page.getByRole('button', { name: 'Edit' }).first();
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();

    // Fill date and time (native inputs)
    const dateInput = page.getByRole('textbox', { name: 'Date' }).first();
    await expect(dateInput).toBeVisible();
    await dateInput.fill(dateToSet);

    const timeInput = page.getByRole('textbox', { name: 'Time' }).first();
    await expect(timeInput).toBeVisible();
    await timeInput.fill(timeToSet);

    // Save
    const saveBtn = page.getByRole('button', { name: 'Save' }).first();
    await expect(saveBtn).toBeVisible();
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/ServiceAppointments') && resp.request().method() === 'PUT', { timeout: 5000 }).catch(() => null),
      saveBtn.click()
    ]);

    // Wait briefly for UI to update
    await page.waitForTimeout(500);

    // Verify via API that an appointment exists with the requested local date/time
    const loginRes = await request.post('http://127.0.0.1:5000/api/Auth/login', { data: { username: FLEET_USERNAME, password: FLEET_PASSWORD } });
    expect(loginRes.ok()).toBeTruthy();
    const loginJson = await loginRes.json();
    const token = loginJson.token;
    const apires = await request.get('http://127.0.0.1:5000/api/ServiceAppointments', { headers: { Authorization: `Bearer ${token}` } });
    expect(apires.ok()).toBeTruthy();
    const apis = await apires.json();

    const found = apis.find((a: any) => {
      try {
        const d = new Date(a.appointmentDate);
        const y = String(d.getFullYear()).padStart(4, '0');
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const apiDate = `${y}-${mo}-${da}`;
        const apiTime = `${hh}:${mm}`;
        return apiDate === dateToSet && apiTime === timeToSet;
      } catch (e) {
        return false;
      }
    });
    expect(found, 'Updated appointment not found in API').toBeTruthy();

    // Verify UI reflects updated date (rough check: meta contains the entered day)
    const firstMeta = page.locator('.appointment-card').first().locator('.meta');
    const enteredDay = String(Number(dateToSet.split('-')[2]));
    await expect(firstMeta).toContainText(enteredDay);

  } catch (err) {
    // capture debugging artifacts then rethrow to fail the test
    try { await page.screenshot({ path: 'test-failure-edit-appointment.png', fullPage: true }); } catch {}
    try { const html = await page.content(); require('fs').writeFileSync('test-failure-edit-appointment.html', html); } catch {}
    throw err;
  }
});