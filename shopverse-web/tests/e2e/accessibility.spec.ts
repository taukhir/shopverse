import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { mockShopverseApis, signIn } from './fixtures/shopverse-api';

const routes = [
  { path: '/', label: 'home' },
  { path: '/products', label: 'catalog' },
  { path: '/products/101', label: 'product details' },
  { path: '/cart', label: 'cart' },
  { path: '/login', label: 'login' },
  { path: '/register', label: 'registration' },
  { path: '/saved', label: 'saved products' },
  { path: '/compare', label: 'product comparison' },
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
  await page.goto('/admin');
  results = await new AxeBuilder({ page }).exclude('img').analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);

  for (const path of ['/admin/activity', '/admin/inventory', '/admin/payments', '/admin/recovery', '/admin/reconciliation', '/admin/returns', '/admin/settings', '/admin/orders/9001', '/admin/users/1']) {
    await page.goto(path);
    results = await new AxeBuilder({ page }).exclude('img').analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), path).toEqual([]);
  }

  for (const path of ['/admin/access-control', '/admin/groups', '/unauthorized']) {
    await page.goto(path);
    results = await new AxeBuilder({ page }).exclude('img').analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), path).toEqual([]);
  }
});

test('checkout, order history, and order details have no serious accessibility violations', async ({ page }) => {
  await signIn(page);
  for (const path of ['/checkout', '/orders', '/orders/9001', '/notifications']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).exclude('img').analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), path).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/account', '/checkout', '/orders', '/orders/9001', '/notifications']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).exclude('img').analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), `${path} at 390px`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${path} should not overflow at 390px`).toBeLessThanOrEqual(390);
  }
});

test('login and storefront navigation remain accessible at a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/login', '/', '/saved', '/compare']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).exclude('img').analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), path).toEqual([]);
  }
});

test('recently viewed products remain accessible after browsing', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('link', { name: /view wireless keyboard/i }).click();
  await expect(page.getByRole('heading', { name: 'Wireless Keyboard' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('shopverse.recently-viewed.v1'))).toBe('[101]');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Recently viewed.' })).toBeVisible();
  const results = await new AxeBuilder({ page }).exclude('img').analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('product comparison remains accessible and contained at a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/products');
  await page.getByRole('button', { name: 'Compare Wireless Keyboard' }).click();
  await page.getByRole('button', { name: 'Compare USB-C Dock' }).click();
  await page.getByRole('link', { name: /compare 2 products/i }).click();
  await expect(page.getByRole('table', { name: 'Product comparison' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const results = await new AxeBuilder({ page }).exclude('img').analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('dense admin pages remain accessible and fit a mobile viewport', async ({ page }) => {
  await signIn(page, 'admin');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/admin', '/admin/orders', '/admin/users', '/admin/activity', '/admin/inventory', '/admin/payments', '/admin/recovery', '/admin/reconciliation', '/admin/returns', '/admin/settings', '/admin/orders/9001', '/admin/users/1', '/admin/access-control', '/admin/groups']) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${path} should not overflow the viewport`).toBeLessThanOrEqual(390);
    const results = await new AxeBuilder({ page }).exclude('img').analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), path).toEqual([]);
  }
});
