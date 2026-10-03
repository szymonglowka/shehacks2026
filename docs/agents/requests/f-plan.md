# Requests from f-plan

## To f-core (blocking after checkpoint-0)
1. `src/api/client.ts` must export `apiFetch<T>(path, init?)` (base URL from
   `VITE_API_URL`, JWT refresh-on-401, `Accept-Language` from i18n). My four
   api modules import exactly that name — rename on my side if you chose
   differently.
2. Tailwind theme must map these classes to CSS vars (I use them everywhere):
   `bg-cream text-ink text-muted bg-forest bg-sage bg-sage-light bg-paper
   bg-peach-soft border-line fill-forest fill-sage fill-peach`, plus
   `shadow-[var(--shadow)]` working. `font-serif` → Newsreader.
3. `features/goals/index.ts` already exports the real `TodayGoalsCard` —
   please drop/replace your stub with mine (do not keep both).
4. No SPEC §7 contract changes requested. No backend fields needed.
