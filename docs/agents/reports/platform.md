# Report — agent `platform`

## Checkpoint-0 (on `main` as `13e9145`)
- `docker-compose.yml`: db (postgres:16, healthcheck, volume, no host ports),
  redis:7 (same), backend/worker/beat (`${BACKEND_PORT:-8000}`), frontend on
  `frontend` profile with missing-dir guard. Verified: `health → 200`,
  worker + beat stay up, beat schedule lists the 4 shared task names.
- `Makefile` (up/down/logs/migrate/makemigrations/seed/test/lint/schema/shell),
  `.env.example` (all vars incl. demo Fernet key, VAPID, DEMO_PASSWORD).
- Django `config` (base/dev/test), all 10 apps in INSTALLED_APPS, empty skeleton
  per app, `config/urls.py` auto-includes every app's `urls.py` under `/api/v1/`
  + `/api/schema/`, `/api/docs/`, `/api/v1/health`.
- DRF: JWT default, IsAuthenticated default, JSON only, `{"detail","errors"}`
  envelope, `PublicThrottle` (scope `public`, 30/min; disabled in test settings),
  SimpleJWT (60 min / 7 d), CORS 5173–5176 + `$FRONTEND_PORT`, spectacular,
  Celery beat schedule, Europe/Warsaw, USE_TZ.
- `common`: Fernet `EncryptedTextField`, `get_lang`/`localized`, TimeStampedModel,
  IsOwner, UserFactory, `api_client`/`user`/`auth_client` fixtures.
- `accounts`: email-login `User`, `Profile` per SPEC §5 + `night_mode`,
  `last_seen_at`, creation signal, migration `0001_initial`, admin.
- `pytest` (sqlite) + `ruff` green; smoke tests in
  `backend/apps/common/tests/test_smoke.py`.

## Part B (on `agent/platform`, this branch)
- `POST /auth/register` → `{access, refresh, user}` (201; unique email, min 8 chars).
  `POST /auth/login` + `/auth/refresh` = SimpleJWT (email via USERNAME_FIELD).
- `GET/PATCH /me` (`{id, email, profile}`), `DELETE /me` → 204, cascades.
- `GET /me/export` collects `export_user_data(user)` from every app that has
  `export.py` (currently only `accounts`); missing modules skipped.
- `LastSeenMiddleware` updates `Profile.last_seen_at` at most every 5 min, one
  UPDATE query, skips anonymous and deleted users.
- `GET /onboarding/options?mode=&week=&delivery_type=` and atomic
  `POST /onboarding/complete` per SPEC §7. support/goals models are **not merged
  yet**: reads fall back to their fixture files (16 strategies, 25 templates),
  writes try-import and degrade gracefully. Two tests are `xfail(strict=False)`
  until those models land; everything else asserts real behavior now.
- Tests: `test_auth.py` (7), `test_me.py` (6, incl. 5-min middleware windows via
  freezegun), `test_export.py` (3), `test_onboarding.py` (7, incl. atomicity).
- Live check vs Postgres: register → login → me → options (16/6/16) → complete →
  export → DELETE all 200s (probe user removed afterwards).

## Found while testing (fixed)
- `DELETE /me` crashed the new middleware: `Model.delete()` nulls `pk`, so the
  post-view `filter(user=user)` raised ValueError → guard on `user.pk`.
- `POST /onboarding/complete` saved the profile before validating
  `worsening_factors` → validation now runs first (atomicity test proves it).

## Deviations / notes
- Array fields (`worsening_factors`, future `emotions` etc.) are `JSONField`,
  not Postgres `ArrayField`, so the suite runs on sqlite; semantics identical.
- `ruff check .` still reports ~17 errors in b-track/b-care/b-goals/insight
  pre-checkpoint files — their ownership, not touched. My paths are clean.
- `backend/conftest.py` has a temporary `sys.modules` alias shim for b-track's
  bare imports (details in `docs/agents/requests/platform.md`); remove after
  b-track switches to package imports.

## Missing / next
- Rebase after b-care + b-goals merge → confirm the 2 xfail onboarding tests go
  green, drop the conftest shim after b-track's import fix.
- `make seed` targets exist but `seed_content`/`seed_demo` belong to b-content.
