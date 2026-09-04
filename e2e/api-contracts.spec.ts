import { expect, test } from '@playwright/test';
import { getE2ECredentials, login } from './helpers/auth';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function accessToken(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((item) =>
      item.endsWith('-auth-token')
    );
    if (!key) throw new Error('Supabase session was not found');
    const session = JSON.parse(localStorage.getItem(key) || '{}');
    if (!session.access_token) throw new Error('Supabase access token was not found');
    return session.access_token as string;
  });
}

test('authenticated list endpoints return stable resource shapes', async ({ page }) => {
  await login(page, await getE2ECredentials());
  const token = await accessToken(page);

  const lists = [
    { path: '/api/projects', required: ['id', 'slug'] },
    { path: '/api/test-definitions', required: ['id', 'name', 'image', 'commands'] },
    { path: '/api/test-runs', required: ['id', 'status', 'created_at'] },
    { path: '/api/agents', required: ['id', 'name', 'status'] },
    { path: '/api/executors', required: ['id', 'name', 'executor_type'] },
    { path: '/api/test-suites', required: ['id', 'name', 'execution_mode'] },
    { path: '/api/agent-tokens', required: ['id', 'name'] },
  ];

  for (const list of lists) {
    const response = await page.request.get(`${apiUrl}${list.path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.ok(), `${list.path}: ${response.status()}`).toBeTruthy();
    const payload = await response.json();
    expect(Array.isArray(payload), `${list.path} must return an array`).toBeTruthy();

    for (const item of payload) {
      for (const field of list.required) {
        expect(item, `${list.path} item is missing ${field}`).toHaveProperty(field);
      }
    }
  }
});
