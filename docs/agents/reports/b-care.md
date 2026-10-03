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

## Added while waiting for checkpoint-0 (still no skeleton on main)
- `backend/apps/circle/messages.py` — pure "ask for support" builder:
  `pick_template` (tone/lang with gentle-PL fallback, explicit id wins),
  `render_text` (`{task}` substitution), `normalize_phone_for_whatsapp`
  (bare 9-digit PL numbers get 48 prefix), `sms_url` / `whatsapp_url`,
  `build_contact_message` → `{text, sms_url, whatsapp_url}` for the future
  `GET /support/contacts/{id}/message`. 9 tests in `test_messages.py`.
- `backend/apps/journal/summary.py` — pure visit-report aggregations over
  SPEC-§5-shaped dataclasses (`symptom_frequency`, `red_flags_seen`,
  `mood_sleep_summary`, `epds_trend`); the future `GET /reports/visit` view
  is a thin queryset→dataclass translation layer. 5 tests in `test_summary.py`.
- 26 pure-logic tests total, all passing (stdlib harness, pytest absent here).

## 2026-10-03 update (main merged 1st commit; checkpoint-0 still pending)
- Rebased onto `origin/main` (integrator merged `5383418`).
- All 3 test files now use the try/except import pattern
  (`apps.<app>...` → `backend.apps.<app>...` fallback, per integrator note);
  **31 passed with real pytest 8.3.5, no shim needed**.
- New: `backend/apps/circle/public.py` + `test_public.py` — pure
  allowlist builder for `GET /circle/public/{token}` (SPEC §6.8): only
  `{id, title, category, when_label, status, claimed_by_name}` per request,
  cancelled hidden, `mood_color` only when `share_mood`; tests prove
  notes/symptoms/EPDS-shaped extras never leak.
- Still blocked on checkpoint-0: Django models, endpoints, selectors,
  `export.py`, endpoint-level tests (throttling, isolation). No skeleton
  files created.

## 2026-10-03 update 2 (rebased on latest main; checkpoint-0 still pending)
- Integrator merged `0e0386e` (old relative-import test versions); my branch
  now carries the try/except fixes + `circle/public.py` on top of latest main
  (duplicate commit dropped by rebase). 31 passed with real pytest.
- Read merged `tracking/risk.py` (`evaluate_risk(RiskContext)` →
  `{level, reasons, actions}`): my future `POST /support/sessions` with
  intensity=5 will return the same shape with
  `{level: urgent, actions: [show_crisis]}` — no tracking-models dependency.
- Post-checkpoint dependencies (all via try-import per shared names, no
  request file needed): platform skeleton, `tracking.selectors.mood_today`
  (circle public `share_mood`), `notifications.services.notify`
  (circle claim/done).

## Missing (post-checkpoint-0)
Full models/views/URLs per SPEC §7 for support, circle, journal + export.py
files + endpoint tests. Will rebase on main once checkpoint-0 lands.

## Contract deviations
None yet. Note: pristine survey-3 strategy scores exactly 1.0, which no
imperfect observed record can beat (only tie) — direct consequence of the
SPEC formula, kept as-is.
