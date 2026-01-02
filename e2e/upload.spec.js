import { test, expect } from '@playwright/test';
import path from 'path';

test('should upload PDF and show 15 items in sidebar', async ({ page }) => {
  await page.goto('http://localhost:8080');

  // Upload the PDF file
  // const filePath = path.resolve(__dirname, '../test/Healthkeep_八點體脂計入門指南.pdf');

  // console.log(`準備上傳檔案： ${filePath}`)
  const pdfUrlButton = page.locator('#pdfUrlButton');
  await pdfUrlButton.waitFor();
  await pdfUrlButton.click();

  // Wait for #sidebarContent > div to have data (up to 60 seconds)
  const sidebarItems = page.locator('#sidebarContent > div');
  await expect(sidebarItems.first()).toBeVisible({ timeout: 60000 });

  // Expect #sidebarContent > div to have 15 items
  await expect(sidebarItems).toHaveCount(3, { timeout: 60000 });

  await checkFirstSplittedPiecesSize(page)
});


async function checkFirstSplittedPiecesSize(page) {
  let className = "absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded backdrop-blur-sm pointer-events-none group-hover:opacity-0 transition-opacity"

  const sizeElement = page.locator(className);
  await sizeElement.waitFor();
  await expect(sizeElement).toContainText('1242x290');
}