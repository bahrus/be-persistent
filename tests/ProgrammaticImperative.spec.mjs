import { test, expect } from '@playwright/test';
test('ProgrammaticImperative', async ({ page }) => {
    await page.goto('./tests/ProgrammaticImperative.html');
    await page.waitForTimeout(2000);
    const target = page.locator('#target');
    await expect(target).toHaveAttribute('mark', 'good');
});
