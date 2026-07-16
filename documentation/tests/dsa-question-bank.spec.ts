import {expect, test} from '@playwright/test';

test('question tables search and filter independently', async ({page}) => {
  await page.goto('./data-structures/DSA-INTERVIEW-QUESTION-BANK');

  const arrays = page.getByRole('region', {name: 'Arrays Question Bank'});
  const strings = page.getByRole('region', {name: 'Strings Question Bank'});
  await expect(arrays).toBeVisible();
  await expect(strings).toBeVisible();
  await expect(page.getByRole('region', {name: /Question Bank$/})).toHaveCount(12);

  await arrays.getByRole('searchbox', {name: 'Search Arrays interview questions'}).fill('prefix');
  await expect(arrays.getByText('Product of Array Except Self', {exact: true})).toBeVisible();
  await expect(arrays.getByText('Subarray Sum Equals K', {exact: true})).toBeVisible();
  await expect(arrays.getByText('3 of 30', {exact: true})).toBeVisible();
  await expect(strings.getByText('25 of 25', {exact: true})).toBeVisible();

  await arrays.getByRole('button', {name: 'Hard', exact: true}).click();
  await expect(arrays.getByText('0 of 30', {exact: true})).toBeVisible();
  await expect(arrays.getByRole('status')).toContainText('No arrays questions');
  await arrays.getByRole('button', {name: 'Reset filters'}).click();
  await expect(arrays.getByText('30 of 30', {exact: true})).toBeVisible();

  await arrays.getByRole('button', {name: 'Hard', exact: true}).click();
  await expect(arrays.locator('tbody tr')).toHaveCount(3);
  await expect(arrays.getByText('3 of 30', {exact: true})).toBeVisible();
});

test('company and priority labels are searchable', async ({page}) => {
  await page.goto('./data-structures/DSA-INTERVIEW-QUESTION-BANK');
  const heap = page.getByRole('region', {name: 'Heap Question Bank'});
  const search = heap.getByRole('searchbox', {name: 'Search Heap interview questions'});

  await search.fill('Bloomberg');
  await expect(heap.getByText('Number of Orders in the Backlog', {exact: true})).toBeVisible();
  await expect(heap.getByText('1 of 20', {exact: true})).toBeVisible();

  await search.fill('essential');
  await expect(heap.getByText(/of 20/)).toBeVisible();
  expect(await heap.locator('tbody tr').count()).toBeGreaterThan(0);
});

test('Top 50 exposes rich metadata and LC search', async ({page}) => {
  await page.goto('./data-structures/DSA-INTERVIEW-QUESTION-BANK');
  const top50 = page.getByRole('region', {name: 'Top 50 Question Bank'});
  await expect(top50.getByText('50 of 50', {exact: true})).toBeVisible();

  const search = top50.getByRole('searchbox', {name: 'Search Top 50 interview questions'});
  await search.fill('LC 238');
  await expect(top50.getByText('Product of Array Except Self', {exact: true})).toBeVisible();
  await expect(top50.getByText('1 of 50', {exact: true})).toBeVisible();
  await expect(top50.getByText('Array', {exact: true})).toBeVisible();
});

test('questions default to difficulty then priority and sortable headers reverse the primary order', async ({page}) => {
  await page.goto('./data-structures/DSA-INTERVIEW-QUESTION-BANK');
  const arrays = page.getByRole('region', {name: 'Arrays Question Bank'});
  const rows = arrays.locator('tbody tr');

  await expect(rows.first().locator('td').nth(3)).toHaveText('Easy');
  await expect(rows.first().locator('td').nth(5)).toHaveText('Essential');
  await expect(arrays.getByRole('columnheader', {name: /Difficulty/})).toHaveAttribute('aria-sort', 'ascending');

  await arrays.getByRole('button', {name: /Priority/}).click();
  await expect(arrays.getByRole('columnheader', {name: /Priority/})).toHaveAttribute('aria-sort', 'ascending');
  await expect(rows.first().locator('td').nth(5)).toHaveText('Essential');
  await expect(rows.first().locator('td').nth(3)).toHaveText('Easy');

  await arrays.getByRole('button', {name: /Difficulty/}).click();
  await arrays.getByRole('button', {name: /Difficulty/}).click();
  await expect(arrays.getByRole('columnheader', {name: /Difficulty/})).toHaveAttribute('aria-sort', 'descending');
  await expect(rows.first().locator('td').nth(3)).toHaveText('Hard');
  await expect(rows.first().locator('td').nth(5)).toHaveText('Essential');
});
