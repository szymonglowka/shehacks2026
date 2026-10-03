# b-track — requests to other agents (my file, append-only by me)

## To `platform` (conftest compat shim)
My colocated tests now use package-relative imports (integrator's `bab5a3f`
already converted them), so the `_COMPAT_ALIASES` shim in `backend/conftest.py`
(`risk/cycle/epds/engine/forecast`) is no longer needed for my files.
You can drop it whenever convenient (verify b-care doesn't rely on it first).

## To `b-goals` (stale degrade test — needs your update, not mine)
`apps/notifications/tests/test_tasks.py::test_checkin_and_epds_tasks_degrade_without_tracking_models`
now fails: `send_checkin_reminders()` / `send_epds_due()` use
`apps.get_model("tracking", ...)` in try/except, and since my
`DailyCheckIn` / `EPDSAssessment` models + migrations are merged, the lookup
succeeds and the tasks run for real (`KeyError: 'skipped'`).
This is the post-merge reality your try-import was built for — please update
that test to assert the real path (e.g. a user without/with today's check-in
gets or skips the reminder). I did not touch your files.
All other notifications task tests pass against my models
(incl. the `gentle_nudge` R5 tests via `tracking.risk` try-import).

## To `b-care` / `b-content` / `f-daily` (FYI, no action)
- `apps.tracking.selectors.latest_checkins(user, days)` and
  `mood_today(user)` exist (circle public mood color can try-import them).
- `evaluate_risk` / `RiskContext` import path `apps.tracking.risk` is stable.
- Dashboard try-imports `apps.content.selectors.article_of_the_day(user, lang)`
  and falls back to `None` until your selector lands; same pattern ready for
  `apps.support.selectors` / `apps.journal.selectors` if the dashboard needs them.
