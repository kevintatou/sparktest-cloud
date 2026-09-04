import { expect, test } from '@playwright/test';
import { getE2ECredentials, login } from './helpers/auth';
import { navigateTo } from './helpers/navigation';

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;

test('auth entry points render and validate input', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Run your tests. Anywhere.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start free' }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Start free' }).first().click();
  await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();

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
  await page.goto('/?auth=login');

  await page.getByLabel('Email').fill(`missing-${Date.now()}@example.com`);
  await page.getByLabel('Password').fill('DefinitelyWrong123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(
    page.getByText(/invalid login credentials|email not confirmed/i)
  ).toBeVisible();
});

test('existing test account reaches dashboard', async ({ page }) => {
  const credentials =
    e2eEmail && e2ePassword
      ? { email: e2eEmail, password: e2ePassword }
      : await getE2ECredentials();

  await login(page, credentials);
  await expect(
    page.getByRole('button', { name: 'Create Definition' }).first()
  ).toBeVisible();

  await navigateTo(page, 'Settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});

test('existing account signup is not shown as a new signup', async ({ page }) => {
  const credentials = await getE2ECredentials();

  await page.goto('/?auth=signup');
  await page.getByLabel('Name').fill('Existing account test');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill('DifferentPassword123!');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(
    page.getByRole('heading', { name: 'Account may already exist' })
  ).toBeVisible();
  await expect(page.getByText('Check your email')).not.toBeVisible();
});
