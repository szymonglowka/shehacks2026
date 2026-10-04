// Captures app screenshots for the pitch deck from the running stack (frontend :5190, API :8100).
import { chromium } from '../frontend/node_modules/playwright/index.mjs';

const BASE = 'http://localhost:5190';
const EMAIL = 'demo@otula.app';
const PASSWORD = process.env.DEMO_PASSWORD;
const CIRCLE = process.env.CIRCLE_TOKEN;

const browser = await chromium.launch({ channel: 'chrome' });

async function session(viewport, theme, { login = true, scale = 2 } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, locale: 'pl-PL', timezoneId: 'Europe/Warsaw' });
  await ctx.addInitScript((t) => localStorage.setItem('otula:theme-override', t), theme);
  const page = await ctx.newPage();
  if (login) {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type=email]').fill(EMAIL);
    await page.locator('input[type=password]').fill(PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/(today|night)/);
  }
  return { ctx, page };
}

async function shot(page, path, name, { wait = 1500, full = false, before } = {}) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState('networkidle');
  if (before) await before(page);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `shots/${name}.png`, fullPage: full });
  console.log('saved', name);
}

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };

{ // day, desktop
  const { ctx, page } = await session(desktop, 'day', { scale: 1.5 });
  await shot(page, '/today', 'desktop-today');
  await shot(page, '/patterns', 'desktop-patterns');
  await shot(page, '/report', 'desktop-report');
  await shot(page, '/support', 'desktop-support');
  await ctx.close();
}
{ // day, mobile
  const { ctx, page } = await session(mobile, 'day');
  await shot(page, '/today', 'mobile-today');
  await shot(page, '/checkin', 'mobile-checkin', {
    before: async (p) => { await p.getByRole('radio').nth(2).click().catch(() => {}); },
  });
  await shot(page, '/tough-day', 'mobile-toughday-breath', {
    wait: 2500,
    before: async (p) => { await p.getByRole('button', { name: /^3/ }).first().click(); },
  });
  await page.getByRole('button', { name: /Pomiń|Dalej|Wybierz inną|Co teraz/i }).first().click().catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'shots/mobile-toughday-strategies.png' });
  console.log('saved mobile-toughday-strategies');
  await shot(page, '/goals', 'mobile-goals');
  await shot(page, '/patterns', 'mobile-patterns');
  await ctx.close();
}
{ // night, mobile
  const { ctx, page } = await session(mobile, 'night');
  await shot(page, '/night', 'mobile-night');
  await ctx.close();
}
{ // public circle, logged out, day
  const { ctx, page } = await session(mobile, 'day', { login: false });
  await shot(page, `/c/${CIRCLE}`, 'mobile-circle-public');
  await shot(page, '/help', 'mobile-help');
  await ctx.close();
}
await browser.close();
