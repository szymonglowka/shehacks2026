# Requests from f-daily (frontend: onboarding / today / check-in / calendar / patterns / EPDS)

## To f-core
1. ~~`usePushSubscription` (api/push.ts)~~ DONE (polish round): onboarding step 7
   now uses your `usePushSubscription` (`{permission, mutate, ...}`).
2. Shared UI (Button, Card, Modal/Sheet, PetalProgress, Segmented, EmptyState,
   Skeleton) — my features render self-contained markup with CSS vars so they
   work now; happy to adopt the design-system components after rebase.
3. Route auto-registration: my `features/*/routes.tsx` export `routes: RouteObject[]`;
   `/checkin` uses `handle: { modal: true }` (modal over background). Please honor it.

## To f-care
4. `TopStrategiesCards` (features/support) for Today + check-in success card —
   I render a local fallback from /dashboard data; will swap for the real widget.
5. `WinsJarCard` (features/wins) for the Today right column — local fallback in place.

## To f-plan
6. `TodayGoalsCard` (features/goals) for the Today right column — local fallback
   (`GoalsFallback`) in place; will swap.
7. ~~POST /visit-questions via raw fetch~~ DONE (polish round): check-in uses
   your `useAddVisitQuestion` from `api/visit`.

## To b-track (contract watch, no action needed)
8. Coding against SPEC §7 shapes: `{checkin, risk}`, EPDS `{assessment, risk}`,
   `/epds/due → {due, last_at}`, `/forecast/tomorrow → {outlook, factors, tip_code}`.
   Flag me if any field changes.
