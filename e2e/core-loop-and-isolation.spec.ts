import { expect, test } from '@playwright/test';
import { spawn } from 'node:child_process';
import { getE2ECredentials, login } from './helpers/auth';
import { navigateTo } from './helpers/navigation';

type ApiDefinition = {
  id: string;
  name: string;
  project_id: string;
};

type AgentToken = {
  id: string;
  name: string;
  token: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function accessToken(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((item) =>
      item.endsWith('-auth-token')
    );
    if (!key) throw new Error('Supabase session was not found');
    const session = JSON.parse(localStorage.getItem(key) || '{}');
    if (!session.access_token)
      throw new Error('Supabase access token was not found');
    return session.access_token as string;
  });
}

async function api<T>(
  page: import('@playwright/test').Page,
  token: string,
  endpoint: string,
  options?: RequestInit
) {
  return page.request.fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

async function createDefinition(
  page: import('@playwright/test').Page,
  token: string,
  name: string
) {
  const response = await api<ApiDefinition>(
    page,
    token,
    '/api/test-definitions',
    {
      method: 'POST',
      data: {
        id: '00000000-0000-0000-0000-000000000000',
        project_id: '00000000-0000-0000-0000-000000000000',
        name,
        description: 'Playwright core-loop definition',
        image: 'javascript',
        commands: ['echo SPARKTEST_E2E_SUCCESS'],
        executor_id: null,
        labels: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }
  );
  expect(
    response.ok(),
    `${response.status()} ${await response.text()}`
  ).toBeTruthy();
  return response.json() as Promise<ApiDefinition>;
}

test('executes a definition through an agent and shows the result', async ({
  page,
}) => {
  const credentials = await getE2ECredentials();
  await login(page, credentials);
  const token = await accessToken(page);
  const suffix = Date.now().toString(36);
  const definitionName = `Core loop ${suffix}`;

  const agentTokenResponse = await api<AgentToken>(
    page,
    token,
    '/api/agent-tokens',
    { method: 'POST', data: { name: `core-loop-agent-${suffix}` } }
  );
  expect(agentTokenResponse.ok()).toBeTruthy();
  const agentToken = await agentTokenResponse.json();

  await navigateTo(page, 'Definitions');
  await page
    .getByRole('button', { name: 'Create Definition', exact: true })
    .click();
  await page.getByLabel('Definition Name *').fill(definitionName);
  await expect(page.getByLabel('Shell command *')).toHaveValue(
    'echo "SparkTest connected"'
  );
  const saved = page.waitForResponse(
    (response) =>
      response.url() === `${apiUrl}/api/test-definitions` &&
      response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Create Test', exact: true }).click();
  expect((await saved).ok()).toBeTruthy();
  await api(page, agentToken.token, '/api/agent/check-in', {
    method: 'POST',
    data: {
      name: `core-loop-agent-${suffix}`,
      version: '0.1.0',
      status: 'online',
    },
  });

  await page.reload();
  await navigateTo(page, 'Definitions');
  await expect(
    page.getByRole('heading', { name: definitionName })
  ).toBeVisible();
  const runCreated = page.waitForResponse(
    (response) =>
      response.url() === `${apiUrl}/api/test-runs` &&
      response.request().method() === 'POST'
  );
  await page
    .getByRole('heading', { name: definitionName })
    .locator('..')
    .locator('..')
    .locator('..')
    .getByRole('button', { name: 'Run' })
    .click();
  const run = (await (await runCreated).json()) as { id: string };

  const agent = spawn('cargo', ['run', '-p', 'sparktest-agent'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      SPARKTEST_CLOUD_URL: apiUrl,
      SPARKTEST_AGENT_TOKEN: agentToken.token,
      SPARKTEST_AGENT_NAME: `core-loop-agent-${suffix}`,
      SPARKTEST_AGENT_ONCE: '1',
    },
    stdio: 'ignore',
  });
  const exitCode = await new Promise<number | null>((resolve, reject) => {
    const timer = setTimeout(() => {
      agent.kill('SIGTERM');
      reject(
        new Error('Agent did not finish the queued run within 30 seconds')
      );
    }, 30_000);
    agent.once('error', reject);
    agent.once('close', (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });
  expect(exitCode).toBe(0);

  await expect
    .poll(
      async () => {
        const response = await api<{ id: string; status: string }[]>(
          page,
          token,
          '/api/test-runs'
        );
        const runs = await response.json();
        return runs.find((candidate) => candidate.id === run.id)?.status;
      },
      { timeout: 15000 }
    )
    .toBe('passed');

  const runsResponse = page.waitForResponse(
    (response) =>
      response.url() === `${apiUrl}/api/test-runs` &&
      response.request().method() === 'GET' &&
      response.status() === 200
  );
  await page.reload();
  await runsResponse;
  await navigateTo(page, 'Runs');
  await expect(page.getByText('passed', { exact: true })).toBeVisible();
});

test('new users receive private projects and cannot see another user resources', async ({
  browser,
}) => {
  const userA = await getE2ECredentials();
  const userB = await getE2ECredentials();
  const pageA = await browser.newPage();
  const pageB = await browser.newPage();
  const definitionName = `Private resource ${Date.now().toString(36)}`;

  await login(pageA, userA);
  const tokenA = await accessToken(pageA);
  const projectsA = await (await api(pageA, tokenA, '/api/projects')).json();
  expect(projectsA).toHaveLength(1);
  expect(projectsA[0].slug).toMatch(/^user-/);
  const definition = await createDefinition(pageA, tokenA, definitionName);
  const tokenResponse = await api<AgentToken>(
    pageA,
    tokenA,
    '/api/agent-tokens',
    {
      method: 'POST',
      data: { name: `private-agent-${Date.now().toString(36)}` },
    }
  );
  expect(tokenResponse.ok()).toBeTruthy();
  const privateToken = await tokenResponse.json();

  await login(pageB, userB);
  const tokenB = await accessToken(pageB);
  const [projectsB, definitionsB, agentsB, tokensB, runsB] = await Promise.all([
    (await api(pageB, tokenB, '/api/projects')).json(),
    (await api(pageB, tokenB, '/api/test-definitions')).json(),
    (await api(pageB, tokenB, '/api/agents')).json(),
    (await api(pageB, tokenB, '/api/agent-tokens')).json(),
    (await api(pageB, tokenB, '/api/test-runs')).json(),
  ]);

  expect(projectsB).toHaveLength(1);
  expect(projectsB[0].slug).toMatch(/^user-/);
  expect(projectsB[0].id).not.toBe(projectsA[0].id);
  expect(definitionsB).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: definition.id, name: definitionName }),
    ])
  );
  expect(agentsB).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: expect.stringContaining('private-agent'),
      }),
    ])
  );
  expect(tokensB).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ id: privateToken.id })])
  );
  expect(runsB).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ definition_id: definition.id }),
    ])
  );

  const crossProjectRead = await api(
    pageB,
    tokenB,
    `/api/test-definitions/${definition.id}`
  );
  expect([403, 404]).toContain(crossProjectRead.status());

  const otherUserDefinition = await createDefinition(
    pageB,
    tokenB,
    `Other user run ${Date.now().toString(36)}`
  );
  const otherUserRun = await api(pageB, tokenB, '/api/test-runs', {
    method: 'POST',
    data: {
      id: '00000000-0000-0000-0000-000000000000',
      project_id: '00000000-0000-0000-0000-000000000000',
      definition_id: otherUserDefinition.id,
      suite_id: null,
      executor_id: null,
      agent_id: null,
      status: 'queued',
      result: null,
      error: null,
      queued_at: new Date().toISOString(),
      started_at: null,
      finished_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });
  expect(otherUserRun.ok()).toBeTruthy();

  const crossProjectClaim = await api(
    pageA,
    privateToken.token,
    '/api/agent/next-run',
    {
      method: 'POST',
      data: {
        name: 'cross-project-agent',
        version: '0.1.0',
        status: 'online',
      },
    }
  );
  expect(crossProjectClaim.ok()).toBeTruthy();
  expect((await crossProjectClaim.json()).run).toBeNull();

  await pageA.close();
  await pageB.close();
});
