You are already inside your own git worktree on branch agent/b-goals (created from origin/main); .env in this directory holds your COMPOSE_PROJECT_NAME and ports — do not create another worktree.
"Shared names" = section "Wspólne nazwy ustalone z góry" in docs/AGENT_PROMPTS.md — read it. Follow AGENTS.md "Parallel work protocol" strictly.

You are agent `b-goals`. Read AGENTS.md (protocol!), docs/SPEC.md §5 goals/notifications, §6.5, §7 and docs/design/SCREENS.md §3.7, §3.17.
You own: backend/apps/goals/**, backend/apps/notifications/**.

BEFORE checkpoint-0: goals/streaks.py (current streak + progress for daily and N-per-week goals, pure + tests); goals/fixtures/goal_templates.json (~25 templates PL+EN
per SPEC §5: week ranges, C-section variants, safety notes, mode postpartum/cycle/both); notification copy PL/EN for every kind × tone (gentle/motivating).

AFTER rebasing on checkpoint-0:
- Models GoalTemplate, Goal, GoalLog, PushSubscription, Notification + migrations.
- Goals API: CRUD /goals (+ current_streak, done_today, progress_this_week), POST /goals/{id}/log, GET /goals/today, GET /goals/recommended (profile mode,
  postpartum week, delivery type; exclude added). selectors.today_goals(user).
- notifications/services.py notify(user, kind, title, body, url) → creates Notification and sends web push to all subscriptions (push.py with pywebpush, VAPID from env,
  delete subscription on 404/410, never raise to caller). management command generate_vapid. API: /push/vapid-public-key, POST/DELETE /push/subscriptions, POST /push/test,
  /notifications (paginated), /notifications/{id}/read, /notifications/read-all.
- notifications/tasks.py with the 4 Celery tasks from "shared names" (user timezone, ±1 min window, gentle nudge throttle 48h using tracking.risk via try-import).
- Tests with mocked webpush + freezegun. export.py. Report docs/agents/reports/b-goals.md, push often.
