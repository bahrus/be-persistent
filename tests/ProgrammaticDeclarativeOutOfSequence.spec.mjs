import { test, expect } from '@playwright/test';
test('ProgrammaticDeclarativeOutOfSequence', async ({ page }) => {
    await page.goto('./tests/ProgrammaticDeclarativeOutOfSequence.html');
    await page.waitForTimeout(2000);
    const target = page.locator('#target');
    await expect(target).toHaveAttribute('mark', 'good');
});
