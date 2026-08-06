import { expect, test } from '@playwright/test';
import { getE2ECredentials, login } from './helpers/auth';
import { navigateTo } from './helpers/navigation';

test.describe.configure({ mode: 'serial' });

test.describe('authenticated app features', () => {
  test('creates and navigates core testing resources', async ({ page }) => {
    const credentials = await getE2ECredentials();
    const suffix = Date.now().toString(36);
    const definitionName = `E2E Definition ${suffix}`;
    const executorName = `E2E Executor ${suffix}`;
    const suiteName = `E2E Suite ${suffix}`;

    await login(page, credentials);

    await navigateTo(page, 'Definitions');
    await expect(
      page.getByRole('heading', { name: 'Definitions', exact: true })
    ).toBeVisible();
    await page
      .getByRole('button', { name: /Create.*Definition|Create.*First/i })
      .first()
      .click();
    await page.getByLabel('Definition Name *').fill(definitionName);
    await page.getByLabel('Description').fill('Created by Playwright');
    await page.getByLabel('Test Code *').fill('console.log("hello e2e");');
    await page.getByRole('button', { name: 'Create Test' }).click();
    await expect(
      page.getByRole('heading', { name: definitionName })
    ).toBeVisible();

    await navigateTo(page, 'Executors');
    await expect(
      page.getByRole('heading', { name: 'Executors', exact: true })
    ).toBeVisible();
    await page
      .getByRole('button', { name: /Add.*Executor|Add.*First/i })
      .first()
      .click();
    await page.getByLabel('Name').fill(executorName);
    await page.getByLabel('Description').fill('Created by Playwright');
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Local Docker' }).click();
    await page.getByRole('button', { name: 'Create Executor' }).click();
    await expect(
      page.getByRole('heading', { name: executorName })
    ).toBeVisible();

    await navigateTo(page, 'Suites');
    await expect(
      page.getByRole('heading', { name: 'Suites', exact: true })
    ).toBeVisible();
    await page
      .getByRole('button', { name: /Create.*Suite|Create.*First/i })
      .first()
      .click();
    await page.getByLabel('Name').fill(suiteName);
    await page.getByLabel('Description').fill('Created by Playwright');
    await page.getByRole('checkbox').first().click();
    await page.getByRole('button', { name: 'Create Suite' }).click();
    await expect(page.getByRole('heading', { name: suiteName })).toBeVisible();

    await navigateTo(page, 'Runs');
    await expect(
      page.getByRole('heading', { name: 'Runs', exact: true })
    ).toBeVisible();
  });

  test('loads cloud, automation, billing, and security sections', async ({
    page,
  }) => {
    const credentials = await getE2ECredentials();

    await login(page, credentials);

    await navigateTo(page, 'Projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(page.getByText('Default Project')).toBeVisible();

    await navigateTo(page, 'Agents');
    await expect(
      page.getByRole('heading', { name: /Agents|Connect your first agent/i })
    ).toBeVisible();

    await navigateTo(page, 'Billing & Plans');
    await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible();
    await expect(page.getByText(/Free Plan|Pro Plan/i).first()).toBeVisible();

    await navigateTo(page, 'Settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText('Base URL:')).toBeVisible();

    await navigateTo(page, 'CI / Schedules');
    await expect(
      page.getByRole('heading', { name: 'CI & Automation' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Schedules \d+$/ })
    ).toBeVisible();

    await navigateTo(page, 'Routing');
    await expect(
      page.getByRole('heading', { name: 'Routing & Environments' })
    ).toBeVisible();

    await navigateTo(page, 'Security');
    await expect(
      page.getByRole('heading', { name: 'Security & Access' })
    ).toBeVisible();
  });
});
