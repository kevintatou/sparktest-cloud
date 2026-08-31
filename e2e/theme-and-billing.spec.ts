import { expect, test } from '@playwright/test';
import { getE2ECredentials, login } from './helpers/auth';
import { navigateTo } from './helpers/navigation';

test('toggles the active theme and shows the free beta status', async ({
  page,
}) => {
  const credentials = await getE2ECredentials();
  await login(page, credentials);

  const themeButton = page.getByRole('button', { name: 'Toggle theme' });
  await expect(themeButton).toBeVisible();
  const initialIsDark = await page.evaluate(() =>
    document.documentElement.classList.contains('dark')
  );

  await themeButton.click();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.classList.contains('dark'))
    )
    .toBe(!initialIsDark);

  await themeButton.click();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.classList.contains('dark'))
    )
    .toBe(initialIsDark);

  await expect(page.getByText('Free Beta', { exact: true })).toBeVisible();

  for (const pageName of [
    'Dashboard',
    'Definitions',
    'Runs',
    'Agents',
    'Settings',
  ]) {
    await navigateTo(page, pageName);
    await expect(
      page.getByRole('heading', { name: 'Help shape SparkTest' })
    ).toBeVisible();
  }
});
