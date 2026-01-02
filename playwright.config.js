import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  reporter: [['html', { open: 'never' }]],
  use: {
    video: 'retain-on-failure',
  },
});
