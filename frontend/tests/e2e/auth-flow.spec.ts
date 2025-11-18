import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test-user@example.com';
const TEST_PASSWORD = 'TestPass123!';

test.describe('Authentication UX', () => {
  test('shows backend message when login fails', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Please verify your email before logging in.' }),
      });
    });

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('********').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(
      page.getByText('Please verify your email before logging in.', { exact: false })
    ).toBeVisible();
  });

  test('forgot password flow shows success banner and navigates', async ({ page }) => {
    await page.route('**/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Reset code sent',
        }),
      });
    });

    await page.goto('/forgot-password');
    await page.getByPlaceholder('you@example.com').fill(TEST_EMAIL);
    await page.getByRole('button', { name: 'Send Reset Code' }).click();

    const successBanner = page.getByText('Verification code sent! Redirecting...', { exact: false });
    await expect(successBanner).toBeVisible();
    await page.waitForURL(/\/verify-reset-otp/, { timeout: 4000 });
    await expect(page).toHaveURL(/\/verify-reset-otp/);
  });

  test('forgot password surfaces backend errors', async ({ page }) => {
    await page.route('**/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'SMTP unavailable' }),
      });
    });

    await page.goto('/forgot-password');
    await page.getByPlaceholder('you@example.com').fill('unknown@example.com');
    await page.getByRole('button', { name: 'Send Reset Code' }).click();

    await expect(page.getByText('SMTP unavailable')).toBeVisible();
  });
});




