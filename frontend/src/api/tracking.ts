import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client';

export type Bleeding = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';
export type RiskLevel = 'none' | 'info' | 'moderate' | 'high' | 'urgent';
export type EpdsRiskLevel = 'low' | 'moderate' | 'high' | 'urgent';

export interface CheckIn {
  date: string;
  mood: number | null;
  energy: number | null;
  anxiety: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  pain: number | null;
  emotions: string[];
  bleeding: Bleeding | null;
  symptoms: string[];
  red_flags: string[];
  note: string;
  created_at?: string;
  updated_at?: string;
}

export interface RiskResult {
  level: RiskLevel;
  reasons: string[];
  actions: string[];
}

export interface UpsertCheckinResponse {
  checkin: CheckIn;
  risk: RiskResult;
}

export type CycleStatus =
  | {
      mode: 'postpartum';
      days_since_birth: number | null;
      postpartum_week: number | null;
      stage: 'early' | 'recovery' | 'beyond' | null;
    }
  | {
      mode: 'cycle';
      // Fresh cycle-mode profiles have no period yet → backend sends nulls.
      cycle_day: number | null;
      phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | null;
      next_period_date: string | null;
      confidence: 'low' | 'medium' | 'high';
    };

export interface Period {
  id: number;
  start_date: string;
  end_date: string | null;
}

export interface EpdsQuestion {
  /** Backend field name is `number` (1-based). */
  number: number;
  text: string;
  options: string[];
}

export interface EpdsAssessment {
  id: number;
  answers: number[];
  total: number;
  self_harm_score: number;
  risk_level: EpdsRiskLevel;
  created_at: string;
}

export interface EpdsDue {
  due: boolean;
  last_at: string | null;
}

export const trackingKeys = {
  checkins: (from: string, to: string) => ['checkins', from, to] as const,
  checkin: (date: string) => ['checkin', date] as const,
  cycleStatus: ['cycle-status'] as const,
  periods: ['periods'] as const,
  epdsQuestions: ['epds-questions'] as const,
  epdsHistory: ['epds-history'] as const,
  epdsDue: ['epds-due'] as const,
};

export function useCheckins(from: string, to: string) {
  return useQuery({
    queryKey: trackingKeys.checkins(from, to),
    queryFn: () => apiGet<CheckIn[]>(`/checkins?from=${from}&to=${to}`),
  });
}

/** GET /checkins/{date} → 404 when the day has no check-in; callers get null. */
export async function fetchCheckin(date: string): Promise<CheckIn | null> {
  try {
    return await apiGet<CheckIn>(`/checkins/${date}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export function useCheckin(date: string) {
  return useQuery({
    queryKey: trackingKeys.checkin(date),
    queryFn: () => fetchCheckin(date),
  });
}

export interface UpsertCheckinInput extends Partial<CheckIn> {
  date: string;
}

export function useUpsertCheckin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ date, ...body }: UpsertCheckinInput) =>
      apiPut<UpsertCheckinResponse>(`/checkins/${date}`, body),
    onSuccess: (_data, vars) => {
      client.invalidateQueries({ queryKey: ['checkin', vars.date] });
      client.invalidateQueries({ queryKey: ['checkins'] });
      client.invalidateQueries({ queryKey: ['dashboard'] });
      client.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useCycleStatus() {
  return useQuery({
    queryKey: trackingKeys.cycleStatus,
    queryFn: () => apiGet<CycleStatus>('/cycle/status'),
  });
}

export function usePeriods() {
  return useQuery({
    queryKey: trackingKeys.periods,
    queryFn: () => apiGet<Period[]>('/periods'),
  });
}

export function useCreatePeriod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { start_date: string; end_date?: string | null }) =>
      apiPost<Period>('/periods', body),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: trackingKeys.periods });
      client.invalidateQueries({ queryKey: trackingKeys.cycleStatus });
      client.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdatePeriod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; start_date?: string; end_date?: string | null }) =>
      apiPatch<Period>(`/periods/${id}`, body),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: trackingKeys.periods });
      client.invalidateQueries({ queryKey: trackingKeys.cycleStatus });
      client.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeletePeriod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/periods/${id}`),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: trackingKeys.periods });
      client.invalidateQueries({ queryKey: trackingKeys.cycleStatus });
      client.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function usePeriodReturned() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { start_date: string }) =>
      // Backend returns {mode: 'cycle', period: {...}}; status refetch carries the view.
      apiPost<{ mode: string; period: Period }>('/profile/period-returned', body),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: trackingKeys.periods });
      client.invalidateQueries({ queryKey: trackingKeys.cycleStatus });
      client.invalidateQueries({ queryKey: ['dashboard'] });
      client.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useEpdsQuestions() {
  return useQuery({
    queryKey: trackingKeys.epdsQuestions,
    queryFn: () => apiGet<EpdsQuestion[]>('/epds/questions'),
  });
}

export function useEpdsHistory() {
  return useQuery({
    queryKey: trackingKeys.epdsHistory,
    queryFn: () => apiGet<EpdsAssessment[]>('/epds'),
  });
}

export function useSubmitEpds() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (answers: number[]) =>
      apiPost<{ assessment: EpdsAssessment; risk: RiskResult }>('/epds', { answers }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: trackingKeys.epdsHistory });
      client.invalidateQueries({ queryKey: trackingKeys.epdsDue });
      client.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useEpdsDue() {
  return useQuery({
    queryKey: trackingKeys.epdsDue,
    queryFn: () => apiGet<EpdsDue>('/epds/due'),
  });
}

/** Map backend risk actions to frontend destinations. Pure helper, unit-tested. */
export function riskActionTarget(action: string): string {
  switch (action) {
    case 'show_crisis':
    case 'show_emergency':
      return '/help';
    case 'show_specialists':
      return '/knowledge?tab=specialists';
    case 'contact_specialist':
      return '/knowledge?tab=specialists';
    case 'contact_doctor_now':
      return '/help';
    case 'open_toolkit':
      return '/support';
    case 'open_breathing':
      return '/tough-day';
    case 'ask_support':
      return '/support';
    case 'suggest_epds':
      return '/epds';
    case 'repeat_epds_14d':
      return '/epds';
    case 'read_baby_blues':
      return '/knowledge/baby-blues-vs-pnd';
    case 'read_ppd':
      return '/knowledge/baby-blues-vs-pnd';
    default:
      return '/today';
  }
}
