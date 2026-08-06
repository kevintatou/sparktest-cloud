import { expect, test } from '@playwright/test';

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;

test('recordable product walkthrough', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'SparkTest Cloud' })
  ).toBeVisible();

  if (!e2eEmail || !e2ePassword) {
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(
      page.getByRole('heading', { name: 'Create an account' })
    ).toBeVisible();
    await page.getByLabel('Name').fill('Demo User');
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('DemoPass123');
    await expect(page.getByText('At least 8 characters')).toBeVisible();
    await expect(page.getByText('One uppercase letter')).toBeVisible();
    await expect(page.getByText('One number')).toBeVisible();
    return;
  }

  await page.getByLabel('Email').fill(e2eEmail);
  await page.getByLabel('Password').fill(e2ePassword);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(
    page.getByRole('heading', { name: 'Welcome back' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Definitions' }).click();
  await expect(
    page.getByRole('heading', { name: 'Definitions' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Runs' }).click();
  await expect(page.getByRole('heading', { name: 'Runs' })).toBeVisible();

  await page.getByRole('button', { name: 'Agents' }).click();
  await expect(
    page.getByRole('heading', { name: /Agents|Connect your first agent/i })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Billing & Plans' }).click();
  await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});
