import { test, expect } from '@playwright/test';

test('should initialize language selector and html lang', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('http://localhost:8080');

  const languageSelect = page.locator('#languageSelect');
  await expect(languageSelect).toBeVisible();

  const selected = await languageSelect.inputValue();
  const htmlLang = await page.locator('html').getAttribute('lang');
  expect(htmlLang).toBe(selected);

  await page.waitForLoadState('networkidle');
  expect(consoleErrors).toHaveLength(0);
});

test('should switch to zh-TW and persist after reload', async ({ page }) => {
  await page.goto('http://localhost:8080');

  const languageSelect = page.locator('#languageSelect');
  await languageSelect.selectOption('zh-TW');

  await expect(page.locator('h1')).toContainText('智慧圖片裁切');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');

  const storedLanguage = await page.evaluate(() => localStorage.getItem('sc_language'));
  expect(storedLanguage).toBe('zh-TW');

  await page.reload();
  await expect(page.locator('#languageSelect')).toHaveValue('zh-TW');
  await expect(page.locator('h1')).toContainText('智慧圖片裁切');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
});
