import { test, expect } from '@playwright/test';
test('ProgrammaticStore', async ({ page }) => {
    await page.goto('./tests/ProgrammaticStore.html');
    await page.waitForTimeout(2000);
    const target = page.locator('#target');
    await expect(target).toHaveAttribute('mark', 'good');
});
