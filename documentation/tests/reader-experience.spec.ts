import {expect, test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({page}) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('command palette exposes rich learning metadata', async ({page}) => {
  await page.getByRole('button', {name: 'Open command palette'}).click();
  await expect(page.getByRole('dialog', {name: 'Documentation command palette'})).toBeVisible();
  await page.getByRole('textbox', {name: 'Search learning catalog'}).fill('security advanced');
  await expect(page.getByRole('dialog', {name: 'Documentation command palette'}).locator('a[href$="SPRING-SECURITY-GENERIC"]')).toBeVisible();
});

test('bookmark, completion, and reading dashboard persist', async ({page}) => {
  await page.goto('./architecture/SYSTEM-DESIGN');
  await page.getByRole('button', {name: 'Bookmark', exact: true}).click();
  await page.getByRole('button', {name: 'Mark complete', exact: true}).click();
  await page.reload();
  await expect(page.getByRole('button', {name: 'Bookmarked', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Open my reading library'}).click();
  await expect(page.getByRole('heading', {name: /Learning dashboard 1\/28/})).toBeVisible();
});

test('individual sections can be bookmarked and reopened', async ({page}) => {
  await page.goto('./architecture/SYSTEM-DESIGN');
  const heading = page.locator('.theme-doc-markdown h2[id]').first();
  const headingId = await heading.getAttribute('id');
  await heading.getByRole('button', {name: /^Bookmark /}).click();
  await page.getByRole('button', {name: 'Open my reading library'}).click();
  const bookmark = page.getByRole('dialog', {name: 'My reading library'}).locator(`a[href$="#${headingId}"]`);
  await expect(bookmark).toBeVisible();
  await bookmark.click();
  await expect(page).toHaveURL(new RegExp(`#${headingId}$`));
});

test('reading mode and Word export work', async ({page}) => {
  await page.goto('./architecture/SYSTEM-DESIGN');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Export Word'}).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/shopverse-system-design\.doc$/);
  await page.getByRole('button', {name: 'Open my reading library'}).click();
  await page.getByRole('button', {name: 'Reading mode'}).click();
  await expect(page.locator('body')).toHaveClass(/reader-focus-mode/);
});

test('homepage has no serious accessibility violations', async ({page}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Desktop scan covers shared semantic markup.');
  const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? ''))).toEqual([]);
});

test('mobile layout does not overflow horizontally', async ({page}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Mobile-only assertion.');
  await page.goto('./architecture/SYSTEM-DESIGN');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('collapsed sidebar releases the wide content canvas', async ({page}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Wide desktop assertion.');
  await page.setViewportSize({width: 2048, height: 1080});
  await page.goto('./development/ENGINEERING-PRINCIPLES');
  await page.getByRole('button', {name: 'Collapse sidebar'}).click();
  const widths=await page.evaluate(()=>({main:document.querySelector('main')!.getBoundingClientRect().width,container:document.querySelector('main .container')!.getBoundingClientRect().width,article:document.querySelector('article')!.getBoundingClientRect().width,markdown:document.querySelector('.theme-doc-markdown')!.getBoundingClientRect().width}));
  expect(widths.container / widths.main).toBeGreaterThan(0.95);
  expect(widths.markdown / widths.article).toBeGreaterThan(0.95);
});
