# Requests from f-plan

## Resolved during polish round (no action needed)
1. `src/api/client.ts` exports `apiFetch` — confirmed, adapters use it.
2. Tailwind token classes (`bg-cream text-ink … fill-forest …`) map to CSS
   vars — confirmed in `tailwind.config.js`.
3. `features/goals/index.ts` exports the real `TodayGoalsCard` (mine, in my
   owned path). If f-core still has a stub elsewhere, drop the stub.

## To backend (b-goals, low priority, workaround in place)
- `GET /goals/recommended` templates carry no human `reason`; I synthesize it
  client-side from `min_week`/`delivery_types`. If you ever add a `reason`
  field, my UI prefers it automatically.
- Nothing else needed. No contract changes requested.
