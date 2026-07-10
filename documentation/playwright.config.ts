import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {baseURL: 'http://127.0.0.1:3000/shopverse/', trace: 'retain-on-failure'},
  projects: [
    {name: 'desktop-chromium', use: {...devices['Desktop Chrome']}},
    {name: 'mobile-chromium', use: {...devices['Pixel 7']}},
  ],
  webServer: {command: 'npm run serve -- --host 127.0.0.1 --port 3000', url: 'http://127.0.0.1:3000/shopverse/', reuseExistingServer: !process.env.CI, timeout: 120_000},
});
