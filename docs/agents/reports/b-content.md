# b-content — report (pre-checkpoint-0)

## Done
- `backend/apps/content/fixtures/articles.json` — 16 articles, full PL+EN.
  Every `body_pl`/`body_en` is 400–700 words (verified: 409–630) and ends with
  a `Źródła`/`Sources` section (WHO, NHS, ACOG, pacjent.gov.pl, NICE, LLL, Neff).
  Slugs cover all required topics incl. partner guide `jak-wspierac-mame`
  (linked from the public circle page). Fields per SPEC §5
  (`category`, `mode`, `min_week/max_week`, `reading_minutes`) **plus**
  `cover_emoji` (SPEC) and `cover_image` filename (AGENT_PROMPTS brief) —
  the post-checkpoint-0 `Article` model will carry both fields.
  Safety rules honoured: no diagnostic wording, exercise articles
  (pelvic floor, C-section, diastasis, movement) carry a
  "consult your doctor/physiotherapist" note, no fertile-window content.
- `backend/apps/content/fixtures/specialists.json` — 10 clearly fictional
  entries (`is_sample: true`, demo names/phones, "dane przykładowe" in every
  description), covering midwife, pelvic physio, psychologist, psychiatrist,
  lactation consultant (SPEC §4.11).
- `backend/apps/content/test_fixtures.py` — Django-free (stdlib only) pytest
  contract tests: 16 articles/exact slug set, required fields, taxonomy,
  400–700 words + sources per body, PL/EN length parity, specialists
  `is_sample` + specialty coverage. **5 passed.**

## Not done (waits on checkpoint-0 / other merges)
- `Article`/`Specialist` models + migrations, `/articles`, `/articles/{slug}`,
  `/specialists` endpoints, `selectors.article_of_the_day(user, lang)`.
- `seed_content` (idempotent, all apps) and `seed_demo` (SPEC §9) management
  commands + idempotency tests. `support` + `goals` fixtures are already on
  main, so `seed_content` can cover content/support/goals right after rebase.

## Notes / deviations
- No skeleton files created (`apps.py`, `__init__.py`, `urls.py`) per protocol.
- `cover_image` is an intentional additive field next to SPEC's `cover_emoji`;
  no SPEC §7 contract change needed (f-plan reads article payloads, will note
  both fields when wiring the Knowledge screen).
- No cross-area requests.

## Update (after rebase on 1b24eb6 — still no checkpoint-0 skeleton)
- Rebased cleanly; `backend/config`, requirements, compose still absent on
  `main`, so models/migrations/views/seed commands stay blocked by protocol
  (no `apps.py`/`__init__.py`/`urls.py` created).
- Added `backend/apps/content/picking.py` (Django-free core of
  `selectors.article_of_the_day`: mode + postpartum-week tiers, stable
  SHA-256 `(day, slug)` order inside a tier — deterministic per day, rotates
  across days) + `backend/apps/content/test_picking.py` (10 tests, incl. a
  run over the real `articles.json` for Marta-like and Kasia-like profiles).
  Suite: **15 passed**.
- Post-checkpoint-0 selector will map `Article` rows to `ArticleCandidate`
  and call `pick_article_of_the_day`; `selectors.py` then only adds the
  profile/week lookup and localization.

## Update (rebased on 80ef1c4 — frontend skeleton only)
- `origin/main` gained `chore(checkpoint-0): frontend skeleton`; the Django
  backend skeleton (`backend/config`, requirements, `apps.py`) is still
  missing and `origin/agent/platform` does not exist yet. Models, migrations,
  API views and seed commands therefore remain blocked by protocol.
- Rebase clean, suite re-run: **15 passed**. Nothing else changed.
