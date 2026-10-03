import {
  expect,
  request as baseRequest,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

/** Root of the REAL backend REST API, with a trailing slash so relative paths ('auth/login') keep /api/v1. */
export const API_URL = `${(process.env.E2E_API_URL ?? 'http://localhost:8110/api/v1').replace(/\/$/, '')}/`;
export const DEMO_EMAIL = process.env.E2E_DEMO_EMAIL ?? 'demo@otula.app';
export const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD ?? 'otula-demo-1234';

export function uniqueEmail(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}@otula-e2e.test`;
}

export async function apiContext(): Promise<APIRequestContext> {
  return baseRequest.newContext({ baseURL: API_URL });
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export async function registerViaApi(
  api: APIRequestContext,
  input: { email: string; password: string; display_name: string },
): Promise<TokenPair> {
  const res = await api.post('auth/register', {
    data: { ...input, language: 'pl', health_data_consent: true },
  });
  expect(res.ok(), `register ${res.status()} ${await res.text()}`).toBeTruthy();
  return (await res.json()) as TokenPair;
}

export async function authApi(access: string): Promise<APIRequestContext> {
  return baseRequest.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${access}` },
  });
}

/** Log in through the real UI (exercises LoginPage + JWT storage + redirect). */
export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/today/);
}

/** Drop all client auth state (tokens live in localStorage per token-storage). */
export async function logoutClientSide(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

/** Night mode is asserted via documentElement data-theme (see useNightMode). */
export async function isNightTheme(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.dataset.theme === 'night');
}
