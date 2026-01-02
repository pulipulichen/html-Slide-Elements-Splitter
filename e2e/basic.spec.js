import { test, expect } from '@playwright/test';

test('should load the page and show the correct title', async ({ page }) => {
  // We will serve the current directory using a simple web server in Docker
  await page.goto('http://localhost:8080');

  // Check if "智慧圖片裁切" is visible
  const title = page.locator('h1');
  await expect(title).toContainText('智慧圖片裁切');

  // Check for console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Reload or wait a bit to ensure all scripts are loaded and checked
  await page.waitForLoadState('networkidle');
  
  expect(consoleErrors).toHaveLength(0);
});
