import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const API = 'http://test.local/api/v1';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('api client', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.stubEnv('VITE_API_URL', API);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('sends Authorization and Accept-Language headers', async () => {
    localStorage.setItem('otula:access', 'aaa');
    localStorage.setItem('otula:refresh', 'rrr');
    const seen: Record<string, string | null> = {};
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        seen.auth = headers.get('Authorization');
        seen.lang = headers.get('Accept-Language');
        expect(url).toBe(`${API}/me`);
        return jsonResponse({ id: 1 });
      }),
    );
    const { api } = await import('./client');
    await api('/me');
    expect(seen.auth).toBe('Bearer aaa');
    expect(seen.lang).toBeTruthy();
  });

  it('refreshes the access token once on 401 and retries', async () => {
    localStorage.setItem('otula:access', 'expired');
    localStorage.setItem('otula:refresh', 'rrr');
    const calls: { url: string; auth: string | null }[] = [];
    let refreshCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const auth = new Headers(init?.headers).get('Authorization');
        calls.push({ url, auth });
        if (url.endsWith('/auth/refresh')) {
          refreshCalls += 1;
          return jsonResponse({ access: 'fresh' });
        }
        if (auth === 'Bearer fresh') return jsonResponse({ id: 1 });
        return jsonResponse({ detail: 'Unauthorized' }, 401);
      }),
    );
    const { api } = await import('./client');
    const [a, b] = await Promise.all([api('/me'), api('/me')]);
    expect(a).toEqual({ id: 1 });
    expect(b).toEqual({ id: 1 });
    expect(refreshCalls).toBe(1);
    expect(localStorage.getItem('otula:access')).toBe('fresh');
  });

  it('clears tokens and throws when refresh fails', async () => {
    localStorage.setItem('otula:access', 'expired');
    localStorage.setItem('otula:refresh', 'bad');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/auth/refresh')) {
          return jsonResponse({ detail: 'Invalid.' }, 401);
        }
        return jsonResponse({ detail: 'Unauthorized.' }, 401);
      }),
    );
    const { api, ApiError } = await import('./client');
    await expect(api('/me')).rejects.toBeInstanceOf(ApiError);
    expect(localStorage.getItem('otula:access')).toBeNull();
    expect(localStorage.getItem('otula:refresh')).toBeNull();
  });
});
