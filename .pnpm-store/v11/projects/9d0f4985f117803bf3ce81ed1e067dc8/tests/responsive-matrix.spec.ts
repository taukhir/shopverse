import {expect, test} from '@playwright/test';

const routes = [
  './java/JAVA-COLLECTIONS',
  './operations/kubernetes/KUBERNETES-OVERVIEW',
  './development/design-patterns/immutable-class',
];

for (const theme of ['light', 'dark'] as const) {
  test(`${theme} layout stays responsive with long content`, async ({page}) => {
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await expect(page.locator('.theme-doc-markdown')).toBeVisible();
    }
    await expect(page.locator('.theme-doc-markdown pre').first()).toBeVisible();
  });
}

test('sidebar, search, tree, walkthrough, and keyboard flows remain usable', async ({page}) => {
  await page.goto('./java/JAVA-COLLECTIONS');
  const tree = page.getByRole('heading', {name: 'Java Collections explorer'}).locator('xpath=ancestor::section');
  await tree.getByPlaceholder('Filter topics').fill('array');
  await expect(tree.getByPlaceholder('Filter topics')).toHaveValue('array');
  await expect(tree.getByText('No matching topics.')).toHaveCount(0);

  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', {name: /keyboard shortcuts/i})).toBeVisible();
  await page.keyboard.press('Escape');

  const mobileMenu = page.getByRole('button', {name: /toggle navigation bar/i});
  if (await mobileMenu.isVisible()) await mobileMenu.click();
  else await expect(page.locator('.theme-doc-sidebar-container')).toBeVisible();

  await page.goto('./development/design-patterns/immutable-class');
  const walkthrough = page.getByRole('region', {name: 'Build an immutable value safely'});
  await walkthrough.getByRole('tab').nth(1).click();
  await expect(walkthrough.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
});

test('focus and interview modes persist and remain keyboard reachable', async ({page}) => {
  await page.goto('./development/DESIGN-PATTERNS');
  await page.getByRole('button', {name: 'Open my reading library'}).click();
  await page.getByRole('button', {name: 'Reading mode'}).click();
  await page.getByRole('button', {name: 'Interview mode'}).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).toHaveClass(/reader-focus-mode/);
  await expect(page.locator('body')).toHaveClass(/reader-practice-mode/);
  await page.reload();
  await expect(page.locator('body')).toHaveClass(/reader-focus-mode/);
});
