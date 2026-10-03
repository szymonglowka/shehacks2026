import { http, HttpResponse } from 'msw';
import { isoDay, martaCheckins, martaEpds } from './tracking';

const API = '*/api/v1';

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function buildInsights(range: 7 | 30) {
  const series = [...martaCheckins]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-range)
    .map((c) => ({
      date: c.date,
      mood: c.mood,
      energy: c.energy,
      anxiety: c.anxiety,
      sleep_hours: c.sleep_hours,
    }));
  const good = martaCheckins.filter((c) => c.sleep_hours >= 6).map((c) => c.mood);
  const bad = martaCheckins.filter((c) => c.sleep_hours < 6).map((c) => c.mood);
  const goodAvg = avg(good) ?? 0;
  const badAvg = avg(bad) ?? 0;
  return {
    series,
    phase_mood: null,
    epds_history: martaEpds,
    cards: [
      {
        code: 'sleep_mood',
        params: {
          good_avg: Math.round(goodAvg * 10) / 10,
          bad_avg: Math.round(badAvg * 10) / 10,
          diff: Math.round((goodAvg - badAvg) * 10) / 10,
          pct: 24,
        },
        strength: 'strong',
      },
      {
        code: 'trend',
        params: { last7: 3.6, prev7: 2.4, direction: 'up' },
        strength: 'moderate',
      },
      {
        code: 'toolkit_top',
        params: { strategy: 'short_walk', helped: 4, total: 5 },
        strength: 'moderate',
      },
    ],
    streaks: { checkins: 12, goals: 5 },
  };
}

export const handlers = [
  http.get(`${API}/insights`, ({ request }) => {
    const url = new URL(request.url);
    const range = url.searchParams.get('range') === '7' ? 7 : 30;
    return HttpResponse.json(buildInsights(range));
  }),

  http.get(`${API}/forecast/tomorrow`, () => {
    return HttpResponse.json({
      outlook: 'partly',
      factors: ['postpartum_recovery', 'sleep_ok'],
      tip_code: 'plan_me_time',
    });
  }),

  http.get(`${API}/dashboard`, () => {
    const today = isoDay(0);
    const todayCheckin = martaCheckins.find((c) => c.date === today) ?? null;
    return HttpResponse.json({
      status: {
        mode: 'postpartum',
        days_since_birth: 39,
        postpartum_week: 6,
        stage: 'recovery',
      },
      today_checkin: todayCheckin,
      today_goals: [
        { id: 1, title: 'Szklanka wody', done_today: true },
        { id: 2, title: 'Codzienny check-in', done_today: false },
        { id: 3, title: 'Chwila dla siebie', done_today: false },
      ],
      insight: {
        code: 'sleep_mood',
        params: { good_avg: 4.1, bad_avg: 2.9, diff: 1.2, pct: 24 },
        strength: 'strong',
      },
      epds_due: true,
      article_of_day: {
        slug: 'odpoczynek-w-pologu',
        title: 'Odpoczynek w połogu to nie luksus',
        summary: 'Dlaczego regeneracja po porodzie jest tak samo ważna jak opieka nad maluchem.',
        reading_minutes: 5,
        cover_emoji: 'rest',
      },
      unread_notifications: 1,
    });
  }),

  http.get(`${API}/night/now`, () => {
    return HttpResponse.json({ awake_count: 37 });
  }),
];
