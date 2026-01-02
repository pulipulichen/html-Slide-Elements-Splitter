import { test, expect } from '@playwright/test';
import path from 'path';

test('should upload PDF and show 15 items in sidebar', async ({ page }) => {
  await page.goto('http://localhost:8080');

  // Upload the PDF file
  const filePath = path.resolve(process.cwd(), 'test/Healthkeep_八點體脂計入門指南.pdf');

  console.log(`準備上傳檔案： ${filePath}`)
  const fileInput = page.locator('#fileInput');
  await fileInput.waitFor();
  await fileInput.setInputFiles(filePath);

  // Wait for #sidebarContent > div to have data (up to 60 seconds)
  const sidebarItems = page.locator('#sidebarContent > div');
  await expect(sidebarItems.first()).toBeVisible({ timeout: 60000 });

  // Expect #sidebarContent > div to have 15 items
  await expect(sidebarItems).toHaveCount(15, { timeout: 60000 });
});
