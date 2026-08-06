import { expect, test } from '@playwright/test';
import { getE2ECredentials, login } from './helpers/auth';
import { navigateTo } from './helpers/navigation';

const stepDelayMs = 900;

async function pause() {
  await new Promise((resolve) => setTimeout(resolve, stepDelayMs));
}

test('recordable product walkthrough', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  const credentials = await getE2ECredentials();
  await login(page, credentials);
  await pause();

  await expect(page.getByText('Total Definitions')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Recent Runs' }).first()
  ).toBeVisible();
  await pause();

  await navigateTo(page, 'Definitions');
  await expect(
    page.getByRole('heading', { name: 'Definitions', exact: true })
  ).toBeVisible();
  await pause();

  await page
    .getByRole('button', { name: /Create.*Definition|Create.*First/i })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'Create New Definition' })
  ).toBeVisible();
  await page.getByLabel('Definition Name *').fill('Checkout smoke test');
  await page.getByLabel('Description').fill('Browser-created demo definition');
  await page
    .getByLabel('Test Code *')
    .fill('console.log("SparkTest demo run");');
  await pause();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await pause();

  await navigateTo(page, 'Executors');
  await expect(
    page.getByRole('heading', { name: 'Executors', exact: true })
  ).toBeVisible();
  await pause();

  await navigateTo(page, 'Runs');
  await expect(
    page.getByRole('heading', { name: 'Runs', exact: true })
  ).toBeVisible();
  await pause();

  await navigateTo(page, 'Agents');
  await expect(
    page.getByRole('heading', { name: /Agents|Connect your first agent/i })
  ).toBeVisible();
  await pause();

  await navigateTo(page, 'Billing & Plans');
  await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible();
  await pause();

  await navigateTo(page, 'Settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await pause();
});
