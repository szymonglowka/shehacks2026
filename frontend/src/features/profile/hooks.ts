import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface ProfileData {
  display_name: string;
  language: string;
  mode: "postpartum" | "cycle";
  postpartum_day: number | null;
  postpartum_week: number | null;
  cycle_day: number | null;
  checkin_reminder_time: string | null;
  night_mode: "auto" | "off";
  push_enabled: boolean;
}

interface CycleStatus {
  mode: string;
  days_since_birth?: number | null;
  postpartum_week?: number | null;
  cycle_day?: number | null;
}

export function useProfile() {
  return useQuery({
    queryKey: ["me", "profile"],
    queryFn: async () => {
      const [{ profile }, status] = await Promise.all([
        apiFetch<{ profile: ProfileData }>("/me"),
        apiFetch<CycleStatus>("/cycle/status").catch(() => null),
      ]);
      return {
        ...profile,
        postpartum_day: status?.days_since_birth ?? profile.postpartum_day,
        postpartum_week: status?.postpartum_week ?? profile.postpartum_week,
        cycle_day: status?.cycle_day ?? profile.cycle_day,
      };
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ProfileData>) =>
      apiFetch<{ profile: ProfileData }>("/me", { method: "PATCH", body: JSON.stringify({ profile: patch }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: () => apiFetch<Record<string, unknown>>("/me/export"),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => apiFetch("/me", { method: "DELETE" }),
  });
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
