import {expect, test} from '@playwright/test';

test.skip(!process.env.VISUAL_REGRESSION, 'Run through the Linux visual-baseline workflow.');

test('documentation landing page', async ({page}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Desktop baseline');
  await page.goto('./');
  await expect(page).toHaveScreenshot('landing-page.png', {animations:'disabled', maxDiffPixelRatio:0.08});
});

test('technical article in dark mode', async ({page}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Desktop baseline');
  await page.emulateMedia({colorScheme:'dark'});
  await page.goto('./development/ENGINEERING-PRINCIPLES');
  await expect(page).toHaveScreenshot('engineering-principles-dark.png', {animations:'disabled', fullPage:true, maxDiffPixelRatio:0.08});
});

for (const route of [
  'java/ADVANCED-JAVA-INTERNALS',
  'spring/SPRING-BOOT-INTERNALS-PRODUCTION',
  'architecture/system-design-deep-dives/FIFTEEN-CASE-STUDY-VISUALS',
]) {
  test(`${route} visual article`, async ({page}, testInfo) => {
    await page.emulateMedia({colorScheme: testInfo.project.name.includes('mobile') ? 'light' : 'dark'});
    await page.goto(`./${route}`);
    await expect(page.locator('article')).toBeVisible();
    await expect(page.locator('img').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    expect(await page.locator('img').evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src))).toEqual([]);
  });
}
