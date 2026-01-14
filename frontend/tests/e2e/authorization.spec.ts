import { test, expect } from '@playwright/test';

test.describe('Authorization flows', () => {

  test('Admin can sign in and open Docs', async ({ page, baseURL }) => {
    await page.goto('/signin');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'Password123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/');

    // Nav should show Docs for admin
    const docsLink = page.locator('nav.site-nav >> a.nav-link', { hasText: 'Docs' });
    await expect(docsLink).toBeVisible();

    await docsLink.click();
    await page.waitForURL(/\/docs/);
    await expect(page.locator('h1')).toHaveText(/Getting Started/i);
  });

  test('Normal user is forbidden from /docs and sees toast + forbidden page', async ({ page }) => {
    const username = `e2e_user_${Date.now()}`;
    await page.goto('/signin');

    // Switch to register
    await page.getByText('Create an account').click();
    await page.fill('#username', username);
    await page.fill('#password', 'Password123!');
    await page.fill('#confirmPassword', 'Password123!');
    await page.getByRole('button', { name: 'Create account' }).click();

    // After registration auto-login should navigate home
    await page.waitForURL('/');

    // Docs should not be visible in nav
    await expect(page.locator('nav.site-nav')).not.toContainText('Docs');

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
    await page.goto('/signin');
    await page.getByText('Create an account').click();
    await page.fill('#username', username);
    await page.fill('#password', 'Password123!');
    await page.fill('#confirmPassword', 'Password123!');
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForURL('/');

    // Try go to /docs -> forbidden
    await page.goto('/docs');
    await page.waitForURL(/\/forbidden/);

    // Click Go Home
    await page.getByRole('button', { name: 'Go Home' }).click();
    await page.waitForURL('/');

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
