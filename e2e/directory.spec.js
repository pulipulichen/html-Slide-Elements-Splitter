import { test, expect } from '@playwright/test';

test('should browse images via fullscreen directory modal', async ({ page }) => {
  await page.goto('http://localhost:8080');

  const pdfUrlButton = page.locator('#pdfUrlButton');
  await pdfUrlButton.waitFor();
  await pdfUrlButton.click();

  const resultCards = page.locator('#resultsArea > div');
  await expect(resultCards).toHaveCount(3, { timeout: 60000 });

  const directoryModal = page.locator('#directoryModal');
  const thumbSizeValue = page.locator('#directoryThumbSizeValue');

  // Open directory modal by global hotkey.
  await page.keyboard.press('g');
  await expect(directoryModal).toBeVisible();

  const initialSize = parseInt((await thumbSizeValue.innerText()).replace('px', ''), 10);
  await page.keyboard.press('=');
  const increasedSize = parseInt((await thumbSizeValue.innerText()).replace('px', ''), 10);
  expect(increasedSize).toBeGreaterThan(initialSize);

  await page.keyboard.press('-');
  await expect(thumbSizeValue).toHaveText(`${initialSize}px`);

  const directoryThumbs = page.locator('#directoryModalBody section button');
  await expect(directoryThumbs).toHaveCount(3);

  const firstCard = resultCards.nth(0);
  const secondCard = resultCards.nth(1);
  const thirdCard = resultCards.nth(2);

  // Click the third thumbnail and ensure it jumps to the target card.
  await directoryThumbs.nth(2).click();

  await expect(directoryModal).toHaveClass(/hidden/);
  await expect(thirdCard).toBeInViewport();
  await expectActiveCardIndex(page, 2);

  // Verify global PageUp/PageDown navigation.
  await page.keyboard.press('PageUp');
  await expect(secondCard).toBeInViewport();
  await expectActiveCardIndex(page, 1);

  await page.keyboard.press('PageUp');
  await expect(firstCard).toBeInViewport();
  await expectActiveCardIndex(page, 0);

  await page.keyboard.press('PageDown');
  await expect(secondCard).toBeInViewport();
  await expectActiveCardIndex(page, 1);
});

async function expectActiveCardIndex(page, expectedIndex) {
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('#resultsArea > div'));
          const viewportTop = 0;
          const viewportBottom = window.innerHeight;
          let maxVisibleRatio = -1;
          let activeIndex = -1;

          cards.forEach((card, idx) => {
            const rect = card.getBoundingClientRect();
            const visibleHeight = Math.min(rect.bottom, viewportBottom) - Math.max(rect.top, viewportTop);
            const normalizedVisibleHeight = Math.max(0, visibleHeight);
            const ratio = normalizedVisibleHeight / Math.max(1, rect.height);
            if (ratio > maxVisibleRatio) {
              maxVisibleRatio = ratio;
              activeIndex = idx;
            }
          });

          return activeIndex;
        }),
      { timeout: 3000 }
    )
    .toBe(expectedIndex);
}
