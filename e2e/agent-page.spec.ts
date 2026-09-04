import { expect, test } from '@playwright/test';
import { getE2ECredentials, login } from './helpers/auth';
import { navigateTo } from './helpers/navigation';

test('manages agent tokens, connected agents, and install guidance', async ({
  page,
}) => {
  const credentials = await getE2ECredentials();
  const tokenName = `agent-${Date.now().toString(36)}`;
  const agentName = `e2e-agent-${Date.now().toString(36)}`;

  await login(page, credentials);
  await navigateTo(page, 'Agents');

  await expect(
    page.getByRole('heading', { name: 'Agents', exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Agent Tokens', exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Start an agent', exact: true })
  ).toBeVisible();
  await expect(page.getByText('No agents connected')).toBeVisible();
  await expect(page.getByRole('button', { name: /setup wizard/i })).toHaveCount(
    0
  );

  await page.getByPlaceholder(/Token name/).fill(tokenName);
  await page.getByRole('button', { name: 'Create Token' }).click();
  await expect(page.getByText(/Token created.*copy it now/i)).toBeVisible();

  const token = await page
    .locator('code')
    .filter({ hasText: 'stc_' })
    .innerText();
  expect(token).toMatch(/^stc_[a-f0-9]{32}$/);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const checkIn = await page.request.post(`${apiUrl}/api/agent/check-in`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: agentName,
      version: '0.1.0',
      status: 'online',
    },
  });
  expect(checkIn.ok()).toBeTruthy();

  await page.reload();
  await navigateTo(page, 'Agents');
  await expect(page.getByText('Connected Agents')).toBeVisible();
  await expect(page.getByText(agentName)).toBeVisible();
  await expect(page.getByText('Online', { exact: true })).toBeVisible();
  await expect(page.getByText(/^Status:/)).toHaveCount(0);
  await expect(page.getByText(tokenName, { exact: true })).toBeVisible();
  await expect(page.getByText(/scripts\/install-agent\.sh/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
});
