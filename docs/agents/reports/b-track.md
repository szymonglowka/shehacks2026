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
