import { Page } from '@playwright/test';

export async function navigateTo(page: Page, name: string) {
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 1024) {
    await page.getByRole('button', { name: 'Toggle sidebar' }).click();
  }

  await page.getByRole('button', { name }).click();
}
