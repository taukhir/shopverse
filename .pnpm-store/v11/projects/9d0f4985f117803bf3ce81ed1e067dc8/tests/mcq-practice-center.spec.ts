import {expect, test} from '@playwright/test';

test('runs a timed 20-question test and unlocks explanations only after submission', async ({page}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.stack ?? error.message));
  await page.goto('./leadership/interview-program/MCQ-PRACTICE-CENTER');

  await expect(page.getByRole('heading', {name: 'Build a 20-question test'})).toBeVisible();
  await expect(page.getByTestId('bank-size')).toContainText('200');

  await page.getByRole('button', {name: /Spring Cloud/}).click();
  await page.getByRole('button', {name: 'Hard', exact: true}).click();
  await page.getByRole('button', {name: 'Start 20-question test'}).click();

  expect(pageErrors).toEqual([]);
  await expect(page.getByText('Question 1 of 20', {exact: true})).toBeVisible();
  await expect(page.locator('details')).toHaveCount(0);
  await expect(page.getByText('Review is locked during the test.')).toBeVisible();

  for (let question = 1; question <= 20; question += 1) {
    await page.getByRole('radio').first().check();
    if (question < 20) await page.getByRole('button', {name: 'Next', exact: true}).click();
  }

  await page.getByRole('button', {name: 'Submit test'}).first().click();
  await expect(page.getByRole('heading', {name: 'Test results'})).toBeVisible();
  await expect(page.getByText('/ 20', {exact: true})).toBeVisible();
  await expect(page.locator('details')).toHaveCount(20);

  await page.locator('details summary').first().click();
  await expect(page.getByText('Explanation', {exact: true}).first()).toBeVisible();
  await expect(page.getByText('Correct answer', {exact: true}).first()).toBeVisible();
  await expect(page.getByRole('link', {name: /Study the Spring Cloud Architect path/}).first()).toBeVisible();
});

test('all ten subject selectors expose 200-question banks', async ({page}) => {
  await page.goto('./leadership/interview-program/MCQ-PRACTICE-CENTER');
  for (const subject of ['Java', 'Spring', 'Spring Cloud', 'System Design', 'Kafka', 'Microservices', 'Databases', 'Docker', 'Kubernetes', 'Security']) {
    await page.getByRole('button', {name: new RegExp(`^${subject} 200`)}).click();
    await expect(page.getByTestId('bank-size')).toContainText('200');
  }
});

test('dedicated subject pages open with their subject locked', async ({page}) => {
  const pages = [
    ['java/JAVA-MCQ-PRACTICE', 'Java MCQ test'],
    ['spring/SPRING-MCQ-PRACTICE', 'Spring MCQ test'],
    ['spring/cloud/SPRING-CLOUD-MCQ-PRACTICE', 'Spring Cloud MCQ test'],
    ['architecture/system-design-deep-dives/SYSTEM-DESIGN-MCQ-PRACTICE', 'System Design MCQ test'],
    ['integration/KAFKA-MCQ-PRACTICE', 'Kafka MCQ test'],
    ['architecture/microservices/MICROSERVICES-MCQ-PRACTICE', 'Microservices MCQ test'],
    ['data/DATABASE-MCQ-PRACTICE', 'Databases MCQ test'],
    ['operations/DOCKER-MCQ-PRACTICE', 'Docker MCQ test'],
    ['operations/KUBERNETES-MCQ-PRACTICE', 'Kubernetes MCQ test'],
    ['security/SECURITY-MCQ-PRACTICE', 'Security MCQ test'],
  ];

  for (const [route, heading] of pages) {
    await page.goto(`./${route}`);
    await expect(page.getByRole('heading', {name: heading})).toBeVisible();
    await expect(page.getByTestId('bank-size')).toContainText('200');
    await expect(page.getByRole('group', {name: '1. Choose a subject'})).toHaveCount(0);
  }
});
