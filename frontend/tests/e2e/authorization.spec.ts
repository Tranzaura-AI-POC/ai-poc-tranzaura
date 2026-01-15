import { test, expect } from '@playwright/test';

test.describe('Authorization flows', () => {

  test('Admin can sign in and open Docs', async ({ page, baseURL }) => {
    await page.goto('/signin');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForLoadState('networkidle');

    // Nav should show Docs for admin (wait for app to render)
    const docsLink = page.locator('nav.site-nav >> a.nav-link', { hasText: 'Docs' });
    await expect(docsLink).toBeVisible({ timeout: 10000 });

    await docsLink.click();
    await page.waitForURL(/\/docs/);
    await expect(page.locator('h1')).toHaveText(/Getting Started/i);
  });

  test('Normal user is forbidden from /docs and sees toast + forbidden page', async ({ page }) => {
    const username = `e2e_user_${Date.now()}`;
    // Instead of creating a real DB user, inject a locally-signed token into localStorage
    // so tests do not persist users in the database.
    await page.goto('/signin');
    // create a fake JWT payload and set it directly (client only - no DB write)
    const token = (() => {
      const header = { alg: 'none', typ: 'JWT' };
      const now = Math.floor(Date.now() / 1000);
      const payload = { sub: String(now), name: username, roles: ['User'], iat: now, exp: now + 60 * 60 };
      const toBase64 = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      return `${toBase64(header)}.${toBase64(payload)}.`;
    })();
    await page.evaluate((t) => localStorage.setItem('fleet_token', t), token);
    // reload so the app picks up the auth state
    await page.reload();

    // Docs should not be visible in nav
    await expect(page.locator('nav.site-nav')).not.toContainText('Docs', { timeout: 10000 });

    // Attempt direct navigation to /docs
    await page.goto('/docs');
    // Should redirect to forbidden page
    await page.waitForURL(/\/forbidden/);
    await expect(page.locator('h1')).toHaveText(/Access Denied/i);

    // Toast with access denied message should appear
    await expect(page.locator('.toast', { hasText: 'Access denied' })).toBeVisible({ timeout: 5000 });
  });

  test('Forbidden page actions: Go Home and Sign Out', async ({ page }) => {
    const username = `e2e_user2_${Date.now()}`;
    // Avoid creating DB user - inject a local token representing a normal user
    await page.goto('/signin');
    const token = (() => {
      const header = { alg: 'none', typ: 'JWT' };
      const now = Math.floor(Date.now() / 1000);
      const payload = { sub: String(now), name: username, roles: ['User'], iat: now, exp: now + 60 * 60 };
      const toBase64 = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      return `${toBase64(header)}.${toBase64(payload)}.`;
    })();
    await page.evaluate((t) => localStorage.setItem('fleet_token', t), token);
    await page.reload();

    // Try go to /docs -> forbidden
    await page.goto('/docs');
    await page.waitForURL(/\/forbidden/);

    // Click Go Home
    await page.getByRole('button', { name: 'Go Home' }).click();
    await page.waitForLoadState('networkidle');

    // Go back to /docs to get to forbidden again
    await page.goto('/docs');
    await page.waitForURL(/\/forbidden/);

    // Click Sign Out on forbidden page
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await page.waitForURL('/signin');
    // Sign-in form should be visible again
    await expect(page.locator('#username')).toBeVisible();
  });

});
