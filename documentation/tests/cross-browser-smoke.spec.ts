import {expect, test} from '@playwright/test';

const routes = [
  '',
  'development/DESIGN-PATTERNS',
  'architecture/SYSTEM-DESIGN',
  'spring/SPRING-ECOSYSTEM',
];

test('core routes render and navigate across browser engines', async ({page}) => {
  for (const route of routes) {
    const response = await page.goto(`./${route}`);
    expect(response?.ok(), `${route || 'home'} should load`).toBe(true);
    await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth
      <= document.documentElement.clientWidth + 1), `${route || 'home'} should not overflow`).toBe(true);
  }
});

test('keyboard skip link and theme control remain usable', async ({page}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Desktop navigation exposes the theme control directly.');
  await page.goto('./development/DESIGN-PATTERNS');
  const skipLink = page.getByText('Skip to main content', {exact: true});
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await skipLink.press('Enter');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('button', {name: /Switch between dark and light mode/i})).toBeVisible();
});
