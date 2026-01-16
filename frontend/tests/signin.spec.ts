import { test, expect } from '@playwright/test';

// Use environment-provided password for strength checks to avoid exposing secrets
const FLEET_PASSWORD = process.env.FLEET_PASSWORD;
if (!FLEET_PASSWORD) throw new Error('FLEET_PASSWORD must be set in the environment for tests');

test('signin page shows brand, inputs, toggle and strength meter', async ({ page }) => {
  await page.goto('http://127.0.0.1:4200/signin');

  // Brand panel
  await expect(page.locator('.brand-link, .signin-panel .brand-link')).toBeVisible({ timeout: 3000 });

  // Username / password inputs
  const user = page.locator('input[formControlName="username"], #username');
  const pass = page.locator('input[formControlName="password"], #password');
  await expect(user).toBeVisible();
  await expect(pass).toBeVisible();

  // Create account toggle present (try selector first, then fallback to text)
  let toggle = page.locator('.auth-toggle');
  if ((await toggle.count()) === 0) toggle = page.locator('text=Create an account');
  await expect(toggle).toBeVisible();

  // Open registration view
  await toggle.click();
  await expect(page.locator('#confirmPassword, input[formControlName="confirmPassword"]')).toBeVisible();

  // Password strength meter appears when typing
  await pass.fill(FLEET_PASSWORD);
  const strengthFill = page.locator('.strength-fill');
  await expect(strengthFill).toBeVisible();

  // Toggle visibility buttons
  const pwToggle = page.locator('.pw-toggle').first();
  await expect(pwToggle).toBeVisible();
  await pwToggle.click();
  // after toggling, password input type should be text
  await expect(pass).toHaveAttribute('type', 'text');
});
