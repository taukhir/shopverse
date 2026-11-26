import { expect, test } from '@playwright/test';

import { mockShopverseApis, signIn } from './fixtures/shopverse-api';

test('two-item checkout submits all lines and keeps the idempotency key stable on retry', async ({ page }) => {
  await mockShopverseApis(page, { failFirstPlaceOrder: true });
  await page.goto('/products');
  const addButtons = page.getByRole('button', { name: /add to cart/i });
  await addButtons.nth(0).click();
  await addButtons.nth(1).click();
  await page.goto('/checkout');
  await expect(page).toHaveURL(/\/login/);
  await signIn(page);
  await page.waitForURL(/\/checkout/);
  await expect(page.getByText('2 items')).toBeVisible();
  await page.getByRole('button', { name: /review order/i }).click();
  await expect(page.getByText('Wireless Keyboard')).toBeVisible();
  await expect(page.getByText('USB-C Dock')).toBeVisible();

  const placeOrder = page.waitForRequest((request) => request.url().includes('/place-order'));
  await page.getByRole('button', { name: /place order/i }).click();
  const firstRequest = await placeOrder;
  const firstKey = firstRequest.headers()['idempotency-key'];
  await expect(page.getByRole('button', { name: /place order/i })).toBeEnabled();
  const retryRequest = page.waitForRequest((request) => request.url().includes('/place-order'));
  await page.getByRole('button', { name: /place order/i }).click();
  const secondRequest = await retryRequest;
  expect(secondRequest.headers()['idempotency-key']).toBe(firstKey);
  await expect(page.getByRole('heading', { name: /transaction receipt/i })).toBeVisible();
  await expect(page.locator('.receipt').getByText('USB-C Dock')).toBeVisible();
  expect(firstKey).toBeTruthy();
});

test('account address is read back after save and remains visible after reload', async ({ page }) => {
  await mockShopverseApis(page);
  await page.goto('/login');
  await signIn(page);
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: /good to see you/i })).toBeVisible();
  await page.getByLabel('First name', { exact: true }).fill('Amina');
  await page.getByRole('button', { name: /save account details/i }).click();
  await expect(page.getByRole('status').getByText('Account details updated.')).toBeVisible();
  await page.getByLabel('Label', { exact: true }).fill('Office');
  await page.getByLabel('Line 1', { exact: true }).fill('99 Test Road');
  await page.getByLabel('City', { exact: true }).fill('Mysuru');
  await page.getByLabel('State', { exact: true }).fill('Karnataka');
  await page.getByLabel('Postal code', { exact: true }).fill('570001');
  await expect(page.getByLabel('Make this the default delivery address')).not.toBeChecked();
  const addressSave = page.waitForRequest((request) => request.url().includes('/addresses') && request.method() === 'POST');
  await page.getByRole('button', { name: 'Add address' }).click();
  expect((await addressSave).postDataJSON()).toMatchObject({ defaultAddress: false });
  await expect(page.getByRole('heading', { name: 'Office' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /good to see you, amina/i })).toBeVisible();
  await expect(page.getByText('99 Test Road')).toBeVisible();
});

test('public account registration sends its request through the configured User Service route', async ({ page }) => {
  await mockShopverseApis(page);
  await page.goto('/register');
  await page.getByLabel('First name').fill('Test');
  await page.getByLabel('Last name').fill('Customer');
  await page.getByLabel('Username').fill('test.customer');
  await page.getByLabel('Email').fill('test.customer@example.test');
  await page.getByLabel('Phone').fill('+910000000099');
  await page.getByLabel('Password').fill('Shopverse@123');
  const registration = page.waitForRequest((request) => request.url().includes('/api/v1/public/users/register'));
  await page.getByRole('button', { name: /create account/i }).click();
  const request = await registration;
  expect(request.method()).toBe('POST');
  expect(request.postDataJSON()).toMatchObject({ username: 'test.customer', email: 'test.customer@example.test' });
  await expect(page.locator('.form-message.success')).toContainText('Account created.');
});

test('notification center shows real recent order states with a link to each order', async ({ page }) => {
  await mockShopverseApis(page);
  await page.goto('/login');
  await signIn(page);
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto('/notifications');

  await expect(page.getByRole('heading', { name: 'Order activity.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Confirmed' })).toBeVisible();
  await expect(page.getByRole('link', { name: /view details/i })).toHaveAttribute('href', '/orders/9001');
  await expect(page.getByText(/unread tracking and delivery preferences are not available yet/i)).toBeVisible();
});

test('admin order details render every reservation from a list response', async ({ page }) => {
  await mockShopverseApis(page);
  await page.goto('/login');
  await signIn(page, 'admin');
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto('/admin/orders');
  await expect(page.getByRole('heading', { name: /order operations/i })).toBeVisible();
  await page.getByRole('link', { name: /WEB-ORD-9001/ }).click();
  await expect(page.getByText('2 reservation(s)')).toBeVisible();
  await expect(page.getByText('Product 101 / Qty 1 / RESERVED')).toBeVisible();
  await expect(page.getByText('Product 102 / Qty 2 / RESERVED')).toBeVisible();
});

test('admin can open role, group, reconciliation and read-only return workspaces', async ({ page }) => {
  await mockShopverseApis(page);
  await page.goto('/login');
  await signIn(page, 'admin');
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto('/admin/access-control');
  await expect(page.getByRole('heading', { name: /roles & permissions/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ROLE_CUSTOMER' })).toBeVisible();

  await page.goto('/admin/groups');
  await expect(page.getByRole('heading', { name: 'Groups' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Operations 1 members/i })).toBeVisible();

  await page.goto('/admin/reconciliation');
  await expect(page.getByRole('heading', { name: 'Reconciliation' })).toBeVisible();

  await page.goto('/admin/returns');
  await expect(page.getByRole('heading', { name: 'Returns & refunds' })).toBeVisible();
  await expect(page.getByText(/read-only/i)).toBeVisible();
});
