// f-care · Wins domain: types + TanStack Query hooks.
// Backend contract: docs/SPEC.md §7 (CRUD /wins + GET /wins/random).

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "./client";

export interface SmallWin {
  id: number;
  text: string;
  created_at: string;
}

export function useWins() {
  return useQuery<SmallWin[]>({
    queryKey: ["wins"],
    queryFn: () => apiFetch<SmallWin[]>("/wins"),
  });
}

export function useRandomWin(enabled = true) {
  return useQuery<SmallWin | null>({
    queryKey: ["wins", "random"],
    queryFn: async () => {
      try {
        return await apiFetch<SmallWin>("/wins/random");
      } catch (err) {
        if ((err as { status?: number })?.status === 404) return null;
        throw err;
      }
    },
    enabled,
    staleTime: 0,
  });
}

export function useAddWin() {
  const qc = useQueryClient();
  return useMutation({
    // The API requires `date` (SmallWinSerializer); default to today.
    mutationFn: (body: { text: string; date?: string }) =>
      apiFetch<SmallWin>("/wins", {
        method: "POST",
        body: {
          date: new Date().toISOString().slice(0, 10),
          ...body,
        },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["wins"] });
    },
  });
}

export function useDeleteWin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<unknown>(`/wins/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["wins"] });
    },
  });
}
