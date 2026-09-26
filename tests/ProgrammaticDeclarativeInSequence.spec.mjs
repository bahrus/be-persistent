import { test, expect } from '@playwright/test';
test('ProgrammaticDeclarativeInSequence', async ({ page }) => {
    await page.goto('./tests/ProgrammaticDeclarativeInSequence.html');
    await page.waitForTimeout(2000);
    const target = page.locator('#target');
    await expect(target).toHaveAttribute('mark', 'good');
});
