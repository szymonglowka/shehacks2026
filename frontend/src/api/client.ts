import i18n from '../app/i18n';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './token-storage';

const BASE_URL = import.meta.env.VITE_API_URL as string | undefined;

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface RefreshResponse {
  access: string;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = getRefreshToken();
      if (!refresh || !BASE_URL) return null;
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as RefreshResponse;
        setTokens(data.access);
        return data.access;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export function logout(): void {
  clearTokens();
  window.location.href = '/welcome';
}

export interface ApiOptions extends RequestInit {
  auth?: boolean;
}

/** Minimal typed fetch client (JWT refresh-on-401 lives here; Part B adds hooks). */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, ...init } = options;
  if (!BASE_URL) throw new Error('VITE_API_URL is not configured');

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept-Language', i18n.language ?? 'pl');
  if (auth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const doFetch = (h: Headers) => fetch(`${BASE_URL}${path}`, { ...init, headers: h });

  let res = await doFetch(headers);
  if (res.status === 401 && auth) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      headers.set('Authorization', `Bearer ${fresh}`);
      res = await doFetch(headers);
    } else {
      logout();
      throw new ApiError(401, 'Unauthorized');
    }
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      detail?: string;
      errors?: Record<string, string[]>;
    };
    throw new ApiError(res.status, body.detail ?? `Request failed (${res.status})`, body.errors);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Alias used by feature modules: same as api<T>() (path relative to VITE_API_URL). */
export interface ApiFetchOptions extends Omit<ApiOptions, 'body'> {
  /** Plain objects are JSON-encoded; strings/FormData/Blob pass through. */
  body?: unknown;
}

export function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, ...rest } = options;
  const encoded =
    body === undefined || body === null || typeof body === 'string' || body instanceof FormData || body instanceof Blob
      ? (body as BodyInit | null | undefined)
      : JSON.stringify(body);
  return api<T>(path, { ...rest, body: encoded });
}

function withBody(method: string, body: unknown, options: ApiOptions): ApiOptions {
  return { ...options, method, body: body === undefined ? undefined : JSON.stringify(body) };
}

export const apiGet = <T = unknown>(path: string, options: ApiOptions = {}) =>
  api<T>(path, { ...options, method: 'GET' });
export const apiPost = <T = unknown>(path: string, body?: unknown, options: ApiOptions = {}) =>
  api<T>(path, withBody('POST', body, options));
export const apiPut = <T = unknown>(path: string, body?: unknown, options: ApiOptions = {}) =>
  api<T>(path, withBody('PUT', body, options));
export const apiPatch = <T = unknown>(path: string, body?: unknown, options: ApiOptions = {}) =>
  api<T>(path, withBody('PATCH', body, options));
export const apiDelete = <T = void>(path: string, options: ApiOptions = {}) =>
  api<T>(path, { ...options, method: 'DELETE' });
