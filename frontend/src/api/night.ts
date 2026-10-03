// f-care · Night domain: types + TanStack Query hooks.
// Backend contract: docs/SPEC.md §6.7, §7 (GET /night/now).
// awake_count is null when < 5 (privacy) — UI hides the line then.

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiFetch } from "./client";

export interface NightNow {
  awake_count: number | null;
}

export function useNightNow(options?: UseQueryOptions<NightNow>) {
  return useQuery<NightNow>({
    queryKey: ["night", "now"],
    queryFn: () => apiFetch<NightNow>("/night/now"),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    ...options,
  });
}

/** Night theme is active 22:00–06:00 local time (SPEC §6.7). */
export function isNightHour(date = new Date()): boolean {
  const h = date.getHours();
  return h >= 22 || h < 6;
}

const DISMISS_KEY = "otula:night-dismissed";

function dismissedDate(): string | null {
  try {
    return localStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

/** "Dismissed tonight" resets every calendar day. */
export function isNightRedirectDismissed(today: string): boolean {
  return dismissedDate() === today;
}

export function dismissNightRedirect(today: string): void {
  try {
    localStorage.setItem(DISMISS_KEY, today);
  } catch {
    /* private mode — redirect will simply happen again */
  }
}
