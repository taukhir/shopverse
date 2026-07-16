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

  await page.getByRole('button', { name: /place order/i }).click();
  await expect(page.getByRole('heading', { name: /transaction receipt/i })).toBeVisible();
  await expect(page.locator('.receipt').getByText('WEB-ORD-9001', { exact: true })).toBeVisible();
  await expect(page.getByText(/txn-WEB-ORD-9001/i)).toBeVisible();
  await expect(page.getByText(/idempotency key/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /view order history/i })).toBeVisible();
});

test('customer order history exposes timeline and current payment state', async ({ page }) => {
  await mockShopverseApis(page);
  await signIn(page);

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
  await expect(page.getByText('Inventory health')).toBeVisible();

  await page.getByRole('link', { name: 'Activity' }).click();
  await expect(page.getByText('/api/v1/admin/audit-events')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ORDER_PACKED' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'RESERVATION_RELEASED' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'PAYMENT_CAPTURED' })).toBeVisible();
});
