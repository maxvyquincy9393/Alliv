import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('renders hero CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Swipe right');
    await expect(page.getByRole('link', { name: /Start swiping/i })).toBeVisible();
  });
});

