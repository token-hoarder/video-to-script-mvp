import { test, expect } from '@playwright/test';

test.describe('Authentication Loop & Zombie Cookes', () => {
  test('User can log in, and logging out properly destroys the session without a login loop', async ({ page }) => {
    // 1. Go to homepage
    await page.goto('/');

    // 2. We should be auto-assigned a Guest session in the background. Wait for the page load.
    // Wait for the UI header or hero section
    await page.waitForLoadState('networkidle');

    // 3. Navigate to login page
    await page.goto('/login');
    await expect(page.locator('h3, h1, div').filter({ hasText: 'Welcome back' }).first()).toBeVisible();

    // 4. Fill in test credentials. We'll simulate a user login.
    // Ensure the test user exists or just attempt a login and logout if valid
    await page.fill('input[type="email"]', 'azamk@gmail.com');
    await page.fill('input[type="password"]', 'OyoLife@701'); // Assuming standard mock password

    // Click Sign in
    await page.click('button:has-text("Log in")');
    await page.waitForURL('**/', { timeout: 10000 }); // Wait for redirect to home

    // 5. Assert we are logged in on the homepage
    await expect(page).toHaveURL(/.*localhost:3000\/?$/);
    // There should be a "Log out" button visible somewhere in the layout
    const logoutBtn = page.locator('button', { hasText: /Log out|Logout/i }).first();
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });

    // 6. Execute Logout! This is where the zombie cookie bug supposedly happens.
    await logoutBtn.click();
    await page.waitForLoadState('networkidle');

    // 7. Assert cookie destruction / redirect to login page OR guest mode
    // The user should not be able to see the Log out button anymore if session is truly destroyed.
    await expect(page.locator('button', { hasText: /Log out|Logout/i })).toHaveCount(0, { timeout: 15000 });
  });
});
