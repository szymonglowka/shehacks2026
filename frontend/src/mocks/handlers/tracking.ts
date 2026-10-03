import { http, HttpResponse } from 'msw';

const API = '*/api/v1';

/* Deterministic pseudo-random so Marta's story is stable across reloads. */
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

export function isoDay(offsetAgo: number, base = new Date()): string {
  const d = new Date(base);
  d.setDate(d.getDate() - offsetAgo);
  return d.toISOString().slice(0, 10);
}

/**
 * Marta, 6 weeks postpartum (birth 39 days ago, C-section, breastfeeding).
 * Arc: steady start → dip in weeks 2–3 → recovery after walks + longer sleep.
 */
export interface MartaCheckin {
  date: string;
  mood: number;
  energy: number;
  anxiety: number;
  sleep_hours: number;
  sleep_quality: number;
  pain: number;
  emotions: string[];
  bleeding: string;
  symptoms: string[];
  red_flags: string[];
  note: string;
  created_at: string;
  updated_at: string;
}

export function buildMartaCheckins(): MartaCheckin[] {
  const r = rand(39);
  const out: MartaCheckin[] = [];
  for (let ago = 41; ago >= 0; ago -= 1) {
    const weekAge = 42 - ago; // 1..42 postpartum day
    let mood: number;
    let sleep: number;
    if (weekAge <= 10) {
      mood = 3 + Math.round(r() * 1);
      sleep = 4 + Math.round(r() * 4) / 2;
    } else if (weekAge <= 22) {
      // dip, weeks 2–3
      mood = 2 + (r() < 0.3 ? 1 : 0);
      sleep = 2.5 + Math.round(r() * 4) / 2;
    } else {
      // recovery: walks + sleep
      mood = 3 + (r() < 0.6 ? 1 : 0);
      sleep = 5 + Math.round(r() * 4) / 2;
    }
    const pain = weekAge < 14 ? 3 + Math.round(r() * 3) : Math.round(r() * 2);
    const emotions =
      mood <= 2
        ? ['tired', 'overwhelmed', 'lonely']
        : mood === 3
          ? ['tired', 'tender']
          : ['calm', 'grateful', 'tender'];
    out.push({
      date: isoDay(ago),
      mood,
      energy: Math.max(1, Math.min(5, mood + (r() < 0.5 ? 0 : 1) - (sleep < 5 ? 1 : 0))),
      anxiety: mood <= 2 ? 4 : 2 + Math.round(r() * 1),
      sleep_hours: sleep,
      sleep_quality: sleep >= 6 ? 4 : sleep >= 4.5 ? 3 : 2,
      pain,
      emotions,
      bleeding: weekAge < 21 ? 'light' : weekAge < 35 ? 'spotting' : 'none',
      symptoms: mood <= 2 ? ['lack_of_sleep', 'back_pain'] : sleep < 5 ? ['lack_of_sleep'] : [],
      red_flags: [],
      note: '',
      created_at: `${isoDay(ago)}T08:20:00.000Z`,
      updated_at: `${isoDay(ago)}T08:20:00.000Z`,
    });
  }
  // Hand-written notes on landmark days (shown as annotations in Patterns).
  const byDate = new Map(out.map((c) => [c.date, c]));
  const n1 = byDate.get(isoDay(26));
  if (n1) n1.note = 'Pierwszy dłuższy spacer we dwoje. Głowa jakby lżejsza.';
  const n2 = byDate.get(isoDay(30));
  if (n2) n2.note = 'Mama wzięła nocne karmienie. Spałam 6 godzin z rzędu.';
  const n3 = byDate.get(isoDay(16));
  if (n3) n3.note = 'Kawa znowu wystygła. Płakałam przy prasowaniu, sama nie wiem czemu.';
  return out;
}

export const martaCheckins = buildMartaCheckins();

/**
 * EPDS wording. Scoring: items 1, 2, 4 normal; 3, 5–10 reversed (option order
 * in `options` reflects that). After Cox, Holden & Sagovsky (1987),
 * Br J Psychiatry 150:782–786. Polish wording is the commonly used translation
 * (verification of the licensed Polish version is still pending — see seed data).
 */
const EPDS_PL = [
  {
    text: 'Potrafiłam się śmiać i dostrzegać zabawne strony życia',
    options: [
      'Tak często jak zwykle',
      'Raczej rzadziej niż zwykle',
      'Zdecydowanie rzadziej niż zwykle',
      'Wcale',
    ],
  },
  {
    text: 'Patrzyłam w przyszłość z radością',
    options: [
      'Tak jak zawsze',
      'Raczej mniej niż kiedyś',
      'Zdecydowanie mniej niż kiedyś',
      'Prawie wcale',
    ],
  },
  {
    text: 'Obwiniałam się niepotrzebnie, gdy coś poszło nie tak',
    options: [
      'Wcale',
      'Rzadko',
      'Często',
      'Przez większość czasu',
    ],
  },
  {
    text: 'Czułam niepokój i martwiłam się bez wyraźnego powodu',
    options: ['Wcale', 'Rzadko', 'Często', 'Bardzo często'],
  },
  {
    text: 'Czułam lęk lub panikę bez wyraźnego powodu',
    options: ['Wcale', 'Rzadko', 'Często', 'Bardzo często'],
  },
  {
    text: 'Czułam, że sprawy mnie przerastają',
    options: [
      'Radziłam sobie jak zwykle',
      'Czasem gorzej niż zwykle',
      'Często gorzej niż zwykle',
      'Prawie wcale sobie nie radziłam',
    ],
  },
  {
    text: 'Czułam się tak nieszczęśliwa, że nie mogłam spać',
    options: ['Wcale', 'Rzadko', 'Często', 'Przez większość czasu'],
  },
  {
    text: 'Czułam się smutna i przygnębiona',
    options: ['Wcale', 'Rzadko', 'Często', 'Przez większość czasu'],
  },
  {
    text: 'Czułam się tak nieszczęśliwa, że płakałam',
    options: ['Wcale', 'Rzadko', 'Często', 'Przez większość czasu'],
  },
  {
    text: 'Myślałam o zrobieniu sobie krzywdy',
    options: ['Nigdy', 'Rzadko', 'Często', 'Bardzo często'],
  },
];

const EPDS_EN = [
  {
    text: 'I have been able to laugh and see the funny side of things',
    options: [
      'As much as I always could',
      'Not quite so much now',
      'Definitely not so much now',
      'Not at all',
    ],
  },
  {
    text: 'I have looked forward with enjoyment to things',
    options: [
      'As much as I ever did',
      'Rather less than I used to',
      'Definitely less than I used to',
      'Hardly at all',
    ],
  },
  {
    text: 'I have blamed myself unnecessarily when things went wrong',
    options: ['Never', 'Rarely', 'Often', 'Most of the time'],
  },
  {
    text: 'I have been anxious or worried for no good reason',
    options: ['Not at all', 'Rarely', 'Often', 'Very often'],
  },
  {
    text: 'I have felt scared or panicky for no very good reason',
    options: ['Not at all', 'Rarely', 'Often', 'Very often'],
  },
  {
    text: 'Things have been getting on top of me',
    options: [
      'I coped as well as ever',
      'Sometimes worse than usual',
      'Often worse than usual',
      'I hardly coped at all',
    ],
  },
  {
    text: 'I have been so unhappy that I have had difficulty sleeping',
    options: ['Not at all', 'Rarely', 'Often', 'Most of the time'],
  },
  {
    text: 'I have felt sad or miserable',
    options: ['Not at all', 'Rarely', 'Often', 'Most of the time'],
  },
  {
    text: 'I have been so unhappy that I have been crying',
    options: ['Not at all', 'Rarely', 'Often', 'Most of the time'],
  },
  {
    text: 'The thought of harming myself has occurred to me',
    options: ['Never', 'Rarely', 'Often', 'Very often'],
  },
];

function epdsRisk(total: number, q10: number) {
  if (q10 >= 1) return 'urgent';
  if (total >= 13) return 'high';
  if (total >= 10) return 'moderate';
  return 'low';
}

export const martaEpds = [
  {
    id: 3,
    answers: [1, 1, 1, 1, 0, 1, 0, 1, 0, 0],
    total: 8,
    self_harm_score: 0,
    risk_level: 'low',
    created_at: `${isoDay(4)}T09:00:00.000Z`,
  },
  {
    id: 2,
    answers: [1, 1, 2, 1, 1, 2, 1, 1, 0, 0],
    total: 11,
    self_harm_score: 0,
    risk_level: 'moderate',
    created_at: `${isoDay(18)}T09:00:00.000Z`,
  },
  {
    id: 1,
    answers: [2, 1, 2, 2, 1, 2, 1, 2, 1, 0],
    total: 14,
    self_harm_score: 0,
    risk_level: 'high',
    created_at: `${isoDay(32)}T09:00:00.000Z`,
  },
];

let periods = [{ id: 1, start_date: isoDay(60), end_date: isoDay(55) }];

export const handlers = [
  http.get(`${API}/checkins`, ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    return HttpResponse.json(
      martaCheckins.filter((c) => (!from || c.date >= from) && (!to || c.date <= to)),
    );
  }),

  http.get(`${API}/checkins/:date`, ({ params }) => {
    const found = martaCheckins.find((c) => c.date === params.date);
    return HttpResponse.json(found ?? null);
  }),

  http.put(`${API}/checkins/:date`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<MartaCheckin>;
    const date = String(params.date);
    const existing = martaCheckins.find((c) => c.date === date);
    const checkin = {
      ...(existing ?? {
        date,
        mood: null,
        energy: null,
        anxiety: null,
        sleep_hours: null,
        sleep_quality: null,
        pain: null,
        emotions: [],
        bleeding: 'none',
        symptoms: [],
        red_flags: [],
        note: '',
      }),
      ...body,
      date,
      updated_at: new Date().toISOString(),
    };
    if (!existing) martaCheckins.push(checkin as MartaCheckin);
    const recent = [...martaCheckins]
      .filter((c) => c.date <= date && typeof c.mood === 'number')
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 4);
    const lowCount = recent.filter((c) => (c.mood as number) <= 2).length;
    const hasRedFlags = (checkin.red_flags ?? []).length > 0;
    const risk = hasRedFlags
      ? { level: 'urgent', reasons: ['red_flags'], actions: ['contact_doctor_now', 'show_emergency'] }
      : lowCount >= 3
        ? {
            level: 'moderate',
            reasons: ['low_mood_streak'],
            actions: ['open_toolkit', 'ask_support', 'suggest_epds'],
          }
        : (checkin.anxiety ?? 0) >= 4
          ? { level: 'info', reasons: ['anxiety'], actions: ['open_breathing'] }
          : { level: 'none', reasons: [], actions: [] };
    return HttpResponse.json({ checkin, risk });
  }),

  http.get(`${API}/cycle/status`, () => {
    return HttpResponse.json({
      mode: 'postpartum',
      days_since_birth: 39,
      postpartum_week: 6,
      stage: 'recovery',
    });
  }),

  http.get(`${API}/periods`, () => HttpResponse.json(periods)),

  http.post(`${API}/periods`, async ({ request }) => {
    const body = (await request.json()) as { start_date: string; end_date?: string | null };
    const created = { id: Date.now(), start_date: body.start_date, end_date: body.end_date ?? null };
    periods.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch(`${API}/periods/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { end_date?: string | null };
    periods = periods.map((p) =>
      String(p.id) === String(params.id) ? { ...p, ...body } : p,
    );
    return HttpResponse.json(periods.find((p) => String(p.id) === String(params.id)));
  }),

  http.delete(`${API}/periods/:id`, ({ params }) => {
    periods = periods.filter((p) => String(p.id) !== String(params.id));
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API}/profile/period-returned`, async ({ request }) => {
    const body = (await request.json()) as { start_date: string };
    periods.push({ id: Date.now(), start_date: body.start_date, end_date: null });
    return HttpResponse.json({
      mode: 'cycle',
      cycle_day: 1,
      phase: 'menstrual',
      next_period_date: null,
      confidence: 'low',
    });
  }),

  http.get(`${API}/epds/questions`, ({ request }) => {
    const lang = (request.headers.get('Accept-Language') ?? 'pl').toLowerCase();
    const set = lang.startsWith('en') ? EPDS_EN : EPDS_PL;
    return HttpResponse.json(set.map((q, i) => ({ index: i + 1, ...q })));
  }),

  http.get(`${API}/epds`, () => HttpResponse.json(martaEpds)),

  http.post(`${API}/epds`, async ({ request }) => {
    const { answers } = (await request.json()) as { answers: number[] };
    const total = answers.reduce((a, b) => a + b, 0);
    const q10 = answers[9] ?? 0;
    const risk_level = epdsRisk(total, q10);
    const assessment = {
      id: Date.now(),
      answers,
      total,
      self_harm_score: q10,
      risk_level,
      created_at: new Date().toISOString(),
    };
    const risk =
      risk_level === 'urgent'
        ? { level: 'urgent', reasons: ['epds_self_harm'], actions: ['show_crisis'] }
        : risk_level === 'high'
          ? {
              level: 'high',
              reasons: ['epds_high'],
              actions: ['contact_specialist', 'show_specialists', 'ask_support'],
            }
          : risk_level === 'moderate'
            ? { level: 'moderate', reasons: ['epds_moderate'], actions: ['repeat_epds_14d', 'open_toolkit'] }
            : { level: 'none', reasons: [], actions: [] };
    return HttpResponse.json({ assessment, risk }, { status: 201 });
  }),

  http.get(`${API}/epds/due`, () => {
    return HttpResponse.json({ due: true, last_at: isoDay(4) });
  }),
];
