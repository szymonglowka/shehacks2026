import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

export interface Goal {
  id: number;
  title: string;
  description: string;
  category: string;
  frequency: "daily" | "weekly";
  target_count: number;
  reminder_enabled: boolean;
  reminder_time: string | null;
  reminder_weekdays: number[];
  is_active: boolean;
  current_streak: number;
  done_today: boolean;
  /** 0..7 completed days this week (Mon–Sun) for daily goals, or 0..target_count progress */
  progress_this_week: boolean[];
}

export interface GoalTemplate {
  id: number;
  title: string;
  description: string;
  category: string;
  frequency: "daily" | "weekly";
  target_count: number;
  default_reminder_time: string | null;
  safety_note: string | null;
  /** Human reason why this template fits the user right now */
  reason: string | null;
}

export interface GoalFormValues {
  title: string;
  category: string;
  frequency: "daily" | "weekly";
  target_count: number;
  reminder_enabled: boolean;
  reminder_time: string | null;
  reminder_weekdays: number[];
}

export function validateGoalForm(
  values: GoalFormValues,
  t: (key: string) => string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.title.trim()) errors.title = t("form.errorTitleRequired");
  else if (values.title.trim().length > 120) errors.title = t("form.errorTitleTooLong");
  if (values.frequency === "weekly" && (values.target_count < 1 || values.target_count > 7)) {
    errors.target_count = t("form.errorTargetRange");
  }
  if (values.reminder_enabled) {
    if (!values.reminder_time) errors.reminder_time = t("form.errorTimeRequired");
    if (values.reminder_weekdays.length === 0) errors.reminder_weekdays = t("form.errorDaysRequired");
  }
  return errors;
}

export function reminderSentence(
  values: Pick<GoalFormValues, "reminder_time" | "reminder_weekdays">,
  dayNames: string[],
  template: string,
): string | null {
  if (!values.reminder_time || values.reminder_weekdays.length === 0) return null;
  const days = [...values.reminder_weekdays]
    .sort((a, b) => a - b)
    .map((d) => dayNames[d])
    .join(", ");
  return template.replace("{days}", days).replace("{time}", values.reminder_time);
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () => apiFetch<Goal[]>("/goals"),
  });
}

export function useTodayGoals() {
  return useQuery({
    queryKey: ["goals", "today"],
    queryFn: () => apiFetch<Goal[]>("/goals/today"),
  });
}

export function useRecommendedGoals() {
  return useQuery({
    queryKey: ["goals", "recommended"],
    queryFn: () => apiFetch<GoalTemplate[]>("/goals/recommended"),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: GoalFormValues) =>
      apiFetch<Goal>("/goals", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useUpdateGoal(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<GoalFormValues>) =>
      apiFetch<Goal>(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useDeleteGoal(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useLogGoal(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (completed = true) =>
      apiFetch(`/goals/${id}/log`, {
        method: "POST",
        body: JSON.stringify({ completed }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
