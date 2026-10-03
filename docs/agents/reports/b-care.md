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

## 2026-10-04 post-checkpoint delivery (main d6a0d0d, 256 tests green)
Implemented everything (models, migrations, endpoints per SPEC §7,
selectors, export.py, endpoint + isolation tests). Full suite: **293 passed**
with the project venv (Django 5.1.15, sqlite test settings); docker daemon
is unreachable from this sandbox, so `docker compose run` could not be used
— same requirements, same pytest path, noted for the integrator to re-run.
Ruff clean on all touched files (2 remaining findings are b-content's).
- support: models (CopingStrategy, UserCopingPreference, SupportSession with
  `started_at default=now` so seed_demo backdating works, TrustedContact,
  Helpline + new `is_verified` flag), `selectors.top_strategies`,
  GET /support/toolkit (ranked + evidence used/helped_yes/helped_somewhat),
  POST /support/sessions (intensity=5 → risk urgent/show_crisis),
  PATCH sessions (repeat-safe feedback accounting), PUT /support/preferences
  (code validation), contacts CRUD, contacts/{id}/message (sms:/wa.me URLs,
  default_message override), public helplines. `export.py` (tokens n/a).
- circle: CircleLink/CareRequest, link GET/POST(revokes old)/PATCH/DELETE,
  requests CRUD, public AllowAny get/claim/done with explicit `public`
  throttle (import-time binding makes override_settings unable to test the
  global default — worth knowing), revoked → 404, claim/done → `notify()`,
  export without tokens. Public payload via allowlist builder (no notes).
- journal: SmallWin/VisitQuestion (EncryptedTextField, at-rest encryption
  tested via raw SQL), wins CRUD + /wins/random, visit-questions CRUD,
  /reports/visit?weeks=2|4|6 aggregating real tracking rows (tracking models
  are merged — no stubs needed), `selectors.wins_count`, export.
- seeds: migration `support.0002_seed_catalog` (idempotent, uses historical
  registry); fixtures converted to loaddata-style so `seed_content` loads
  them untouched (16 + 4, re-runs create nothing); `seed_demo` guarded
  blocks verified running (6 sessions, 1 link + 4 requests, 9 wins,
  3 questions, second run idempotent).
- code alignment: strategy `breath_478` → `breathing_478` to match the merged
  onboarding test (was silently skipped as unknown).
- cross-area fix (flagged in requests/b-care.md): UTC-date bug in
  tracking/views.py + insights/views.py (red 22:00–00:00 UTC daily) fixed
  with `localtime`, minimal, marked NOTE.
- open for b-content: demo sessions use strategy=None so demo ranking never
  shifts (SPEC §9) — request filed, their call.

## 2026-10-03 update 3 (frontend checkpoint-0 landed; backend still pending)
- Main has `80ef1c4 chore(checkpoint-0): frontend skeleton`, but
  `backend/config` and all `__init__.py`/`apps.py` are still missing —
  backend implementation stays blocked on `platform`.
- Synced branch with main via merge (rebase hit add/add conflicts on
  already-upstream blobs; merge was clean). 31 passed, pushed `agent/b-care`.
- Note for integrator: main still carries my pre-fix test files
  (relative imports); this branch supersedes them (try/except pattern +
  `circle/public.py` + `test_public.py`).

## Missing (post-checkpoint-0)
Full models/views/URLs per SPEC §7 for support, circle, journal + export.py
files + endpoint tests. Will rebase on main once checkpoint-0 lands.

## Contract deviations
None yet. Note: pristine survey-3 strategy scores exactly 1.0, which no
imperfect observed record can beat (only tie) — direct consequence of the
SPEC formula, kept as-is.
