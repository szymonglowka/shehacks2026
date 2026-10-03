import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

export interface VisitQuestion {
  id: number;
  text: string;
  done: boolean;
  created_at: string;
}

export interface VisitReport {
  profile: {
    display_name: string;
    mode: string;
    postpartum_day: number | null;
    postpartum_week: number | null;
    delivery_type: string | null;
    feeding: string | null;
  };
  weeks: number;
  range: { from: string; to: string };
  mood_sleep_series: { date: string; mood: number | null; sleep_hours: number | null }[];
  epds_history: { date: string; total: number }[];
  symptom_frequency: { code: string; count: number }[];
  red_flags: { date: string; code: string }[];
  questions: VisitQuestion[];
}

export function useVisitQuestions() {
  return useQuery({
    queryKey: ["visit-questions"],
    queryFn: () => apiFetch<VisitQuestion[]>("/visit-questions"),
  });
}

export function useAddVisitQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      apiFetch<VisitQuestion>("/visit-questions", {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit-questions"] });
    },
  });
}

export function useToggleVisitQuestion(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (done: boolean) =>
      apiFetch<VisitQuestion>(`/visit-questions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ done }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit-questions"] });
    },
  });
}

export function useDeleteVisitQuestion(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/visit-questions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit-questions"] });
    },
  });
}

interface ApiVisitReport {
  profile: VisitReport["profile"];
  weeks: number;
  since?: string;
  range?: VisitReport["range"];
  questions: VisitQuestion[];
  symptoms?: { symptom: string; count: number }[];
  red_flags?: { date: string; red_flags: string[] }[] | VisitReport["red_flags"];
  epds?: { history: { date: string; total: number }[] };
  epds_history?: VisitReport["epds_history"];
  mood_sleep_series?: VisitReport["mood_sleep_series"];
  symptom_frequency?: VisitReport["symptom_frequency"];
}

/** Adapts /reports/visit to the report screen; the daily mood/sleep series comes from /insights. */
async function fetchVisitReport(weeks: 2 | 4 | 6): Promise<VisitReport> {
  const [r, insights] = await Promise.all([
    apiFetch<ApiVisitReport>(`/reports/visit?weeks=${weeks}`),
    apiFetch<{ series: { date: string; mood: number | null; sleep_hours: number | null }[] }>(
      `/insights?range=30`,
    ).catch(() => ({ series: [] })),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const from = r.range?.from ?? r.since ?? today;
  const redFlags = (r.red_flags ?? []).flatMap((f) =>
    "red_flags" in f ? f.red_flags.map((code) => ({ date: f.date, code })) : [f],
  );
  return {
    profile: r.profile,
    weeks: r.weeks,
    range: r.range ?? { from, to: today },
    mood_sleep_series:
      r.mood_sleep_series ??
      insights.series
        .filter((p) => p.date >= from)
        .map((p) => ({ date: p.date, mood: p.mood, sleep_hours: p.sleep_hours })),
    epds_history: r.epds_history ?? r.epds?.history ?? [],
    symptom_frequency:
      r.symptom_frequency ?? (r.symptoms ?? []).map((s) => ({ code: s.symptom, count: s.count })),
    red_flags: redFlags,
    questions: r.questions,
  };
}

export function useVisitReport(weeks: 2 | 4 | 6) {
  return useQuery({
    queryKey: ["reports", "visit", weeks],
    queryFn: () => fetchVisitReport(weeks),
  });
}
