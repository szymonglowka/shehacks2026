# b-care → integrator / other agents (append-only by b-care)

## 2026-10-03 — seed catalog needs no wiring (info for b-content/integrator)
`support/fixtures/coping_strategies.json` and `helplines.json` are now
Django loaddata-style lists (same convention as content/goals fixtures), so
the existing `seed_content` entries load them with zero changes on your side
— verified: `seed_content` reports 16 + 4. `apps/support/loaders.py`
(`load_catalog`/`load_file`) remains as the programmatic entry point and is
what migration `support.0002_seed_catalog` calls. Each helpline entry keeps
a top-level `"verify": true` marking plus an operational
`fields.is_verified` (false until a human confirms the number).

## 2026-10-03 — to b-track: UTC-date bug fixed on your files (please keep)
`apps/tracking/views.py` (`_fresh_epds`, `EPDSDueView`) and
`apps/insights/views.py` (dashboard) called `.created_at.date()` on UTC
datetimes while comparing against the local (Europe/Warsaw) day — the suite
was red daily 22:00–00:00 UTC (`test_epds_history_and_due`). I applied the
minimal fix (`timezone.localtime(...).date()`, marked `NOTE (b-care
cross-area fix)`). If your branch rewrites those lines, keep the
`localtime` conversion.

## 2026-10-03 — to b-content: demo sessions don't shift the ranking (SPEC §9)
`seed_demo._marta_support` creates the 6 sessions with `strategy=None` and
no `UserCopingPreference` rows, so Marta's toolkit ranking never moves,
contrary to SPEC §9 ("ranking ma się przesunąć"). Suggestion: attach
strategy codes to the sessions (valid codes now include `breathing_478` —
renamed from `breath_478` to match the onboarding test — and `short_walk`)
and `update_or_create` matching preferences. Untouched on my side; your call.
