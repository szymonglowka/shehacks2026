import { describe, expect, it } from 'vitest';
import { collectFeatureRoutes } from './route-registry';

describe('feature route auto-registration', () => {
  it('registers every contracted route', () => {
    const paths = collectFeatureRoutes().map((r) => r.path);
    for (const expected of [
      '/welcome',
      '/login',
      '/register',
      '/onboarding',
      '/today',
      '/calendar',
      '/patterns',
      '/goals',
      '/support',
      '/knowledge',
      '/knowledge/:slug',
      '/profile',
      '/notifications',
      '/report',
      '/epds',
      '/night',
      '/help',
      '/c/:token',
      '/checkin',
      '/tough-day',
    ]) {
      expect(paths, `missing route ${expected}`).toContain(expected);
    }
  });

  it('marks public routes (crisis + circle + auth)', () => {
    const byPath = new Map(collectFeatureRoutes().map((r) => [r.path, r]));
    for (const p of ['/help', '/c/:token', '/welcome', '/login', '/register']) {
      expect(
        (byPath.get(p)?.handle as { public?: boolean } | undefined)?.public,
        `${p} should be public`,
      ).toBe(true);
    }
    expect(
      (byPath.get('/today')?.handle as { public?: boolean } | undefined)?.public,
    ).not.toBe(true);
  });
});
