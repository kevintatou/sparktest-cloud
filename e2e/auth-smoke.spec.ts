import { expect, test } from '@playwright/test';

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;

test('auth entry points render and validate input', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'SparkTest Cloud' })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();

  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(
    page.getByRole('heading', { name: 'Create an account' })
  ).toBeVisible();

  await page.getByLabel('Name').fill('E2E Smoke');
  await page.getByLabel('Email').fill('e2e-smoke@example.com');
  await page.getByLabel('Password').fill('short');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(
    page.getByText('Please meet all password requirements.')
  ).toBeVisible();

  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(
    page.getByRole('heading', { name: 'Reset password' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Send reset link' })
  ).toBeVisible();
});

test('invalid login returns an auth error', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Email').fill(`missing-${Date.now()}@example.com`);
  await page.getByLabel('Password').fill('DefinitelyWrong123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(
    page.getByText(/invalid login credentials|email not confirmed/i)
  ).toBeVisible();
});

test('existing test account reaches dashboard', async ({ page }) => {
  test.skip(
    !e2eEmail || !e2ePassword,
    'Set E2E_EMAIL and E2E_PASSWORD to run login coverage.'
  );

  await page.goto('/');

  await page.getByLabel('Email').fill(e2eEmail!);
  await page.getByLabel('Password').fill(e2ePassword!);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(
    page.getByRole('heading', { name: 'Welcome back' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Create New Definition' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Billing & Plans' }).click();
  await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});
