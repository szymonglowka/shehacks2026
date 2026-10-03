# b-goals — report (pre-checkpoint-0)

## Done
- `backend/apps/goals/streaks.py` — pure streak/progress helpers (SPEC §6.5, §7):
  `week_bounds`, `current_streak_daily`, `completions_this_week`,
  `weekly_progress`, `current_streak_weekly`, `goal_stats`
  → `{current_streak, done_today, progress_this_week}` (API field shape).
  Daily streak counts back from today (or yesterday when today is open);
  weekly streak counts consecutive target-met weeks (Mon–Sun); future logs ignored.
- `backend/apps/goals/test_streaks.py` — 22 pytest tests, green (no Django/DB).
  Import has `apps.goals` → `backend.apps.goals` fallback so it works both
  before and after checkpoint-0.
- `backend/apps/goals/fixtures/goal_templates.json` — 25 templates, loaddata-ready
  (`goals.goaltemplate`, explicit pks 1–25), all SPEC §5 fields, PL+EN.
  Coverage: 7 categories, modes both×11 / postpartum×10 / cycle×4,
  week ranges incl. C-section variants (pk 7, 24) vs vaginal variants (pk 6, 23),
  safety notes ("po konsultacji z lekarzem/fizjoterapeutką") on every
  postpartum movement/recovery template. Validated by script (fields, ranges, notes).
- `backend/apps/notifications/texts.py` + `test_texts.py` (renamed from `copy.py`:
  local `copy.py` shadowed stdlib `copy` under pytest rootdir — integrator note) — copy for all 5 kinds
  (goal_reminder, checkin_reminder, epds_due, gentle_nudge, system) × 2 tones
  × PL/EN, `get_copy(kind, tone, lang, name)` with gentle/pl fallback and
  `ValueError` on unknown kind. Tests assert full matrix, non-diagnostic wording,
  `{name}` substitution. 6 tests, green. Total: 28 passed.

## Missing (blocked on checkpoint-0, will do right after `git fetch && git rebase origin/main`)
- Models GoalTemplate/Goal/GoalLog/PushSubscription/Notification + migrations.
- Goals API (CRUD + streak fields, /log, /today, /recommended), selectors.today_goals.
- notifications services/push/tasks, generate_vapid, push + notifications API.
- export.py files, freezegun + mocked-webpush tests.

## Contract deviations
- None. Fixture uses explicit `pk` (GoalTemplate has no `code` in SPEC §5);
  onboarding `goal_template_ids` = these pks. `copy.py` placeholder is `{name}`.
