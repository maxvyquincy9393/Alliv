import { test, expect } from '@playwright/test';

const testUser = {
  email: 'kabags496@gmail.com',
  password: 'Bagas1218',
};

const mockDiscoverPayload = {
  users: [
    {
      id: 'mock-creator',
      name: 'Nova Lumen',
      bio: 'Vision-driven collaborator available for rapid testing.',
      avatar: 'https://i.pravatar.cc/150?img=54',
      skills: ['React', 'Branding', 'Motion'],
      location: { city: 'Jakarta', lat: -6.2, lon: 106.8 },
      distance: 4,
      isOnline: true,
      compatibility: 92,
    },
  ],
};

test.describe('End-to-end collaboration flow', () => {
  test('landing → login → swipe → chat → discover', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.route('**/api/auth/login', async (route, request) => {
      const body = JSON.parse(request.postData() ?? '{}');
      expect(body.email).toBe(testUser.email);
      expect(body.password).toBe(testUser.password);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-access',
          refreshToken: 'mock-refresh',
          user: {
            id: 'user-kabags',
            email: body.email,
            name: 'Bagas Collaboration',
            emailVerified: true,
            profileComplete: true,
          },
        }),
      });
    });

    for (const pattern of ['**/api/discover/online**', '**/api/discover/nearby**']) {
      await page.route(pattern, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockDiscoverPayload),
        });
      });
    }

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Verify talent');
    await expect(page.getByRole('link', { name: 'Create profile' })).toBeVisible();

    await page.getByRole('link', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByPlaceholder('you@example.com').fill(testUser.email);
    await page.getByPlaceholder('********').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/home/);
    await expect(page.getByRole('button', { name: 'AI Insights' })).toBeVisible();

    await page.evaluate(() => {
      const originalRandom = Math.random;
      (window as any).__origRandom = originalRandom;
      Math.random = () => 0.95;
      window.setTimeout(() => {
        Math.random = originalRandom;
      }, 5000);
    });

    await page.getByRole('button', { name: /Send a quick hello/i }).click();
    await expect(page.getByRole('heading', { name: "It's a Match!" })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Send Message' }).click();

    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByText('No Active Room')).toBeVisible();

    await page.getByRole('button', { name: 'Find Friends' }).first().click();
    await expect(page).toHaveURL(/\/discover/);

    await expect(page.getByText('Minimal radar, max function')).toBeVisible();
    const discoverCard = page.getByText('Nova Lumen').first();
    await expect(discoverCard).toBeVisible();
    await page.getByPlaceholder('Search by name, skill, or city').fill('Nova');
    await expect(discoverCard).toBeVisible();
  });
});

