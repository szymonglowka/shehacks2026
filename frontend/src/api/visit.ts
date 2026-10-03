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
    mutationFn: () => apiFetch<void>(`/visit-questions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit-questions"] });
    },
  });
}

export function useVisitReport(weeks: 2 | 4 | 6) {
  return useQuery({
    queryKey: ["reports", "visit", weeks],
    queryFn: () => apiFetch<VisitReport>(`/reports/visit?weeks=${weeks}`),
  });
}
