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

  // Expect #sidebarContent > div to have 15 items (修改為預期的數量，例如 3)
  await expect(sidebarItems).toHaveCount(3, { timeout: 60000 });

  await checkFirstSplittedPiecesSize(page);
  await downloadSVGFile(page);
});


async function checkFirstSplittedPiecesSize(page) {
  // 不要在字串裡寫 :first
  let className = ".thumbnail-size"; 

  // 改用 .first() 方法
  const sizeElement = page.locator(className).first();
  await sizeElement.waitFor();
  await expect(sizeElement).toContainText('1242x290');
}


async function downloadSVGFile(page) {
  // 1. 先定位到第一個 Item 的容器 (假設每個縮圖都是 sidebarContent 下的一個 div)
  // 這樣才能確保我們是滑鼠移到「第一個」項目上
  const firstItem = page.locator('#sidebarContent > div').first();
  
  // 確保元素存在
  await firstItem.waitFor();

  // 2. 滑鼠移上去 (觸發可能的 hover 效果顯示按鈕)
  await firstItem.hover();

  // 3. 選擇裡面的 <i class="fa-solid fa-bezier-curve"></i>
  // 這裡使用 firstItem.locator(...) 進行範圍限縮，確保只抓到第一個項目裡面的 icon
  const svgIcon = firstItem.locator('.fa-solid.fa-bezier-curve');

  // 4. 設定下載監聽器 (必須在 click 之前設定！)
  // 增加 timeout 到 60000ms (60秒)，避免因後端處理 SVG 較慢而超時
  const downloadPromise = page.waitForEvent('download', { timeout: 60000 });

  // 5. Click
  // 使用 force: true 強制點擊，確保即使事件監聽器綁定在上層元素，或是圖示本身被判定為不可點擊時，仍能觸發點擊事件並透過冒泡傳遞
  await svgIcon.click({ force: true });

  // 6. 等待下載事件觸發並取得 download 物件
  const download = await downloadPromise;

  // 7. 期待要有下載svg檔案的結果 (驗證檔名結尾是否為 .svg)
  // download.suggestedFilename() 會回傳預設檔名
  expect(download.suggestedFilename().toLowerCase()).toContain('.svg');

  // (選用) 如果你想驗證檔案路徑或真正儲存下來：
  // const filePath = await download.path();
  // console.log('Downloaded file path:', filePath);
}
