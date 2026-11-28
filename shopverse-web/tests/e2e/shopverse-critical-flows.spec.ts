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

test('catalog imagery and product cards stay aligned across desktop and mobile', async ({ page }) => {
  await page.goto('/products');
  const cards = page.locator('.product-card');
  await expect(cards).toHaveCount(3);
  await expect.poll(async () => cards.locator('img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);

  const desktopHeights = await cards.evaluateAll((elements) => elements.map((element) => Math.round(element.getBoundingClientRect().height)));
  expect(Math.max(...desktopHeights) - Math.min(...desktopHeights)).toBeLessThanOrEqual(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => cards.first().evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBeLessThanOrEqual(358);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Compare Wireless Keyboard' }).click();
  await page.getByRole('button', { name: 'Compare USB-C Dock' }).click();
  await page.getByRole('link', { name: /compare 2 products/i }).click();
  const compareImages = page.getByRole('table', { name: 'Product comparison' }).locator('img');
  await expect.poll(async () => compareImages.evaluateAll((images) => images.length === 2 && images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
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

test('customer compares current product details and keeps selection after refresh', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('button', { name: 'Compare Wireless Keyboard' }).click();
  await page.getByRole('button', { name: 'Compare USB-C Dock' }).click();
  await page.getByRole('link', { name: /compare 2 products/i }).click();

  const comparison = page.getByRole('table', { name: 'Product comparison' });
  await expect(comparison).toContainText('Wireless Keyboard');
  await expect(comparison).toContainText('USB-C Dock');
  await expect(page.getByRole('row', { name: /price/i })).toContainText('₹2,499');

  await page.reload();
  await expect(page.getByRole('table', { name: 'Product comparison' })).toContainText('USB-C Dock');
  await page.getByRole('button', { name: 'Remove USB-C Dock from comparison' }).click();
  await expect(page.getByRole('table', { name: 'Product comparison' })).not.toContainText('USB-C Dock');
});

test('recently viewed products return on the storefront and can be cleared', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('link', { name: /view wireless keyboard/i }).click();
  await expect(page.getByRole('heading', { name: 'Wireless Keyboard' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('shopverse.recently-viewed.v1'))).toBe('[101]');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Recently viewed.' })).toBeVisible();
  await expect(page.getByRole('link', { name: /wireless keyboard/i })).toBeVisible();
  await page.getByRole('button', { name: 'Clear history' }).click();
  await expect(page.getByRole('heading', { name: 'Recently viewed.' })).toHaveCount(0);
});

test('admin can open overview and durable activity across order, inventory, and payment areas', async ({ page }) => {
  await signIn(page, 'admin');
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole('heading', { name: /system at a glance/i })).toBeVisible();
  await expect(page.getByText(/inventory health/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Operational analytics.' })).toBeVisible();
  await expect(page.getByText('Average order value')).toBeVisible();
  await expect(page.getByText('Payment capture rate')).toBeVisible();
  await expect(page.getByText('Catalog availability')).toBeVisible();
  await expect(page.getByText(/client calculated/i)).toBeVisible();

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
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');

  await page.getByRole('button', { name: 'Menu' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Close' })).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('link', { name: 'Users' }).click();
  await expect(page).toHaveURL(/\/admin\/users/);
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflows).toBe(false);
});

test('storefront mobile navigation closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const menuButton = page.getByRole('button', { name: 'Menu' });
  await menuButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
});

test('customer can save products and restore them after refresh', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('button', { name: 'Save Wireless Keyboard for later' }).click();
  await expect(page.getByRole('button', { name: 'Remove Wireless Keyboard from saved items' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: 'Saved 1' })).toBeVisible();

  await page.getByRole('link', { name: 'Saved 1' }).click();
  await expect(page).toHaveURL(/\/saved$/);
  await expect(page.getByRole('heading', { name: 'Wireless Keyboard' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Wireless Keyboard' })).toBeVisible();

  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByRole('heading', { name: 'Keep a few favorites in view.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Saved 0' })).toBeVisible();
});
