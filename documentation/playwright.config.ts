import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {baseURL: 'http://127.0.0.1:3000/shopverse/', trace: 'retain-on-failure'},
  projects: [
    {name: 'desktop-chromium', use: {...devices['Desktop Chrome']}},
    {name: 'mobile-chromium', use: {...devices['Pixel 7']}},
    {
      name: 'desktop-firefox',
      testMatch: /cross-browser-smoke\.spec\.ts/,
      use: {...devices['Desktop Firefox']},
    },
    {
      name: 'desktop-webkit',
      testMatch: /cross-browser-smoke\.spec\.ts/,
      use: {...devices['Desktop Safari']},
    },
  ],
  webServer: {command: 'npm run serve -- --host 127.0.0.1 --port 3000', url: 'http://127.0.0.1:3000/shopverse/', reuseExistingServer: !process.env.CI, timeout: 120_000},
});
