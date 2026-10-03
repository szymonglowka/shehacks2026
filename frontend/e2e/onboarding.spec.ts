import { expect, test } from '@playwright/test';
import { uniqueEmail } from './helpers';

/**
 * Fresh-account onboarding against the REAL API: register → 7-step
 * onboarding with defaults → done → /today. Uses a unique e-mail per run
 * so it never collides with seed data or other workers.
 */
test('fresh account completes onboarding and lands on /today', async ({ page }) => {
  const email = uniqueEmail('e2e-onb');
  const password = 'E2e-supertest-1';

  await page.goto('/register');
  await page.locator('input[autocomplete="given-name"]').fill('E2E Mama');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('input[type="checkbox"]').check();
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/onboarding/);

  // Step 1/7 — name (pre-filled default is fine, keep it simple).
  await page.locator('#ob-name').fill('E2E Mama');
  await page.getByRole('button', { name: 'Dalej' }).click();

  // Steps 2–7 — accept mode/details/coping/worsening/circle/goals defaults.
  for (let step = 0; step < 5; step += 1) {
    await page.getByRole('button', { name: 'Dalej' }).click();
  }
  await page.getByRole('button', { name: 'Zaczynamy' }).click();

  await expect(page.getByText(/Gotowe|Witaj|Dziękuję/i).first()).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole('button', { name: 'Przejdź do Dzisiaj' }).click();
  await expect(page).toHaveURL(/\/today/);
});
