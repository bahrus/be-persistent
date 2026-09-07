import { test, expect } from '@playwright/test';
test('StoreToGist', async ({ page }) => {
    await page.goto('./tests/StoreToGist.html');
    await page.waitForTimeout(2500);
    const target = page.locator('#target');
    await expect(target).toHaveAttribute('mark', 'good');
});
