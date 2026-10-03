import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from './client';

export interface CopingStrategyOption {
  code: string;
  name: string;
  description: string;
  category: string;
  duration_min: number;
  icon: string;
}

export interface GoalTemplateOption {
  id: number;
  title: string;
  description: string;
  category: string;
  frequency: 'daily' | 'weekly';
  target_count: number;
  safety_note: string | null;
}

export interface OnboardingOptions {
  coping_strategies: CopingStrategyOption[];
  worsening_factors: string[];
  goal_templates: GoalTemplateOption[];
}

export interface CompleteOnboardingInput {
  profile: {
    display_name: string;
    language: 'pl' | 'en';
    mode: 'postpartum' | 'cycle';
    birth_date?: string | null;
    delivery_type?: 'vaginal' | 'cesarean' | 'undisclosed';
    feeding?: 'breast' | 'mixed' | 'formula' | 'na';
    last_period_date?: string | null;
    avg_cycle_length?: number;
    avg_period_length?: number;
    tone?: 'gentle' | 'motivating';
    checkin_reminder_time?: string | null;
    timezone?: string;
    worsening_factors?: string[];
  };
  coping_scores: Record<string, 0 | 1 | 2 | 3>;
  worsening_factors: string[];
  trusted_contact?: {
    name: string;
    relation: string;
    phone: string;
    preferred_channel: 'sms' | 'whatsapp';
  } | null;
  goal_template_ids: number[];
  custom_goals: Array<{ title: string; category: string; frequency: 'daily' | 'weekly'; target_count: number }>;
}

export function useOnboardingOptions(params: {
  mode?: string;
  week?: number;
  delivery_type?: string;
}) {
  const search = new URLSearchParams();
  if (params.mode) search.set('mode', params.mode);
  if (params.week != null) search.set('week', String(params.week));
  if (params.delivery_type) search.set('delivery_type', params.delivery_type);
  const qs = search.toString();
  return useQuery({
    queryKey: ['onboarding-options', params.mode, params.week, params.delivery_type],
    queryFn: () => apiGet<OnboardingOptions>(`/onboarding/options${qs ? `?${qs}` : ''}`),
  });
}

export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: (body: CompleteOnboardingInput) =>
      apiPost<{ ok: boolean }>('/onboarding/complete', body),
  });
}
