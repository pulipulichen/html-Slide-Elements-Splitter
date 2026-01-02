import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'playwright-report-videos',
  reporter: [['html', { open: 'never' }]],
  use: {
    // video: 'retain-on-failure',
    video: 'always',
  },
});
