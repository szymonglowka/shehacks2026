import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiList } from "./client";

export interface AppNotification {
  id: number;
  kind: "goal_reminder" | "checkin_reminder" | "epds_due" | "gentle_nudge" | "system";
  title: string;
  body: string;
  url: string;
  created_at: string;
  read_at: string | null;
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiList<AppNotification>("/notifications"),
  });
}

export function useUnreadCount(): number {
  const { data } = useNotifications();
  return data?.filter((n) => !n.read_at).length ?? 0;
}

export function useMarkNotificationRead(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<AppNotification>(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/notifications/read-all", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useSendTestPush() {
  return useMutation({
    mutationFn: () => apiFetch("/push/test", { method: "POST" }),
  });
}

export function useVapidPublicKey() {
  return useQuery({
    queryKey: ["push", "vapid-key"],
    queryFn: () => apiFetch<{ public_key: string }>("/push/vapid-public-key"),
  });
}
