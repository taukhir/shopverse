import {expect, test} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    (window as any).__readerVitals = {lcp: 0, cls: 0};
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) (window as any).__readerVitals.lcp = entry.startTime; }).observe({type: 'largest-contentful-paint', buffered: true});
    new PerformanceObserver((list) => { for (const entry of list.getEntries() as any) if (!entry.hadRecentInput) (window as any).__readerVitals.cls += entry.value; }).observe({type: 'layout-shift', buffered: true});
  });
});

test('documentation route stays inside Core Web Vitals guardrails', async ({page}) => {
  await page.goto('./java/JAVA-COLLECTIONS');
  await page.waitForLoadState('networkidle');
  await page.mouse.click(300, 300);
  const metrics = await page.evaluate(() => ({
    ...(window as any).__readerVitals,
    domReady: performance.getEntriesByType('navigation')[0] ? (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).domContentLoadedEventEnd : 0,
    scripts: performance.getEntriesByType('resource').filter((item) => item.name.endsWith('.js')).reduce((sum, item) => sum + ((item as PerformanceResourceTiming).transferSize || 0), 0),
  }));
  expect(metrics.lcp).toBeLessThan(4_000);
  expect(metrics.cls).toBeLessThan(0.1);
  expect(metrics.domReady).toBeLessThan(5_000);
  // The development server reports uncompressed transfer size; production gzip
  // is enforced separately by scripts/check-performance.mjs.
  expect(metrics.scripts).toBeLessThan(3_500_000);
});

test('mobile search opens responsively', async ({page}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Mobile responsiveness budget.');
  await page.goto('./');
  const start = Date.now();
  await page.getByRole('button', {name: 'Open command palette'}).click();
  await expect(page.getByRole('textbox', {name: 'Search learning catalog'})).toBeVisible();
  expect(Date.now() - start).toBeLessThan(1_500);
});
