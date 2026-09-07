import { test, expect } from '@playwright/test';
test('EmojiAlternative', async ({ page }) => {
    await page.goto('./tests/EmojiAlternative.html');
    await page.waitForTimeout(2000);
    const editor = page.locator('#target');
    await expect(editor).toHaveAttribute('mark', 'good');
});
