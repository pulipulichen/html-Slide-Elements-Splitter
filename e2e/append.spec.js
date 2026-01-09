import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test('should append images when dropping files', async ({ page }) => {
  await page.goto('http://localhost:8080');

  // 1. Initial upload via PDF URL
  const pdfUrlButton = page.locator('#pdfUrlButton');
  await pdfUrlButton.waitFor();
  await pdfUrlButton.click();

  const sidebarItems = page.locator('#sidebarContent > div');
  await sidebarItems.first().waitFor();
  await expect(sidebarItems).toHaveCount(3, { timeout: 60000 });

  // 2. Drop an image file
  // Create a dummy image file for testing
  const filePath = path.resolve('test-image.png');
  // Just a tiny transparent PNG pixel
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(filePath, buffer);

  // Use dataTransfer to simulate drop
  const dataTransfer = await page.evaluateHandle(async ({filePath, buffer}) => {
    const dt = new DataTransfer();
    const file = new File([new Uint8Array(buffer)], 'test-image.png', { type: 'image/png' });
    dt.items.add(file);
    return dt;
  }, { filePath, buffer: Array.from(buffer) });

  await page.dispatchEvent('body', 'drop', { dataTransfer });

  // 3. Verify it's appended (3 + 1 = 4)
  await expect(sidebarItems).toHaveCount(4, { timeout: 60000 });

  // Cleanup
  fs.unlinkSync(filePath);
});

test('should append images when pasting files', async ({ page }) => {
    await page.goto('http://localhost:8080');
  
    // 1. Initial upload via PDF URL
    const pdfUrlButton = page.locator('#pdfUrlButton');
    await pdfUrlButton.waitFor();
    await pdfUrlButton.click();
  
    const sidebarItems = page.locator('#sidebarContent > div');
    await sidebarItems.first().waitFor();
    await expect(sidebarItems).toHaveCount(3, { timeout: 60000 });
  
    // 2. Paste an image
    await page.evaluate(async () => {
      const buffer = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), c => c.charCodeAt(0));
      const file = new File([buffer], 'pasted-image.png', { type: 'image/png' });
      const event = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer()
      });
      event.clipboardData.items.add(file);
      window.dispatchEvent(event);
    });
  
    // 3. Verify it's appended (3 + 1 = 4)
    await expect(sidebarItems).toHaveCount(4, { timeout: 60000 });
});
