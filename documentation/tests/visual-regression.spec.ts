import {expect, test} from '@playwright/test';

test.skip(!process.env.VISUAL_REGRESSION, 'Run through the Linux visual-baseline workflow.');

test('documentation landing page', async ({page}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Desktop baseline');
  await page.goto('./');
  await expect(page).toHaveScreenshot('landing-page.png', {animations:'disabled', fullPage:true, maxDiffPixelRatio:0.01});
});

test('technical article in dark mode', async ({page}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Desktop baseline');
  await page.emulateMedia({colorScheme:'dark'});
  await page.goto('./development/ENGINEERING-PRINCIPLES');
  await expect(page).toHaveScreenshot('engineering-principles-dark.png', {animations:'disabled', fullPage:true, maxDiffPixelRatio:0.01});
});
