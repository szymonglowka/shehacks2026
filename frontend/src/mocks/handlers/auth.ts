import { http, HttpResponse } from 'msw';
import type { Me } from '@/api/me';

const api = (path: string) => `*/api/v1${path}`;

// Demo user Marta per SPEC §9: postpartum, birth 38 days ago,
// C-section, breastfeeding.
function birthDateISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 38);
  return d.toISOString().slice(0, 10);
}

let marta: Me = {
  id: 1,
  email: 'demo@otula.app',
  profile: {
    display_name: 'Marta',
    language: 'pl',
    mode: 'postpartum',
    birth_date: birthDateISO(),
    delivery_type: 'cesarean',
    feeding: 'breast',
    period_returned: false,
    avg_cycle_length: 28,
    avg_period_length: 5,
    tone: 'gentle',
    checkin_reminder_time: '09:00',
    timezone: 'Europe/Warsaw',
    onboarding_completed: true,
    worsening_factors: ['lack_of_sleep'],
    night_mode: 'auto',
    last_seen_at: new Date().toISOString(),
  },
};

const tokens = { access: 'mock-access-token', refresh: 'mock-refresh-token' };

export const handlers = [
  http.post(api('/auth/register'), async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      display_name?: string;
      language?: 'pl' | 'en';
    };
    marta = {
      ...marta,
      email: body.email ?? marta.email,
      profile: {
        ...marta.profile,
        display_name: body.display_name ?? marta.profile.display_name,
        language: body.language ?? marta.profile.language,
        onboarding_completed: false,
      },
    };
    return HttpResponse.json({ ...tokens, user: marta });
  }),

  http.post(api('/auth/login'), () => HttpResponse.json(tokens)),

  http.post(api('/auth/refresh'), async ({ request }) => {
    const body = (await request.json()) as { refresh?: string };
    if (body.refresh !== tokens.refresh) {
      return HttpResponse.json({ detail: 'Invalid refresh token.' }, { status: 401 });
    }
    return HttpResponse.json({ access: tokens.access });
  }),

];

export function getMarta(): Me {
  return marta;
}

export function setMarta(next: Me): void {
  marta = next;
}
