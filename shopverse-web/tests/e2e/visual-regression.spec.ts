import { expect, test } from '@playwright/test';

import { mockShopverseApis, signIn } from './fixtures/shopverse-api';

test.skip(!process.env.VISUAL_REGRESSION, 'Run with VISUAL_REGRESSION=1 or npm run visual:update to maintain baselines.');

test.beforeEach(async ({ page }) => {
  await mockShopverseApis(page);
});

test('home page visual snapshot', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('shopverse-home.png', { fullPage: true });
});

test('catalog visual snapshot', async ({ page }) => {
  await page.goto('/products');
  await expect(page).toHaveScreenshot('shopverse-catalog.png', { fullPage: true });
});

test('admin activity visual snapshot', async ({ page }) => {
  await signIn(page, 'admin');
  await page.goto('/admin/activity');
  await expect(page).toHaveScreenshot('shopverse-admin-activity.png', { fullPage: true });
});
