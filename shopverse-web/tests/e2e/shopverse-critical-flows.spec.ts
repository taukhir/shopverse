import { expect, test } from '@playwright/test';

import { mockShopverseApis, signIn } from './fixtures/shopverse-api';

test.beforeEach(async ({ page }) => {
  await mockShopverseApis(page);
});

test('customer can browse, persist cart after refresh, checkout, and see receipt details', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /shop like the system/i })).toBeVisible();

  await page.getByRole('link', { name: /browse collection/i }).click();
  await expect(page.getByRole('heading', { name: /the essentials/i })).toBeVisible();
  await expect(page.getByText('Wireless Keyboard')).toBeVisible();

  await page.getByRole('button', { name: /add to cart/i }).first().click();
  await expect(page.getByRole('link', { name: /cart 1/i })).toBeVisible();

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Cart (1)' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Wireless Keyboard')).toBeVisible();

  await page.getByRole('link', { name: /continue to checkout/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await signIn(page);
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByText(/Customer One/).first()).toBeVisible();

  await page.getByRole('button', { name: /review order/i }).click();
  await page.getByRole('button', { name: /place order/i }).click();
  await expect(page.getByRole('heading', { name: /transaction receipt/i })).toBeVisible();
  await expect(page.locator('.receipt').getByText('WEB-ORD-9001', { exact: true })).toBeVisible();
  await expect(page.getByText(/txn-WEB-ORD-9001/i)).toBeVisible();
  await expect(page.getByText(/idempotency key/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /view order history/i })).toBeVisible();
});

test('customer order history exposes timeline and current payment state', async ({ page }) => {
  await mockShopverseApis(page);
  await page.goto('/login');
  await signIn(page);
  await expect(page).not.toHaveURL(/\/login/);

  await page.goto('/orders');
  await expect(page.getByRole('heading', { name: /order history/i })).toBeVisible();
  await page.getByText('WEB-ORD-9001').click();

  await expect(page.getByText('ORDER TIMELINE')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Order Confirmed' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Payment Captured' })).toBeVisible();
});

test('admin can open overview and durable activity across order, inventory, and payment areas', async ({ page }) => {
  await signIn(page, 'admin');
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole('heading', { name: /system at a glance/i })).toBeVisible();
  await expect(page.getByText(/inventory health/i)).toBeVisible();

  await page.getByRole('link', { name: 'Activity' }).click();
  await expect(page.getByText(/Showing durable, server-paged audit records/)).toBeVisible();
  const activityRows = page.locator('.activity-table tbody tr');
  await expect(activityRows.filter({ hasText: 'ORDER_PACKED' })).toBeVisible();
  await expect(activityRows.filter({ hasText: 'RESERVATION_RELEASED' })).toBeVisible();
  await expect(activityRows.filter({ hasText: 'PAYMENT_CAPTURED' })).toBeVisible();
});

test('admin orders use server filters and paging with keyboard controls on a narrow screen', async ({ page }) => {
  await signIn(page, 'admin');
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto('/admin/orders');
  await expect(page.getByRole('heading', { name: 'Order operations.' })).toBeVisible();
  await expect(page.getByText('1-8 of 17')).toBeVisible();
  await expect(page.getByText('ADM-ORD-0001')).toBeVisible();
  await expect(page.getByText('ADM-ORD-0009')).toHaveCount(0);

  const nextButton = page.getByRole('button', { name: 'Next page' });
  await nextButton.focus();
  await expect(nextButton).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('9-16 of 17')).toBeVisible();
  await expect(page.getByText('ADM-ORD-0009')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByPlaceholder('Order number or customer')).toBeVisible();
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflows).toBe(false);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/admin-orders-mobile-verification.png' });

  const search = page.getByPlaceholder('Order number or customer');
  await search.fill('ADM-ORD-0017');
  await search.press('Enter');
  await expect(page.getByText('ADM-ORD-0017')).toBeVisible();
  await expect(page.getByText('1-1 of 1')).toBeVisible();
});

test('admin mobile navigation opens with the keyboard and closes after route selection', async ({ page }) => {
  await signIn(page, 'admin');
  await expect(page).not.toHaveURL(/\/login/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/orders');

  await page.getByRole('button', { name: 'Menu' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Close' })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
  await page.getByRole('link', { name: 'Users' }).click();
  await expect(page).toHaveURL(/\/admin\/users/);
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflows).toBe(false);
});
