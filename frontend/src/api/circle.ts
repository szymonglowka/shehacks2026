// f-care · Circle domain: types + TanStack Query hooks.
// Backend contract: docs/SPEC.md §6.8, §7 (circle endpoints).
// Public endpoints carry no auth and never expose notes/symptoms/EPDS.

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiFetch } from "./client";

export type CareRequestStatus = "open" | "claimed" | "done";

export interface CircleLink {
  token: string;
  url: string;
  share_mood: boolean;
}

export interface CareRequest {
  id: number;
  title: string;
  category: string;
  when_label: string;
  status: CareRequestStatus;
  claimed_by?: string | null;
}

export interface PublicCircle {
  mom_name: string;
  mood_color?: string | null;
  mood_word?: string | null;
  requests: CareRequest[];
}

export function useCircleLink() {
  return useQuery<CircleLink | null>({
    queryKey: ["circle", "link"],
    queryFn: async () => {
      try {
        return await apiFetch<CircleLink>("/circle/link");
      } catch (err) {
        if ((err as { status?: number })?.status === 404) return null;
        throw err;
      }
    },
  });
}

export function useMutateCircleLink() {
  const qc = useQueryClient();
  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ["circle", "link"] });
  const create = useMutation({
    mutationFn: () =>
      apiFetch<CircleLink>("/circle/link", { method: "POST" }),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: (body: { share_mood: boolean }) =>
      apiFetch<CircleLink>("/circle/link", { method: "PATCH", body }),
    onSuccess: invalidate,
  });
  const revoke = useMutation({
    mutationFn: () => apiFetch<void>("/circle/link", { method: "DELETE" }),
    onSuccess: () => {
      qc.setQueryData(["circle", "link"], null);
    },
  });
  return { create, update, revoke };
}

export function useCareRequests() {
  return useQuery<CareRequest[]>({
    queryKey: ["circle", "requests"],
    queryFn: () => apiFetch<CareRequest[]>("/circle/requests"),
  });
}

export function useMutateCareRequests() {
  const qc = useQueryClient();
  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ["circle", "requests"] });
  const create = useMutation({
    mutationFn: (body: {
      title: string;
      category: string;
      when_label: string;
    }) => apiFetch<CareRequest>("/circle/requests", { method: "POST", body }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/circle/requests/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
  return { create, remove };
}

export function usePublicCircle(
  token: string | undefined,
  options?: UseQueryOptions<PublicCircle>,
) {
  return useQuery<PublicCircle>({
    queryKey: ["circle", "public", token],
    queryFn: () =>
      apiFetch<PublicCircle>(`/circle/public/${token}`, { auth: false }),
    enabled: token != null && token.length > 0,
    retry: false,
    ...options,
  });
}

export function useClaimRequest(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      apiFetch<CareRequest>(`/circle/public/${token}/requests/${id}/claim`, {
        method: "POST",
        body: { name },
        auth: false,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["circle", "public", token] });
    },
  });
}

export function useMarkRequestDone(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<CareRequest>(`/circle/public/${token}/requests/${id}/done`, {
        method: "POST",
        auth: false,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["circle", "public", token] });
    },
  });
}
