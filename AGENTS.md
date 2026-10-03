# AGENTS.md — Otula (ImpactHer @ HackYeah 2026)

Postpartum & cycle wellbeing PWA. Product spec: `docs/SPEC.md` (Polish) — **source of truth** for features, data model, API contract (§7) and risk rules. Plan: `docs/PLAN.md`. Per-agent tasks: `docs/AGENT_PROMPTS.md`.
Visual design: `docs/design/SCREENS.md` (every screen, copy, killer features, **anti-"AI look" rules**) + `docs/design/README.md` (tokens, layout, patterns) + reference code `docs/design/figma-make/` + screenshots `docs/design/screens/` — **all UI must follow it**.

Hard deadline: **2026-10-04 23:00 CEST**. Prefer a working, polished slice over a broad broken one.

## Stack (fixed — do not swap)
- Backend: Python 3.12, Django 5.x, Django REST Framework, SimpleJWT, drf-spectacular, django-cors-headers, psycopg 3, Celery 5 + Redis, pywebpush, cryptography (Fernet), pytest + pytest-django + factory-boy + freezegun.
- Frontend: React 18 + Vite + TypeScript (strict), React Router, TanStack Query, react-i18next, Tailwind CSS + shadcn/ui, Recharts, lucide-react, MSW (mocks), vite-plugin-pwa (injectManifest, custom service worker for push), Vitest + Testing Library.
- DB: PostgreSQL 16. Everything runs via `docker compose`.

## Repository layout
```
backend/
  config/              settings (base/dev/test), urls.py (auto-includes every app's urls.py), celery.py
  apps/common/         EncryptedTextField, i18n helpers, permissions, base test factories
  apps/accounts/       User (email login), Profile, auth, /me, export/delete, onboarding
  apps/tracking/       DailyCheckIn, Period, EPDS, cycle.py, risk.py, epds.py
  apps/insights/       engine.py, forecast.py, /insights, /dashboard, /forecast, /night
  apps/support/        CopingStrategy, ranking.py, sessions, contacts, helplines
  apps/circle/         CircleLink, CareRequest, public token endpoints
  apps/journal/        SmallWin, VisitQuestion, visit report
  apps/goals/          GoalTemplate, Goal, GoalLog, streaks.py
  apps/notifications/  PushSubscription, Notification, push.py, tasks.py
  apps/content/        Article, Specialist, seed_content, seed_demo
  apps/<app>/export.py optional `export_user_data(user) -> dict` — collected by /me/export
frontend/src/
  app/                 providers, layout (sidebar/topbar/bottom nav), router (auto-registers routes)
  components/          shared UI (F-Core only)
  styles/tokens.css    design tokens (day + night theme)
  api/client.ts        fetch client with JWT refresh (F-Core)
  api/<domain>.ts      types + TanStack Query hooks per domain (owned by the feature agent of that domain)
  mocks/handlers/<domain>.ts  MSW handlers per domain (auto-registered via import.meta.glob)
  features/<feature>/  pages, components, routes.tsx (auto-registered), locales/{pl,en}.json (auto-registered namespace)
  sw.ts                service worker (push + notificationclick)
docker-compose.yml, Makefile, .env.example
```

## Parallel work protocol (READ BEFORE ANY CHANGE)
Several agents work **at the same time** on separate branches. To avoid conflicts:
1. **Branch & worktree**: you work on branch `agent/<your-id>` (e.g. `agent/b-track`) in your own worktree (`git worktree add ../otula-<id> -b agent/<id> origin/main`). Never commit to `main` directly (only `platform`/`f-core` for checkpoint-0, and the integrator).
2. **Ownership**: edit only the paths listed for your agent in `docs/AGENT_PROMPTS.md`. Shared registries are automatic (backend `config/urls.py` includes every app; frontend globs `features/*/routes.tsx`, `features/*/locales/*.json`, `mocks/handlers/*.ts`) — so you never need to edit someone else's file.
3. **Need something outside your area** (a field, an endpoint change, a shared component)? Do not edit it. Append a request to `docs/agents/requests/<your-id>.md` (your own file) and work around it locally (e.g. a component inside your feature folder). Contract changes to SPEC §7 go there too — the integrator applies them.
4. **Checkpoint-0**: `platform` (backend skeleton) and `f-core` (frontend skeleton) push the skeleton to `main` within ~30 min and tag nothing — just commit message prefix `chore(checkpoint-0)`. Until `git log origin/main --oneline | grep checkpoint-0` shows both, other agents work on files that don't depend on it (pure logic modules + tests, fixtures, types, mocks, page components) and **must not create** the skeleton files (`apps.py`, `__init__.py`, app `urls.py`, `package.json`, `vite.config.ts`, …). Then `git fetch && git rebase origin/main`.
5. **Sync often**: `git fetch && git rebase origin/main` every ~45 min and before pushing. Push your branch after every meaningful green step (`git push -u origin agent/<id>`); the integrator merges in small batches.
6. **Migrations**: only for your own app (`python manage.py makemigrations <your_app>`). Never edit another app's migrations. If a rebase brings a new migration in your app with the same number, delete yours, rebase, regenerate.
7. **Ports** (each worktree runs its own compose project — set in your `.env`): `COMPOSE_PROJECT_NAME=otula-<id>`, `BACKEND_PORT` / `FRONTEND_PORT` from the table in `docs/AGENT_PROMPTS.md`. Frontend agents may run `npm run dev` with `VITE_USE_MOCKS=true` without the backend.
8. **Done = green**: your tests pass, lint/typecheck pass, `docker compose up` still starts. Write a short report in `docs/agents/reports/<your-id>.md` (what's done, what's missing, contract deviations).

## Commands
- `make up` / `make down` / `make logs`, `make migrate`, `make seed` (seed_content + seed_demo), `make test` (pytest + vitest), `make lint`
- `make schema` — regenerate `frontend/src/api/schema.d.ts` from `/api/schema/` (integrator, after backend merges)
- Frontend: http://localhost:${FRONTEND_PORT:-5173} · API: http://localhost:${BACKEND_PORT:-8000}/api/v1 · Docs: /api/docs/

## Conventions
- **Contract first.** API in `docs/SPEC.md` §7 (+ §6 logic). Backend implements it exactly; frontend codes against it (MSW mocks first, real API after merge). Field names snake_case in JSON and in TS types.
- Backend: business logic in plain modules (`risk.py`, `engine.py`, `forecast.py`, `ranking.py`, `cycle.py`, `streaks.py`) with unit tests; thin views/serializers; every queryset filtered by `request.user`; bilingual DB content `*_pl`/`*_en`, language from `Accept-Language` via `apps.common.i18n`. Cross-app reads go through small `selectors.py` functions of the owning app; if they don't exist yet, query the model directly and leave `# TODO selector`.
- Frontend: no hardcoded user-facing strings — `t('ns:key')` with the feature namespace, keys in both `pl.json` and `en.json`. Tokens only (Tailwind theme mapped to CSS vars: `bg-cream`, `text-ink`, `bg-forest`, …), never raw hex. Fonts Newsreader (headings) + DM Sans (body). Icons lucide-react strokeWidth 1.8. Responsive like Figma: sidebar ≥821px, bottom nav ≤820px; touch targets ≥44px; min font 11px; `prefers-reduced-motion`. Every screen has loading, empty and error states.
- Server state only via TanStack Query hooks in `src/api/<domain>.ts`. No global state library.
- Commits: small, conventional (`feat(goals): ...`).

## Product-safety rules (non-negotiable)
- Never present a diagnosis. Wording: "Your result suggests it may help to talk to a specialist", not "you have depression".
- Crisis UI (`/help`) works without login and is reachable in ≤2 taps from every screen.
- Postpartum exercise content always carries a "consult your doctor/physiotherapist" note.
- No fertile-window / contraception predictions.
- Notes, wins, visit questions are encrypted at rest; never log check-in contents or notes.
- Public circle endpoints never expose notes, symptoms, EPDS or check-in details.
- Helpline numbers live only in seed data and are marked `VERIFY` until a human confirms them.
- No analytics, trackers or external network calls (except optional LLM provider behind a feature flag).

## Secrets
`.env` is git-ignored; `.env.example` holds placeholders and local demo values only. VAPID keys via `python manage.py generate_vapid`. No real API keys in the repo.
