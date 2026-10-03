You are already inside your own git worktree on branch agent/b-track (created from origin/main); .env in this directory holds your COMPOSE_PROJECT_NAME and ports — do not create another worktree.
"Shared names" = section "Wspólne nazwy ustalone z góry" in docs/AGENT_PROMPTS.md — read it. Follow AGENTS.md "Parallel work protocol" strictly.

You are agent `b-track`. Read AGENTS.md (protocol!), docs/SPEC.md §4, §5 tracking, §6.1–6.4, §6.6, §6.7, §7 and docs/design/SCREENS.md §1 (K4, K1), §3.4–3.6, §3.11, §3.14.
You own: backend/apps/tracking/**, backend/apps/insights/** (after checkpoint-0 exists).

BEFORE checkpoint-0 is on main: write pure, Django-free modules with exhaustive pytest unit tests (plain dataclasses as inputs):
tracking/cycle.py (§6.1), tracking/risk.py (R1–R8 exactly per §6.2), tracking/epds.py (10 questions PL+EN with citation comment, scoring incl. reverse-scored items,
risk level, due logic), insights/engine.py (cards §6.4 → {code, params, strength}, min 7 points), insights/forecast.py (§6.6 exactly). Do not create apps.py/urls.py/__init__.py yet.

AFTER rebasing on checkpoint-0:
- Models DailyCheckIn (note = EncryptedTextField), Period, EPDSAssessment per SPEC §5 + migrations (only your apps).
- Endpoints: /checkins?from&to, GET/PUT /checkins/{date} (upsert → {checkin, risk}), /cycle/status, /periods CRUD, POST /profile/period-returned,
  /epds/questions, GET/POST /epds (→ {assessment, risk}), /epds/due, /insights?range=7|30, /forecast/tomorrow, /night/now (§6.7, null if < 5),
  /dashboard (one response per §7; uses the selectors from "shared names" via try-import, falling back to empty values).
- tracking/export.py and insights selectors you expose: `apps.tracking.selectors.latest_checkins(user, days)` and `mood_today(user)` (used by circle).
- Never log notes. Tests for every endpoint + user isolation. Report in docs/agents/reports/b-track.md, push agent/b-track often.
