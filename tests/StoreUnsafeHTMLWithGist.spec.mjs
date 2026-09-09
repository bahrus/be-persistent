import { test, expect } from '@playwright/test';
test('StoreUnsafeHTMLWithGist', async ({ page }) => {
    await page.goto('./tests/StoreUnsafeHTMLWithGist.html');
    await page.waitForTimeout(2500);
    const target = page.locator('#target');
    await expect(target).toHaveAttribute('mark', 'good');
});
