# b-track — report (phase 1: pre-checkpoint-0)

## Done
Pure, Django-free logic modules + 65 pytest tests green (no DB, no Django):
- `backend/apps/tracking/cycle.py` — SPEC §6.1: postpartum (days, 1-indexed week, early/recovery/beyond) and cycle status (cycle_day, phase with ovulation = len−14 ±1, next period, low/medium/high confidence). Tests: 13.
- `backend/apps/tracking/risk.py` — R1–R8 exactly: level = max of fired rules, reasons in R order, deduped actions. R6 fires as info on top of R5 (level stays moderate); R7 when postpartum day > 14 or unknown; R5 needs a full 4-check-in window. Tests: 14.
- `backend/apps/tracking/epds.py` — 10 questions PL+EN with Cox et al. (1987) citation; Q1,2,4 normal, Q3,5–10 reverse-scored; `score_answers` validates 10×(0–3); risk bands urgent(q10≥1)/high(≥13)/moderate(10–12)/low; `is_due` (postpartum + ≥14 d; cycle never due). PL wording flagged for verification against the validated translation. Tests: 11.
- `backend/apps/insights/engine.py` — cards `{code, params, strength}`: sleep_mood, goals_mood (diff ≥ 0.5), phase_mood (≥3 phases), trend (7 d vs prior 7 d), streak (alive streak ≥ 2 d), toolkit_top (SPEC §5 Bayesian score). Every card needs ≥ 7 points. Tests: 15.
- `backend/apps/insights/forecast.py` — SPEC §6.6 exactly: period soon/days −2, luteal −1, baby-blues peak (d3–5) −2 exclusive with ≤14 d window −1, sleep <5 −2 / <6 −1, mood ≤2.5 −1, streak ≥3 +1; sunny/partly/cloudy/rainy; tip by strongest factor with fixed tie-break. Tests: 12.

Judgment calls (all pinned by tests): R5 needs 4 check-ins; unknown postpartum day → R7; baby-blues peak does not stack with the ≤14 window; phase_mood approximates "≥1 full cycle" as ≥3 distinct phases with data.

## Missing (blocked on checkpoint-0 on main)
Models + migrations, all endpoints (/checkins, /cycle/status, /periods, /profile/period-returned, /epds*, /insights, /forecast/tomorrow, /night/now, /dashboard), selectors (`latest_checkins`, `mood_today`), `export.py`, endpoint/isolation tests. No `__init__.py`/`apps.py`/`urls.py` created per protocol.

## Contract deviations
None. No requests to other agents yet.
Note: `b-goals` asked (via `requests/b-goals.md`) to keep the `tracking.risk`
import path stable for their `send_gentle_nudges` try-import — confirmed:
`backend/apps/tracking/risk.py` with `evaluate_risk` / `RiskContext` stays.

## 2026-10-03 update
Rebased on latest `origin/main` (includes merged b-goals/b-care phase-1 work);
branch pushed, ready for integrator merge. Full-tree check: 93 passed
(b-track 65 + b-goals 28); only failure is b-care's known pre-existing
`test_ranking.py` relative-import collection error (integrator's shim covers
it, not my files). Phase 2 (models/endpoints) still blocked on checkpoint-0.

## 2026-10-04 — phase 2 done (post-checkpoint-0, rebased on `c3a0199`)
- Models `DailyCheckIn` (`note` = `EncryptedTextField`), `Period`, `EPDSAssessment`
  per SPEC §5 + `tracking/migrations/0001_initial.py` (only my apps).
- Endpoints, all per SPEC §7: `GET /checkins?from&to`, `GET/PUT /checkins/{date}`
  (upsert → `{checkin, risk}`), `GET /cycle/status`, `GET/POST /periods`,
  `PATCH/DELETE /periods/{id}`, `POST /profile/period-returned` (→ cycle mode),
  `GET /epds/questions` (Accept-Language), `GET/POST /epds` (→ `{assessment, risk}`),
  `GET /epds/due`, `GET /insights?range=7|30`, `GET /forecast/tomorrow`,
  `GET /night/now` (`null` when < 5), `GET /dashboard` (7 keys per §7).
- `tracking/selectors.py`: `latest_checkins(user, days)`, `mood_today(user)`,
  `cycle_status_for(user)`; `tracking/export.py` (check-ins incl. notes, periods,
  EPDS). Dashboard try-imports `goals.today_goals`, `content.article_of_the_day`,
  `notifications.Notification`, falling back to empty values.
- Risk wiring: check-in upsert evaluates R1–R8 with fresh (≤14 d) EPDS; EPDS submit
  evaluates with today's check-in signals. Notes never logged (no logging of
  contents anywhere; admin excludes `note` from list view).
- Tests: 42 new endpoint/isolation tests; my suites 107 passed in docker
  (`pytest apps/tracking apps/insights`); full backend 242 passed + 1 xfailed,
  1 failed = b-goals' stale `..._degrade_without_tracking_models` test whose
  premise (tracking models missing) expired with this merge — logged in
  `docs/agents/requests/b-track.md` for b-goals (their file, not edited).
- `ruff check apps/tracking apps/insights` clean; `docker compose up` boots,
  health OK, migration applied; live smoke test on Postgres (register → check-in
  → dashboard) green.
