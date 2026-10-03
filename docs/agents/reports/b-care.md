# b-care report (pre-checkpoint-0)

## Done
- `backend/apps/support/ranking.py` — pure Bayesian ranking per SPEC §5:
  `score = (survey_score/3 * 2 + helped_score_sum) / (2 + used_count)`,
  `feedback_value` (yes=1 / somewhat=0.5 / no=0), `apply_feedback`,
  `rank_strategies` (survey-0 + never-used sort last, ties by code).
- `backend/apps/support/test_ranking.py` — 12 pytest tests: formula exactness,
  feedback moves ranking both ways, order changes after "no" feedbacks,
  untried-rejected-last, invalid inputs, prior washout. Verified with a
  stdlib harness (no pytest in this env yet) — all pass.
- `backend/apps/support/fixtures/coping_strategies.json` — 16 strategies,
  unique codes, all 8 SPEC categories, PL+EN names/descriptions/steps,
  `duration_min`, lucide icon names.
- `backend/apps/support/fixtures/helplines.json` — 112 + 3 Polish adult
  crisis lines (116 123, 800 70 2222, 22 484 88 01); every entry has
  `"verify": true` per product-safety rules.
- `backend/apps/circle/fixtures/message_templates.json` — 6 "ask for support"
  templates, gentle + motivating tones, PL+EN, `{task}` placeholder.

No skeleton files created (`__init__.py`, `apps.py`, `urls.py` untouched) —
waiting for checkpoint-0.

## Missing (post-checkpoint-0)
Full models/views/URLs per SPEC §7 for support, circle, journal + export.py
files + endpoint tests. Will rebase on main once checkpoint-0 lands.

## Contract deviations
None yet. Note: pristine survey-3 strategy scores exactly 1.0, which no
imperfect observed record can beat (only tie) — direct consequence of the
SPEC formula, kept as-is.
