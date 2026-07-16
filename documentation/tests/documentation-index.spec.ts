import {expect, test} from '@playwright/test';

test('root page links to the dedicated root-level documentation index', async ({page}) => {
  await page.goto('./');
  await expect(page.getByRole('link', {name: 'Open documentation index'})).toHaveAttribute(
    'href',
    '/shopverse/documentation-index',
  );
});

test('dedicated root-level page exposes the complete expandable documentation hierarchy', async ({page}) => {
  await page.goto('./documentation-index');
  const index = page.getByRole('region', {name: 'Complete documentation index'});

  await expect(index).toBeVisible();
  await expect(index.locator('details[data-level="0"]')).toHaveCount(13);
  await expect(index.getByRole('link', {name: 'Download Excel'})).toHaveAttribute(
    'href',
    /\/shopverse\/downloads\/dsa\/Lead_Java_DSA_Interview_Handbook\.xlsx$/,
  );

  const foundations = index.locator('details[data-level="0"]').filter({hasText: 'Engineering Foundations'});
  await foundations.locator('summary').first().click();
  await expect(foundations).toHaveAttribute('open', '');
  await expect(foundations.getByText('Algorithms And Data Structures', {exact: true})).toBeVisible();
});

test('root documentation index searches newly registered topic pages', async ({page}) => {
  await page.goto('./documentation-index');
  const index = page.getByRole('region', {name: 'Complete documentation index'});
  const search = index.getByRole('searchbox', {name: 'Search the complete documentation index'});

  await search.fill('Java DSA Interview Question Bank');
  await expect(index.getByText('Java DSA Interview Question Bank', {exact: true})).toBeVisible();
  await expect(index.locator('details[open]')).not.toHaveCount(0);

  await index.getByRole('button', {name: 'Clear documentation index search'}).click();
  await search.fill('Spring Distributed Locking Options');
  await expect(index.getByText('Spring Distributed Locking Options', {exact: true})).toBeVisible();

  await index.getByRole('button', {name: 'Clear documentation index search'}).click();
  await search.fill('Change Data Capture');
  await expect(index.getByText('Change Data Capture (CDC)', {exact: true})).toBeVisible();
});

test('root documentation index can expand or collapse all hierarchy levels', async ({page}) => {
  test.setTimeout(60_000);
  await page.goto('./documentation-index');
  const index = page.getByRole('region', {name: 'Complete documentation index'});

  await index.getByRole('button', {name: 'Expand all'}).click();
  const groupCount = await index.locator('details').count();
  await expect(index.locator('details[open]')).toHaveCount(groupCount);

  await index.getByRole('button', {name: 'Collapse all'}).click();
  await expect(index.locator('details[open]')).toHaveCount(0);
});
