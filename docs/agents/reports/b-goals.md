# b-goals — report

## Pre-checkpoint-0 (merged to main)
- `backend/apps/goals/streaks.py` — pure streak/progress helpers; `goal_stats()`
  returns the API shape (`current_streak`, `done_today`, `progress_this_week`).
- `backend/apps/goals/fixtures/goal_templates.json` — 25 loaddata-ready templates
  (explicit pks 1–25), PL+EN, week ranges, C-section variants, safety notes.
- `backend/apps/notifications/texts.py` (renamed from `copy.py` per integrator note:
  local `copy.py` shadowed stdlib `copy` under pytest rootdir) — 5 kinds × 2 tones
  × PL/EN + `get_copy()`.

## Post-checkpoint-0 (this push, after rebase on `13e9145`)
- **Models + migrations**: `GoalTemplate` (plain Model, no timestamps — SPEC §5 lists
  none, and loaddata can't fill `auto_now_add`), `Goal` (TimeStampedModel), `GoalLog`
  (unique goal+date), `PushSubscription` (endpoint unique), `Notification`
  (kind/title/body/url/created_at/sent_at/read_at). `0001` + `0002` (template
  timestamps removed) for goals, `0001` for notifications. `makemigrations --check` clean.
- **Goals API**: `GET/POST /goals`, `GET/PATCH/DELETE /goals/{id}` (streak fields via
  `streaks.goal_stats`), `POST /goals/{id}/log` (upsert, date defaults today),
  `GET /goals/today`, `GET /goals/recommended` (profile mode, postpartum week,
  delivery type, exclude-added, Accept-Language localization). `selectors.today_goals(user)`.
- **Notifications**: `services.notify()` (creates row + push fan-out, never raises),
  `push.py` (pywebpush, VAPID from settings, 404/410 deletes subscription, never raises),
  `generate_vapid` command (verified output), APIs: `GET /push/vapid-public-key`,
  `POST/DELETE /push/subscriptions`, `POST /push/test`, `GET /notifications`
  (paginated, 20/page), `POST /notifications/{id}/read`, `POST /notifications/read-all`.
- **Tasks** (`apps.notifications.tasks`, names match beat schedule): goal reminders
  (±1 min user-tz window, weekday match, skips logged days, per-goal/day idempotency),
  check-in reminders, `send_epds_due` (postpartum, user-tz hour 10, 14-day rule),
  `send_gentle_nudges` (R5 via `tracking.risk` try-import, 48 h throttle).
  tracking models aren't merged yet → those three degrade to "nothing due" (tested).
- **Exporters**: `export.py` in both apps (goals incl. logs, notifications).
- **Tests**: 68 passed (`apps/goals`, `apps/notifications`, `common`, `accounts`) in
  project venv (`backend/.venv`, Django 5.1, sqlite test settings) — API CRUD/streaks/
  recommended/i18n/isolation, push mocked (success/410-delete/500-keep/no-VAPID),
  notify never-raises, tasks with freezegun (±1 min window, weekday, idempotency,
  throttle), fixture loads 25 rows idempotently. Ruff clean on owned apps.
  Schema (`spectacular`) renders all 11 endpoints with no warnings in my apps.

## Notes / deviations
- `.gitignore`: added `.venv/`+`venv/` (one-line infra hygiene so no venv is committed).
- b-track's `test_cycle/epds/risk.py` + insights `test_engine/forecast.py` fail collection
  (`import risk` bare style vs new `apps` packages) — pre-existing, other owners' files,
  untouched. My files are independent of them.
- `docker compose` unavailable here (daemon down) — verified via venv + sqlite instead;
  `make up/migrate` left for integrator.
- Cross-area: `seed_content` (b-content) can now `loaddata` my fixture (verified twice);
  beat task names match settings; `notify` import path per shared names.
