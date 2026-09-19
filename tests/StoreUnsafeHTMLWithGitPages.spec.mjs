import { test, expect } from '@playwright/test';
test('StoreUnsafeHTMLWithGitPages', async ({ page }) => {
    await page.goto('./tests/StoreUnsafeHTMLWithGitPages.html');
    await page.waitForTimeout(2500);
    const target = page.locator('#target');
    await expect(target).toHaveAttribute('mark', 'good');
});
