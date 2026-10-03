// f-care · Support domain: types + TanStack Query hooks.
// Backend contract: docs/SPEC.md §7 (support endpoints), localized strings
// via Accept-Language (set by api/client from i18n).

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiFetch } from "./client";

export type Helped = "yes" | "partly" | "no";

export interface CopingStrategy {
  code: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  steps: string[];
  icon: string;
  /** Bayesian ranking score (SPEC W1). Higher = better match for this mum. */
  score: number;
  helped_count: number;
  total_count: number;
}

export interface ToolkitResponse {
  strategies: CopingStrategy[];
}

export interface RiskState {
  level: "none" | "info" | "moderate" | "high" | "urgent";
  reasons: string[];
  actions: string[];
}

export interface SupportSession {
  id: number;
  intensity: number;
  trigger?: string | null;
  strategy?: string | null;
  helped?: Helped | null;
  mood_after?: number | null;
  risk?: RiskState | null;
  created_at: string;
}

export interface TrustedContact {
  id: number;
  name: string;
  relation: string;
  phone: string;
}

export interface SupportMessage {
  text: string;
  sms_url: string;
  whatsapp_url: string;
}

export interface Helpline {
  code: string;
  label: string;
  number: string;
  number_href: string;
  hours: string;
  verify: boolean;
}

export function useToolkit(options?: UseQueryOptions<ToolkitResponse>) {
  return useQuery<ToolkitResponse>({
    queryKey: ["support", "toolkit"],
    queryFn: () => apiFetch<ToolkitResponse>("/support/toolkit"),
    staleTime: 60_000,
    ...options,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { intensity: number; trigger?: string }) =>
      apiFetch<{ session: SupportSession; risk: RiskState | null }>(
        "/support/sessions",
        { method: "POST", body },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["support", "toolkit"] });
    },
  });
}

export function useUpdateSession(sessionId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      strategy?: string;
      helped?: Helped;
      mood_after?: number;
    }) =>
      apiFetch<SupportSession>(`/support/sessions/${sessionId}`, {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["support", "toolkit"] });
    },
  });
}

export function useSavePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { coping_scores: Record<string, 0 | 1 | 2 | 3> }) =>
      apiFetch<{ ok: true }>("/support/preferences", {
        method: "PUT",
        body,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["support", "toolkit"] });
    },
  });
}

export function useContacts() {
  return useQuery<TrustedContact[]>({
    queryKey: ["support", "contacts"],
    queryFn: () => apiFetch<TrustedContact[]>("/support/contacts"),
  });
}

export function useMutateContacts() {
  const qc = useQueryClient();
  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ["support", "contacts"] });
  const create = useMutation({
    mutationFn: (body: { name: string; relation: string; phone: string }) =>
      apiFetch<TrustedContact>("/support/contacts", {
        method: "POST",
        body,
      }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/support/contacts/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
  return { create, remove };
}

export function useSupportMessage(contactId: number | null) {
  return useQuery<SupportMessage>({
    queryKey: ["support", "contacts", contactId, "message"],
    queryFn: () =>
      apiFetch<SupportMessage>(`/support/contacts/${contactId}/message`),
    enabled: contactId != null,
    staleTime: 5 * 60_000,
  });
}

export function useHelplines() {
  return useQuery<Helpline[]>({
    queryKey: ["support", "helplines"],
    queryFn: () =>
      apiFetch<Helpline[]>("/support/helplines", { auth: false }),
    staleTime: 30 * 60_000,
  });
}
