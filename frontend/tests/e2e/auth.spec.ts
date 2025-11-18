import { test, expect } from '@playwright/test';

test('forgot password flow sends email (mock)', async ({ page }) => {
  // Go to login page
  await page.goto('http://localhost:5173/login');
  
  // Click forgot password link
  await page.click('text=Forgot password?');
  await expect(page).toHaveURL(/.*\/forgot-password/);
  
  // Fill in email - using standard selector fallback
  await page.fill('input[type="email"]', 'test@example.com');
  
  // Click submit
  await page.click('button:has-text("Send Reset Code")');
  
  // Expect success message
  await expect(page.locator('text=Verification code sent!')).toBeVisible();
});

