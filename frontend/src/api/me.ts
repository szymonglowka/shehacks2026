import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { getAccessToken } from './token-storage';

export type Mode = 'postpartum' | 'cycle';
export type NightMode = 'auto' | 'off';

export interface Profile {
  display_name: string;
  language: 'pl' | 'en';
  mode: Mode;
  birth_date: string | null;
  delivery_type: 'vaginal' | 'cesarean' | 'undisclosed';
  feeding: 'breast' | 'mixed' | 'formula' | 'na';
  period_returned: boolean;
  avg_cycle_length: number;
  avg_period_length: number;
  tone: 'gentle' | 'motivating';
  checkin_reminder_time: string | null;
  timezone: string;
  onboarding_completed: boolean;
  worsening_factors: string[];
  night_mode: NightMode;
  last_seen_at: string | null;
}

export interface Me {
  id: number;
  email: string;
  profile: Profile;
}

export const meKey = ['me'];

export function useMe() {
  const hasToken = getAccessToken() !== null;
  return useQuery({
    queryKey: meKey,
    queryFn: () => api<Me>('/me'),
    enabled: hasToken,
    retry: false,
    staleTime: 60_000,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Profile>) => api<Me>('/me', { method: 'PATCH', body: JSON.stringify({ profile: patch }) }),
    onSuccess: (me) => queryClient.setQueryData(meKey, me),
  });
}
