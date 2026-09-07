import { test, expect } from '@playwright/test';
test('Nudge', async ({ page }) => {
    await page.goto('./tests/Nudge.html');
    await page.waitForTimeout(2000);
    // `be-persistent-nudge` clears `disabled` after hydration...
    await expect(page.locator('#subject')).toBeEnabled();
    // ...but only when opted in.
    await expect(page.locator('#control')).toBeDisabled();
});
