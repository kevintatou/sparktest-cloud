import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const shouldRecordVideo = process.env.E2E_RECORD_VIDEO === '1';
const isExternalTarget = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html']] : [['list'], ['html']],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: shouldRecordVideo ? 'on' : 'retain-on-failure',
    video: shouldRecordVideo ? 'on' : 'retain-on-failure',
  },
  webServer: isExternalTarget
    ? undefined
    : {
        command: 'bash scripts/playwright-dev-server.sh',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  outputDir: 'test-results',
});
