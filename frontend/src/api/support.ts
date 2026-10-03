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
  is_emergency: boolean;
}

// ---- API → UI adapters (backend field names per apps/support serializers) ----
interface ApiStrategy {
  code: string;
  name?: string;
  title?: string;
  description: string;
  steps: string[];
  category: string;
  duration_min?: number;
  duration_minutes?: number;
  icon: string;
  score: number;
  evidence?: { used: number; helped_yes: number; helped_somewhat: number };
  helped_count?: number;
  total_count?: number;
}

function toStrategy(s: ApiStrategy): CopingStrategy {
  return {
    code: s.code,
    title: s.title ?? s.name ?? s.code,
    description: s.description,
    category: s.category,
    duration_minutes: s.duration_minutes ?? s.duration_min ?? 0,
    steps: s.steps ?? [],
    icon: s.icon,
    score: s.score,
    helped_count: s.helped_count ?? s.evidence?.helped_yes ?? 0,
    total_count: s.total_count ?? s.evidence?.used ?? 0,
  };
}

interface ApiHelpline {
  id?: number;
  code?: string;
  name?: string;
  label?: string;
  phone?: string;
  number?: string;
  hours: string;
  is_verified?: boolean;
  is_emergency?: boolean;
  verify?: boolean;
}

function toHelpline(h: ApiHelpline): Helpline {
  const number = h.number ?? h.phone ?? "";
  return {
    code: h.code ?? String(h.id ?? number),
    label: h.label ?? h.name ?? number,
    number,
    number_href: `tel:${number.replace(/[^0-9+]/g, "")}`,
    hours: h.hours,
    verify: h.verify ?? h.is_verified ?? false,
    is_emergency: h.is_emergency ?? false,
  };
}

/** UI says "partly"; the API (SPEC §5) stores "somewhat". */
const toApiHelped = (h?: Helped) => (h === "partly" ? "somewhat" : h);

export function useToolkit(options?: UseQueryOptions<ToolkitResponse>) {
  return useQuery<ToolkitResponse>({
    queryKey: ["support", "toolkit"],
    queryFn: () =>
      apiFetch<ApiStrategy[] | { strategies: ApiStrategy[] }>("/support/toolkit").then((d) => ({
        strategies: (Array.isArray(d) ? d : d.strategies).map(toStrategy),
      })),
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
        body: { ...body, helped: toApiHelped(body.helped) },
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
      apiFetch<unknown>(`/support/contacts/${id}`, { method: "DELETE" }),
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
      apiFetch<ApiHelpline[]>("/support/helplines", { auth: false }).then((rows) => rows.map(toHelpline)),
    staleTime: 30 * 60_000,
  });
}
