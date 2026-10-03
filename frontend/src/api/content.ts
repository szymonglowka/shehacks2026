import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiList } from "./client";

export interface Article {
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  mode: string;
  reading_minutes: number;
  cover_emoji: string;
}

export interface Specialist {
  id: number;
  name: string;
  specialty: string;
  city: string;
  online: boolean;
  phone: string | null;
  website: string | null;
  description: string;
  is_sample: boolean;
}

export function useArticles(params?: { category?: string; mode?: string }) {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.mode) search.set("mode", params.mode);
  const qs = search.toString();
  return useQuery({
    queryKey: ["articles", params?.category ?? null, params?.mode ?? null],
    queryFn: () => apiList<Article>(`/articles${qs ? `?${qs}` : ""}`),
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ["articles", slug],
    queryFn: () => apiFetch<Article>(`/articles/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useSpecialists(params?: { specialty?: string; city?: string; online?: boolean }) {
  const search = new URLSearchParams();
  if (params?.specialty) search.set("specialty", params.specialty);
  if (params?.city) search.set("city", params.city);
  if (params?.online !== undefined) search.set("online", String(params.online));
  const qs = search.toString();
  return useQuery({
    queryKey: ["specialists", params?.specialty ?? null, params?.city ?? null, params?.online ?? null],
    queryFn: () => apiList<Specialist>(`/specialists${qs ? `?${qs}` : ""}`),
  });
}

export function useSaveVisitQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      apiFetch("/visit-questions", { method: "POST", body: JSON.stringify({ text }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit-questions"] });
    },
  });
}
