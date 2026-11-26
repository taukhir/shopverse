import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { mockShopverseApis, signIn } from './fixtures/shopverse-api';

const routes = [
  { path: '/', label: 'home' },
  { path: '/products', label: 'catalog' },
  { path: '/cart', label: 'cart' },
  { path: '/login', label: 'login' },
  { path: '/register', label: 'registration' },
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

  for (const path of ['/admin/access-control', '/admin/groups']) {
    await page.goto(path);
    results = await new AxeBuilder({ page }).exclude('img').analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), path).toEqual([]);
  }
});

test('checkout, order history, and order details have no serious accessibility violations', async ({ page }) => {
  await signIn(page);
  for (const path of ['/checkout', '/orders', '/orders/9001']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).exclude('img').analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), path).toEqual([]);
  }
});

test('login and storefront navigation remain accessible at a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/login', '/']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).exclude('img').analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), path).toEqual([]);
  }
});

test('admin navigation remains accessible at a mobile viewport', async ({ page }) => {
  await signIn(page, 'admin');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/admin', '/admin/access-control', '/admin/groups']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).exclude('img').analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), path).toEqual([]);
  }
});
