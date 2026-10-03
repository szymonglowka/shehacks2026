import { expect, test } from '@playwright/test';
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  apiContext,
  authApi,
  isNightTheme,
  loginViaUi,
  logoutClientSide,
} from './helpers';

/**
 * The pitch demo script against the REAL API (seeded DB: migrate +
 * seed_content + seed_demo, plus demo-night for the /night awake counter).
 *
 * One serial test = one user session, mirroring the live pitch click-path:
 * login (Marta) → /today → check-in (4 steps) → summary → tough-day →
 * goals → patterns → report → night toggle → /night → public circle
 * (logged out) → claim → /help (logged out) → EN language switch.
 *
 * NOTE: specs run in PL (default lng). Exact PL copy is asserted only where
 * the key is load-bearing; structure/URLs carry the rest so minor copy
 * edits don't false-red the suite.
 */

test.describe.serial('demo script (Marta, postpartum)', () => {
  test('full pitch journey on the real API', async ({ page }) => {
    // 1. Login as Marta.
    await loginViaUi(page, DEMO_EMAIL, DEMO_PASSWORD);

    // 2. Check-in, 4 steps (upsert is idempotent, safe on re-runs).
    await page.goto('/checkin');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Step 1/4 — mood: pick "3 Różnie".
    await dialog.getByRole('radio').nth(2).click();
    await dialog.getByRole('button', { name: 'Dalej' }).click();
    // Step 2/4 — body & sleep (defaults are fine).
    await dialog.getByRole('button', { name: 'Dalej' }).click();
    // Step 3/4 — pain & bleeding (defaults are fine).
    await dialog.getByRole('button', { name: 'Dalej' }).click();
    // Step 4/4 — emotions + note.
    await dialog.getByRole('button', { name: 'zmęczona' }).click();
    await dialog.locator('textarea').fill('E2E: dzień jak co dzień.');
    await dialog.getByRole('button', { name: 'Zapisz check-in' }).click();
    await expect(
      dialog.getByText('Dziękuję, że to zauważyłaś'),
    ).toBeVisible({ timeout: 20_000 });
    await dialog.getByRole('button', { name: 'Wróć do Dzisiaj' }).click();

    // 3. Summary on /today.
    await expect(page).toHaveURL(/\/today/);
    await expect(page.getByText(/Dziś: nastrój 3\/5/)).toBeVisible();

    // 4. Tough day: intensity 3 → breathing → strategy → helped.
    await page.goto('/tough-day');
    await expect(
      page.getByRole('heading', { name: 'Jak bardzo jest ciężko?' }),
    ).toBeVisible();
    await page.getByRole('radio', { name: /^3:/ }).click();
    await expect(
      page.getByRole('heading', { name: 'Zacznijmy od jednego spokojnego oddechu' }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Wybierz inną formę wsparcia' })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Co teraz może pomóc?' }),
    ).toBeVisible();
    const strategies = page.locator('ul li button');
    if ((await strategies.count()) > 0) {
      await strategies.first().click();
      await page.getByRole('button', { name: 'Zapisz i zamknij' }).click();
    } else {
      // No strategies seeded — jump straight to the closing step.
      await page.getByRole('button', { name: 'Zapisz i zamknij' }).click();
    }
    await expect(
      page.getByRole('heading', { name: 'Czy to pomogło?' }),
    ).toBeVisible();
    await page.getByRole('radio', { name: 'Trochę' }).click();
    await page.getByRole('radio', { name: '4', exact: true }).click();
    await page.getByRole('button', { name: 'Zapisz i zamknij' }).click();
    await expect(
      page.getByText('Dobrze, że o siebie zadbałaś. Jestem tu też jutro.'),
    ).toBeVisible();

    // 5. Goals: log one (toggle flips done_today either way).
    await page.goto('/goals');
    const goalToggles = page.locator('main ul button[aria-pressed]');
    if ((await goalToggles.count()) === 0) {
      // Marta has no goals in this DB — create one via the real API, then log it.
      const api = await apiContext();
      const login = await api.post('auth/login', {
        data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
      });
      expect(login.ok()).toBeTruthy();
      const { access } = (await login.json()) as { access: string };
      const authed = await authApi(access);
      const created = await authed.post('goals', {
        data: { title: 'E2E: krótki spacer' },
      });
      expect(created.ok(), await created.text()).toBeTruthy();
      await authed.dispose();
      await api.dispose();
      await page.reload();
    }
    const toggle = page.locator('main ul button[aria-pressed]').first();
    await expect(toggle).toBeVisible();
    const before = await toggle.getAttribute('aria-pressed');
    await toggle.click();
    await expect(toggle).toHaveAttribute(
      'aria-pressed',
      before === 'true' ? 'false' : 'true',
    );

    // 6. Patterns + report render without an error state.
    await page.goto('/patterns');
    await expect(page.locator('main h1, main h2').first()).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.goto('/report');
    await expect(page.locator('main h1, main h2').first()).toBeVisible();

    // 7. Night mode toggle → /night shows the awake count.
    await page
      .getByRole('button', { name: 'Przełącz tryb nocny' })
      .click();
    expect(await isNightTheme(page)).toBe(true);
    await page.goto('/night');
    await expect(page.locator('main')).toContainText('Nocna zmiana.');
    const awakeLine = page.getByText(/mam z Otuli też teraz nie śpi/);
    if ((await awakeLine.count()) > 0) {
      await expect(awakeLine).toBeVisible();
    } else {
      test.info().annotations.push({
        type: 'night-counter',
        description: 'awake line hidden (<5 awake or demo-night not run)',
      });
    }

    // 8. Public circle page logged out → claim.
    const api = await apiContext();
    const login = await api.post('auth/login', {
      data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });
    expect(login.ok()).toBeTruthy();
    const { access } = (await login.json()) as { access: string };
    const authed = await authApi(access);
    let link = await authed.get('circle/link');
    let token: string;
    if (link.status() === 404) {
      const created = await authed.post('circle/link', { data: {} });
      expect(created.ok(), await created.text()).toBeTruthy();
      token = ((await created.json()) as { token: string }).token;
    } else {
      token = ((await link.json()) as { token: string }).token;
    }
    const need = await authed.post('circle/requests', {
      data: { title: 'E2E: ciepły obiad', category: 'meal', when_label: 'jutro' },
    });
    expect(need.ok(), await need.text()).toBeTruthy();
    await authed.dispose();
    await api.dispose();

    await logoutClientSide(page);
    await page.goto(`/c/${token}`);
    await expect(page.locator('main')).toContainText(/E2E: ciepły obiad/);
    // The name field appears after "Biorę to" on the request's card.
    const card = page
      .getByText('E2E: ciepły obiad')
      .last()
      .locator('xpath=ancestor::*[.//button][1]');
    await card.getByRole('button', { name: /Biorę to/i }).click();
    const claimForm = page.locator('form').first();
    await claimForm.locator('input').fill('E2E Babcia');
    await claimForm.getByRole('button', { name: /Potwierdź|Confirm/i }).click();
    await expect(page.locator('main')).toContainText(/E2E Babcia/);

    // 9. Help page works logged out (crisis numbers reachable).
    await page.goto('/help');
    await expect(page.locator('a[href="tel:112"]').first()).toBeVisible();

    // 10. Language switch to EN (profile), then back to PL to leave
    // the shared demo account untouched.
    await loginViaUi(page, DEMO_EMAIL, DEMO_PASSWORD);
    await page.goto('/profile');
    await page.getByRole('button', { name: 'en', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Today' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'pl', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Dzisiaj' }).first()).toBeVisible();
  });
});
