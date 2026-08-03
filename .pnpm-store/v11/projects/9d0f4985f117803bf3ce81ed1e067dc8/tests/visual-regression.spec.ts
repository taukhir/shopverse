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

for (const diagram of [
  {
    name: 'flowchart-light',
    route: 'data/database-selection/DATABASE-QUICK-CHOICE',
    colorScheme: 'light' as const,
  },
  {
    name: 'sequence-dark',
    route: 'integration/kafka/KAFKA-CONSUMER-OFFSET-COMMITS',
    colorScheme: 'dark' as const,
  },
]) {
  test(`${diagram.name} Mermaid diagram`, async ({page}, testInfo) => {
    await page.emulateMedia({colorScheme: diagram.colorScheme});
    await page.goto(`./${diagram.route}`);
    await page.evaluate(() => document.fonts.ready);

    const container = page.locator('.docusaurus-mermaid-container').first();
    await expect(container.locator('svg')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', diagram.colorScheme);

    const layout = await container.evaluate((element) => ({
      containerWidth: element.getBoundingClientRect().width,
      internalOverflow: element.scrollWidth > element.clientWidth,
      pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }));
    expect(layout.pageOverflow).toBe(false);
    if (testInfo.project.name.includes('mobile')) {
      expect(layout.containerWidth).toBeLessThanOrEqual(390);
      expect(layout.internalOverflow).toBe(true);
    }

    const viewport = testInfo.project.name.includes('mobile') ? 'mobile' : 'desktop';
    await expect(container).toHaveScreenshot(`mermaid-${diagram.name}-${viewport}.png`, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.06,
    });
  });
}
