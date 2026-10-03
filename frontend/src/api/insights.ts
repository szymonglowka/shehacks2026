import { useQuery } from '@tanstack/react-query';
import { apiGet } from './client';
import type { CheckIn, EpdsAssessment } from './tracking';

export type ForecastOutlook = 'sunny' | 'partly' | 'cloudy' | 'rainy';

export interface Forecast {
  outlook: ForecastOutlook;
  factors: string[];
  tip_code: 'rest_more' | 'lower_expectations' | 'plan_me_time' | 'ask_circle' | 'keep_going';
}

export interface InsightCardData {
  code: 'sleep_mood' | 'goals_mood' | 'phase_mood' | 'trend' | 'streak' | 'toolkit_top';
  params: Record<string, number | string>;
  /** API sends a 0..1 float; older mocks used labels */
  strength: number | 'weak' | 'moderate' | 'strong';
}

export interface InsightPoint {
  date: string;
  mood: number | null;
  energy: number | null;
  anxiety: number | null;
  sleep_hours: number | null;
}

export interface InsightsResponse {
  series: InsightPoint[];
  phase_mood: Record<string, number> | null;
  epds_history: EpdsAssessment[];
  cards: InsightCardData[];
  streaks: Record<string, number>;
}

export interface DashboardGoal {
  id: number;
  title: string;
  done_today: boolean;
}

export interface Dashboard {
  status: Record<string, unknown>;
  today_checkin: CheckIn | null;
  today_goals: DashboardGoal[];
  insight: InsightCardData | null;
  /** API returns {due, last_at}; normalized to a boolean in useDashboard */
  epds_due: boolean;
  article_of_day: {
    slug: string;
    title: string;
    summary: string;
    reading_minutes: number;
    cover_emoji: string;
  } | null;
  unread_notifications: number;
}

export const insightsKeys = {
  insights: (range: 7 | 30) => ['insights', range] as const,
  forecast: ['forecast-tomorrow'] as const,
  dashboard: ['dashboard'] as const,
};

export function useInsights(range: 7 | 30 = 30) {
  return useQuery({
    queryKey: insightsKeys.insights(range),
    queryFn: () =>
      apiGet<InsightsResponse>(`/insights?range=${range}`).then((d) => ({
        ...d,
        // API history items are {date, total, risk_level}; screens read created_at
        epds_history: (d.epds_history ?? []).map((e) => {
          const item = e as EpdsAssessment & { date?: string };
          return { ...item, created_at: item.created_at ?? item.date ?? '' };
        }),
      })),
  });
}

export function useForecastTomorrow() {
  return useQuery({
    queryKey: insightsKeys.forecast,
    queryFn: () => apiGet<Forecast>('/forecast/tomorrow'),
    staleTime: 1000 * 60 * 15,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: insightsKeys.dashboard,
    queryFn: () =>
      apiGet<Omit<Dashboard, 'epds_due'> & { epds_due: boolean | { due: boolean } }>('/dashboard').then(
        (d) => ({
          ...d,
          epds_due: typeof d.epds_due === 'object' && d.epds_due !== null ? d.epds_due.due : Boolean(d.epds_due),
        }),
      ),
  });
}
