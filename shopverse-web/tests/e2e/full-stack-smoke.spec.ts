import { expect, test } from '@playwright/test';

test.skip(!process.env.SHOPVERSE_FULL_STACK, 'Requires a real Shopverse stack and SHOPVERSE_FULL_STACK=1.');

test('real stack renders storefront, catalog, login, and admin overview', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /shop like the system/i })).toBeVisible();

  await page.getByRole('link', { name: /browse collection/i }).click();
  await expect(page.getByRole('heading', { name: /the essentials/i })).toBeVisible();
  await expect(page.locator('.product-card').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: /add to cart/i }).first()).toBeVisible();

  await page.goto('/login');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('Admin@123');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/admin/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: /system at a glance/i })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Inventory health|Operations unavailable/i)).toBeVisible();
});
