import { defineConfig, devices } from '@playwright/test';

// Otula E2E runs against the REAL backend (never MSW mocks).
// Backend base URL + demo credentials come from the environment so every
// agent worktree can point at its own compose project:
//
//   E2E_API_URL      backend REST root, e.g. http://localhost:8110/api/v1
//   E2E_PORT         frontend dev-server port (default 5191)
//   E2E_BASE_URL     full frontend URL (default http://localhost:<E2E_PORT>)
//   E2E_DEMO_EMAIL / E2E_DEMO_PASSWORD  seeded demo user (default demo@otula.app)
//   E2E_NO_SERVER    set to skip starting `vite dev` (server already running)
//
// Seed the backend first: migrate + seed_content + seed_demo (+ demo-night
// for the /night awake counter), then:  npm run e2e

const port = Number(process.env.E2E_PORT ?? 5191);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  // One worker: the demo-user script mutates shared seed state (check-in,
  // goal logs) and parallel workers would collide on it.
  workers: 1,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    headless: true,
    locale: 'pl-PL',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: `npm run dev -- --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
        env: {
          ...process.env,
          VITE_API_URL: process.env.E2E_API_URL ?? 'http://localhost:8110/api/v1',
          VITE_USE_MOCKS: 'false',
        } as Record<string, string>,
      },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
