You are already inside your own git worktree on branch agent/platform (created from origin/main); .env in this directory holds your COMPOSE_PROJECT_NAME and ports — do not create another worktree.
"Shared names" = section "Wspólne nazwy ustalone z góry" in docs/AGENT_PROMPTS.md — read it. Follow AGENTS.md "Parallel work protocol" strictly.

You are agent `platform`. Read AGENTS.md (especially "Parallel work protocol"), docs/SPEC.md §5 accounts, §7, §8, and docs/AGENT_PROMPTS.md "shared names".
You own: docker-compose.yml, Makefile, .env.example, backend/Dockerfile, backend/requirements*.txt, backend/config/**, backend/apps/common/**, backend/apps/accounts/**,
and the empty skeleton of every other backend app.

PART A — CHECKPOINT-0 (do this first, fast, ≤30 min, commit directly to main with prefix "chore(checkpoint-0)" and push):
1. docker-compose.yml: db (postgres:16 + healthcheck + volume), redis:7, backend (runserver 0.0.0.0:8000 → host ${BACKEND_PORT:-8000}), worker, beat,
   frontend (node:22, `npm ci && npm run dev -- --host --port 5173` → host ${FRONTEND_PORT:-5173}; must tolerate frontend/ not existing yet: use a profile `frontend`
   or a guard command). All config from .env (django-environ). .env.example with every variable incl. COMPOSE_PROJECT_NAME, ports, FIELD_ENCRYPTION_KEY, VAPID_*, DEMO_PASSWORD, VITE_API_URL, VITE_USE_MOCKS.
2. Makefile: up, down, logs, migrate, makemigrations, seed (seed_content + seed_demo, ignore if missing), test (pytest + `npm test` if frontend exists), lint, schema, shell.
3. Django project `config` (settings base/dev/test), INSTALLED_APPS with ALL apps: common, accounts, tracking, insights, support, circle, journal, goals, notifications, content.
   Create the EMPTY skeleton for every app (apps.py, __init__.py, models.py, admin.py, urls.py with `urlpatterns = []`, tests/__init__.py, migrations/__init__.py).
   config/urls.py auto-includes `apps.<name>.urls` for every app under /api/v1/ (one loop), plus /api/schema/, /api/docs/, /api/v1/health.
4. DRF (JWT auth default, IsAuthenticated default, JSON only, exception handler returning {"detail", "errors"}), SimpleJWT, drf-spectacular, CORS for localhost ports 5173–5176,
   DRF throttling classes configured (scope "public": 30/min), Celery app + CELERY_BEAT_SCHEDULE with the task names from "shared names", Europe/Warsaw TZ, USE_TZ.
5. apps.common: EncryptedTextField (Fernet), i18n.get_lang(request) + localized(obj, "field", lang), TimeStampedModel, pytest fixtures (api_client, user, auth_client) in backend/conftest.py, factory for User.
6. apps.accounts models: custom User (email login, no username) + Profile exactly per SPEC §5 (+ night_mode, last_seen_at), signal creating Profile, migrations, admin.
7. pytest config + one smoke test; `docker compose up` + migrate + test green. Push to main.

PART B — on your branch agent/platform:
- /auth/register, /auth/login, /auth/refresh, GET/PATCH/DELETE /me, GET /me/export (collect apps.*.export.export_user_data if present),
  middleware updating Profile.last_seen_at at most every 5 min.
- GET /onboarding/options and POST /onboarding/complete per SPEC §7 (atomic). It touches support/goals models owned by others: implement it after
  b-care and b-goals are merged (rebase), until then write it against SPEC §5 field names and tests marked xfail if models are missing.
- Tests for auth, /me, export, delete cascade, onboarding, user isolation.
- Report in docs/agents/reports/platform.md. Push your branch.

CHECKPOINT-0 PUSH: main is checked out in the main repo folder, so from your worktree do: `git fetch origin && git rebase origin/main && git push origin HEAD:main`, then continue on agent/platform.
