import { http, HttpResponse } from 'msw';
import type { Me } from '@/api/me';
import { getMarta, setMarta } from './auth';

const api = (path: string) => `*/api/v1${path}`;

export const handlers = [
  http.get(api('/me'), () => HttpResponse.json(getMarta())),

  http.patch(api('/me'), async ({ request }) => {
    const body = (await request.json()) as { profile?: Partial<Me['profile']> };
    const current = getMarta();
    const next = { ...current, profile: { ...current.profile, ...body.profile } };
    setMarta(next);
    return HttpResponse.json(next);
  }),

  http.delete(api('/me'), () => new HttpResponse(null, { status: 204 })),

  http.get(api('/me/export'), () =>
    HttpResponse.json({ user: getMarta(), exported_at: new Date().toISOString() }),
  ),

  http.get(api('/push/vapid-public-key'), () =>
    HttpResponse.json({ key: 'BMockVapidPublicKeyForDemoPurposesOnly0000000000000000000' }),
  ),

  http.post(api('/push/subscriptions'), () => new HttpResponse(null, { status: 201 })),

  http.get(api('/notifications'), () => HttpResponse.json({ count: 0, results: [] })),
];
