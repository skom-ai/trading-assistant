/**
 * File: e2e/app.spec.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   End-to-end UI tests for the QuantMind terminal. Verifies the app
 *   loads, the sidebar navigation switches modules, and the key FR
 *   screens render. Runs against the live Vite dev server.
 */
import { expect, test } from '@playwright/test';

/** Navigate home and wait for the SPA to hydrate before asserting. */
async function gotoApp(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByText('Core Modules')).toBeVisible();
}

test.describe('QuantMind UI', () => {
  test('loads the terminal shell', async ({ page }) => {
    await gotoApp(page);
    await expect(page).toHaveTitle(/QuantMind/);
  });

  test('navigates to the Stock Scanner (FR2) module', async ({ page }) => {
    await gotoApp(page);
    await page.getByText('Stock Scanner').first().click();
    await expect(page.getByText('Deterministic Factor Screener')).toBeVisible();
  });

  test('navigates to the Opportunity Check (FR1) module', async ({ page }) => {
    await gotoApp(page);
    await page.getByText('Opportunity Check').first().click();
    await expect(page.getByText('4-State Catalyst Verdict Engine')).toBeVisible();
  });

  test('navigates to the Strategy Studio (FR3) module', async ({ page }) => {
    await gotoApp(page);
    await page.getByText('Strategy Studio').first().click();
    await expect(page.getByText(/Execution Matrix/)).toBeVisible();
  });
});
