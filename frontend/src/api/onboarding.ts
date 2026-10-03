import i18n from 'i18next';
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

// The API returns bilingual *_pl/*_en fields and {code,label_*} worsening factors.
type Bilingual = Record<string, unknown>;
interface ApiOnboardingOptions {
  coping_strategies: Bilingual[];
  worsening_factors: (string | Bilingual)[];
  goal_templates: Bilingual[];
}

function pick(o: Bilingual, field: string): string {
  const lang = i18n.language?.startsWith('en') ? 'en' : 'pl';
  return String(o[field] ?? o[`${field}_${lang}`] ?? o[`${field}_pl`] ?? '');
}

function localizeOptions(d: ApiOnboardingOptions): OnboardingOptions {
  return {
    coping_strategies: d.coping_strategies.map((s) => ({
      code: String(s.code),
      name: pick(s, 'name'),
      description: pick(s, 'description'),
      category: String(s.category),
      duration_min: Number(s.duration_min ?? 0),
      icon: String(s.icon ?? ''),
    })),
    // screens translate factor codes themselves
    worsening_factors: d.worsening_factors.map((f) => (typeof f === 'string' ? f : String(f.code))),
    goal_templates: d.goal_templates.map((g) => ({
      id: Number(g.id),
      title: pick(g, 'title'),
      description: pick(g, 'description'),
      category: String(g.category),
      frequency: g.frequency as 'daily' | 'weekly',
      target_count: Number(g.target_count ?? 1),
      safety_note: pick(g, 'safety_note') || null,
    })),
  };
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
    queryFn: () =>
      apiGet<ApiOnboardingOptions>(`/onboarding/options${qs ? `?${qs}` : ''}`).then(localizeOptions),
  });
}

export interface CompleteOnboardingResult {
  user: {
    id: number;
    email: string;
    profile: Record<string, unknown>;
  };
}

export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: (body: CompleteOnboardingInput) =>
      apiPost<CompleteOnboardingResult>('/onboarding/complete', body),
  });
}
