import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {expect, test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function changedRoutes(): string[] {
  if (process.env.DOCS_ROUTES) return process.env.DOCS_ROUTES.split(',').filter(Boolean);
  let output = '';
  try {
    output = execFileSync('git', ['diff', '--name-only', process.env.DOCS_BASE_SHA || 'HEAD~1', 'HEAD'], {encoding: 'utf8'});
  } catch { /* local working tree fallback below */ }
  try { output += `\n${execFileSync('git', ['diff', '--name-only'], {encoding: 'utf8'})}`; } catch { /* no git */ }
  try { output += `\n${execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {encoding: 'utf8'})}`; } catch { /* no git */ }
  const changed = output.split(/\r?\n/).filter(Boolean);
  const routes = changed
    .filter((path) => /^documentation\/docs\/.+\.mdx?$/.test(path)
      && existsSync(path.replace(/^documentation\//, '')))
    .map((path) => {
      const content = readFileSync(path.replace(/^documentation\//, ''), 'utf8');
      const slug = content.match(/^---[\s\S]*?^slug:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1].trim();
      if (slug) return slug.replace(/^\//, '');
      const fileRoute = path.replace(/^documentation\/docs\//, '').replace(/\.(md|mdx)$/, '');
      const segments = fileRoute.split('/');
      if (segments.at(-1)?.toUpperCase() === 'README') segments.pop();
      else segments[segments.length - 1] = segments.at(-1)!.replace(/^\d+-/, '');
      return segments.join('/');
    });
  const globalChange = changed.some((path) => /^documentation\/(?:src|static|sidebars\.ts|docusaurus\.config\.ts|package(?:-lock)?\.json|playwright\.config\.ts)/.test(path));
  const representativeRoutes = globalChange ? [
    '',
    'development/ENGINEERING-PRINCIPLES',
    'development/DESIGN-PATTERNS',
    'spring/SPRING-ECOSYSTEM',
    'architecture/SYSTEM-DESIGN',
    'reference/LEARNING-PATH',
  ] : [];
  return [...new Set([...routes, ...representativeRoutes])]
    .slice(0, Number(process.env.DOCS_ROUTE_LIMIT || 40));
}

const routes = changedRoutes();

test('changed documentation pages render cleanly', async ({page}, testInfo) => {
  test.setTimeout(Math.max(60_000, routes.length * 5_000));
  test.skip(!routes.length, 'No changed documentation routes.');
  for (const [index, route] of routes.entries()) {
    const response = await page.goto(`./${route}`);
    expect(response?.ok(), `${route} should return a successful response`).toBe(true);
    await expect(page.locator('article')).toBeVisible();
    await expect(page.locator('.theme-doc-markdown h1').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${route} should not overflow horizontally`).toBe(true);
    await page.locator('img').evaluateAll((images) => images.forEach((image) => { image.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.images].every((image) => image.complete), undefined, {timeout: 15_000});
    expect(await page.locator('img').evaluateAll((images) => images
      .filter((image) => !image.src.startsWith('data:') && (!image.complete || image.naturalWidth === 0))
      .map((image) => image.getAttribute('src'))), `${route} should have no broken images`).toEqual([]);
    const mermaidErrors = await page.locator('.docusaurus-mermaid-container .error-icon, .mermaid[data-processed="false"]').count();
    expect(mermaidErrors, `${route} should render Mermaid diagrams`).toBe(0);
    if (!testInfo.project.name.includes('mobile') && index < Number(process.env.DOCS_A11Y_LIMIT || 10)) {
      const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(results.violations.filter((item) => ['critical', 'serious'].includes(item.impact ?? '')), `${route} accessibility`).toEqual([]);
    }
  }
});
