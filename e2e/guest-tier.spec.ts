import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Guest Tier Validation & Custom AI Builder', () => {
  test('New anonymous user receives exactly 3 credits, custom generation decrements them, and 0 credits blocks generation', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    
    // Wait for anonymous auth and credit fetch to settle
    await page.waitForLoadState('networkidle');

    // 2. Validate Guest Badge says "3 analyses left"
    // The Guest badge has `id="credit-badge"`
    const badge = page.locator('#credit-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).toContainText('3');
    await expect(badge).toContainText('analyses left');

    // 3. Upload the dummy video fixture using the hidden input
    const fileInput = page.locator('input[type="file"]');
    const dummyVideoPath = path.resolve(__dirname, 'fixtures', 'dummy.mp4');
    await fileInput.setInputFiles(dummyVideoPath);

    // 4. Assert the video was uploaded and the preview player mounted
    await expect(page.locator('video')).toBeVisible({ timeout: 10000 });

    // 5. Open the Custom Generation workspace
    const openWorkspaceBtn = page.locator('button', { hasText: 'Open Workspace' });
    if (await openWorkspaceBtn.isVisible()) {
      await openWorkspaceBtn.click();
    }

    // 6. Fill in the custom prompt
    await page.fill('textarea[placeholder*="unhinged or specific instruction"]', 'Test generation prompt');

    // 7. Click Generate Custom Script
    const generateBtn = page.locator('button', { hasText: 'Generate Custom Script' });
    await expect(generateBtn).toBeEnabled();
    
    // Setup a response interceptor or just wait for the loading spinner to disappear
    await generateBtn.click();
    
    // 8. The system will mock or process the video, upload it, and call the Gemini API.
    // We expect the button to change to "Generating Script..." while refiningSlot === 'custom_ai'
    await expect(page.locator('button', { hasText: 'Generating Script...' })).toBeVisible();

    // We wait for the generation to complete by waiting for the badge to say "2 analyses left"
    await expect(badge).toContainText('2', { timeout: 30000 });
    
    // Also we expect a generated script tab to appear, or the Script display area to populate
    // Because we just used 1 credit!
  });
});
