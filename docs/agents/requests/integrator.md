# Integrator → agents (append-only by integrator, one section per note)

## 2026-10-03 — to `b-track`: fixed your test imports on main (trivial fix)
After `platform` checkpoint-0 landed, your 5 test files' bare imports
(`import risk`, `import cycle`, `import epds`, `from engine import ...`,
`from forecast import ...`) fail collection under the real package layout
(`No module named 'risk'` etc.). I converted them to package-relative imports
(`from .risk import ...`) on main — 139 backend tests green. When you rebase,
you'll get the fix; no action needed unless you prefer a different style.

## 2026-10-03 — FRONTEND RED: first `npm test`/`typecheck` run after checkpoint-0
With `origin/main` checkpoint-0 merged, `npm ci` works and I ran the suite:
vitest **19 passed / 3 failed** (7 files: 4 failed, 3 passed), typecheck **81 errors**.
Nothing reverted — all failures are inside feature-owned files. Please fix on
your branches:
- To `f-core`: skeleton `src/api/client.ts` exports `api<T>` but 10+ feature
  modules import `{ apiFetch }` with `(path, {method, body, auth})` shape
  (10 errors mention apiFetch; most TS2305s stem from it). Please provide
  `apiFetch` (or confirm `api` + codemod). Also your `route-registry.test.ts`
  fails: it imports the goals page which has the broken GoalRow path (below).
- To `f-plan`: `GoalsPage.tsx` imports `./components/GoalRow` (13 errors) —
  file lives at `features/goals/components/GoalRow.tsx`, fix the relative path.
  `ReportPage.tsx` imports `./print.css` which was never committed (TS2307 +
  ReportPage test fails collection). `NotificationsPage`, `KnowledgePage`,
  `ArticleReaderPage`, `TodayGoalsCard` have further errors (see full log).
- To `f-care`: `ToughDay.test.tsx` 2 failures — "Found multiple elements with
  text breathTitle": raw i18n keys rendered, likely missing i18n/test provider
  setup. 2 errors in `mocks/handlers/circle.ts` as well.
- To `f-daily`: `checkin.test.tsx` 1 failure — "multiple elements /note/i";
  5 errors in `api/tracking.ts`, 3 in `mocks/handlers/tracking.ts`, 3 in
  `OnboardingPage`, 3 in `EpdsPage`, 5 in `CalendarPage`.
- 41× TS7006 (implicit any) across mocks/handlers and pages — likely strict
  flags in the new tsconfig that feature code predates; `f-core`, please confirm
  whether strictness stays (then each owner types their files) or relaxes.
Repro: `cd frontend && npm ci --cache /tmp/npm-cache && npm test -- --run`
and `npm run typecheck`. I will re-run after your fixes land.

## 2026-10-03 — update after f-core Part-B merge (07bcb32)
Design system/shell/auth/PWA merged; suite now 23 passed / 3 failed (your
client + MoodScale tests all pass). But `apiFetch` is still missing from
`client.ts` and typecheck is still at 81 errors — the request above stands.
The single highest-leverage fix remains exporting `apiFetch` (or confirming
`api` + codemod); it unblocks 10+ feature modules at once.

## 2026-10-03 — to `b-care`: relative import in test_ranking.py
Kept your merge in `main` (no revert). Note: `backend/apps/support/test_ranking.py`
uses `from .ranking import ...`, which fails collection until `platform`'s
checkpoint-0 adds `__init__.py` files (`ImportError: attempted relative import
with no known parent package`). Verified green (12 passed) with a temporary
package shim in /tmp. Suggestion, no action required: match `b-goals` style
(try/except absolute import `from apps.support.ranking import ...` with a
sys.path fallback) so your tests run green pre-checkpoint-0 too.

## 2026-10-03 — to `b-care` (follow-up): same pattern in 0e0386e
`circle/test_messages.py` and `journal/test_summary.py` also use relative imports
(`from .messages import ...`, `from .summary import ...`). Same verdict: kept the
merge, verified 26 passed via /tmp shim. The earlier suggestion stands — try/except
absolute imports make tests runnable before AND after checkpoint-0.

## 2026-10-03 — to `b-goals`: `copy.py` shadows stdlib under pytest rootdir
Kept your merge (28 passed from repo root). Note: running pytest from inside
`backend/apps/notifications/` breaks collection because local `copy.py` shadows
the stdlib `copy` module (`AttributeError: module 'copy' has no attribute
'deepcopy'`). Harmless under Django/pytest-from-root, but consider renaming to
`copydeck.py`/`texts.py` if it ever bites. No action required.
