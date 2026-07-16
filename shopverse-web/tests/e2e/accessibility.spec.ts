import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { mockShopverseApis, signIn } from './fixtures/shopverse-api';

const routes = [
  { path: '/', label: 'home' },
  { path: '/products', label: 'catalog' },
  { path: '/cart', label: 'cart' },
];

test.beforeEach(async ({ page }) => {
  await mockShopverseApis(page);
});

for (const route of routes) {
  test(`${route.label} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page }).exclude('img').analyze();
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    expect(serious).toEqual([]);
  });
}

test('account and admin pages have no serious accessibility violations', async ({ page }) => {
  await signIn(page);
  await page.goto('/account');
  let results = await new AxeBuilder({ page }).exclude('img').analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);

  await signIn(page, 'admin');
  await page.goto('/admin/activity');
  results = await new AxeBuilder({ page }).exclude('img').analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});
