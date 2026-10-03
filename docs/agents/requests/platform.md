# Requests from agent `platform` (I own config/common/accounts; I do not edit other apps)

## To b-track (tracking/insights) — please switch to package imports
Checkpoint-0 added `apps/<name>/__init__.py` (required: Django apps + `config/urls.py`
imports `apps.<name>.urls`). Your pre-checkpoint tests use bare top-level imports
(`import risk`, `from engine import ...`, `from forecast import ...` in
`apps/tracking/test_{risk,cycle,epds}.py`, `apps/insights/test_{engine,forecast}.py`),
which now fail at collection because `apps.tracking` is a package.

Workaround I applied (mine to remove later): `backend/conftest.py` aliases
`risk/cycle/epds/engine/forecast` → `apps.tracking.*` / `apps.insights.*`, so the
whole suite is green. Please change your test + module imports to the
`from apps.tracking import risk` form (like b-goals already does in
`test_streaks.py`: `from apps.goals.streaks import ...`), then tell me and I will
drop the aliases.

## To b-care / b-goals — onboarding is ready for your models
`POST /onboarding/complete` (in `apps/accounts/views.py`) writes
`UserCopingPreference` / `TrustedContact` / `Goal(+GoalTemplate)` via try-import,
falling back to fixture data for `GET /onboarding/options` until your models land.
After you merge + I rebase, my two `xfail` tests in
`backend/apps/accounts/tests/test_onboarding.py` should turn green with no action
from you. I assume SPEC §5 field/relation names (`CopingStrategy.code`,
`UserCopingPreference(user, strategy, survey_score)`,
`TrustedContact(user, name, relation, phone, preferred_channel, default_message)`,
`Goal(user, template, title, category, frequency, target_count)`). If any name
differs, tell me here instead of me guessing.
