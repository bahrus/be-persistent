import { test, expect } from '@playwright/test';
test('StoreToGitHubPages', async ({ page }) => {
    await page.goto('./tests/StoreToGitHubPages.html');
    await page.waitForTimeout(2500);
    const target = page.locator('#target');
    await expect(target).toHaveAttribute('mark', 'good');
});
