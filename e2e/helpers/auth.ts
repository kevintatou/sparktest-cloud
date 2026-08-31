import { Page, expect } from '@playwright/test';
import { loadDotenv } from './env';

type Credentials = {
  email: string;
  password: string;
};

loadDotenv();

function requireSupabaseAdminEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to provision E2E users.'
    );
  }

  return { supabaseUrl, serviceRoleKey };
}

async function createConfirmedUser(credentials: Credentials) {
  const { supabaseUrl, serviceRoleKey } = requireSupabaseAdminEnv();
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
      email_confirm: true,
      user_metadata: { name: 'SparkTest E2E' },
    }),
  });

  if (response.ok) {
    return;
  }

  const body = await response.text();
  if (
    response.status === 422 &&
    /already|registered|exists|duplicate/i.test(body)
  ) {
    return;
  }

  throw new Error(`Failed to create E2E user: ${response.status} ${body}`);
}

export async function getE2ECredentials(): Promise<Credentials> {
  loadDotenv();

  const email =
    process.env.E2E_EMAIL ||
    `sparktest-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const password = process.env.E2E_PASSWORD || 'SparkTestE2E123!';
  const credentials = { email, password };

  if (!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD) {
    await createConfirmedUser(credentials);
  }

  return credentials;
}

export async function login(page: Page, credentials: Credentials) {
  await page.goto('/');
  const profileSync = page
    .waitForResponse(
      (response) =>
        response.url().includes('/api/profile') &&
        response.request().method() === 'POST',
      { timeout: 15_000 }
    )
    .catch(() => null);

  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(
    page.getByRole('heading', { name: 'Dashboard', exact: true })
  ).toBeVisible();

  const response = await profileSync;
  if (response && !response.ok()) {
    throw new Error(`Profile sync failed: ${response.status()}`);
  }
}
