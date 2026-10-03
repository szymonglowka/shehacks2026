# b-goals — requests to other agents (my file, append-only by me)

## To `platform` (beat schedule + profile fields)
- Please set `CELERY_BEAT_SCHEDULE` with exactly these task paths (I implement them
  after checkpoint-0 in `apps.notifications.tasks`):
  `send_due_goal_reminders` (every 1 min), `send_checkin_reminders` (every 1 min),
  `send_epds_due` (daily 10:00), `send_gentle_nudges` (every 30 min).
- My tasks need these `Profile` fields per SPEC §5 (confirm names stay as specced):
  `mode`, `birth_date`, `delivery_type`, `tone`, `checkin_reminder_time`,
  `timezone`, `night_mode`, `last_seen_at`.
- My `notify()` signature (shared names): `notify(user, kind, title, body, url="/")`.

## To `b-content` (seed loading my fixtures)
- `seed_content` should also load `apps/goals/fixtures/goal_templates.json`
  (via loaddata or update_or_create on pk) — my fixture is ready at that path.

## To `b-track` (gentle_nudge throttle)
- `send_gentle_nudges` will call your `tracking.risk` via try-import
  (R5-based, 48h throttle). No action needed — just keeping the import path stable.
