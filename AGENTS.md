# AGENTS.md — Otula (ImpactHer @ HackYeah 2026)

Postpartum & cycle wellbeing PWA. Product spec: `docs/SPEC.md` (Polish) — **it is the source of truth** for features, data model, API contract and risk rules. Work plan and agent ownership: `docs/PLAN.md`.

Hard deadline: **2026-10-04 23:00 CEST**. Prefer a working, polished slice over a broad broken one.

## Stack (fixed — do not swap)
- Backend: Python 3.12, Django 5.x, Django REST Framework, SimpleJWT, drf-spectacular, django-cors-headers, psycopg 3, Celery 5 + Redis, pywebpush, cryptography (Fernet), pytest + pytest-django + factory-boy.
- Frontend: React 18 + Vite + TypeScript (strict), React Router, TanStack Query, react-i18next, Tailwind CSS + shadcn/ui, Recharts, lucide-react, vite-plugin-pwa (injectManifest, custom service worker for push), Vitest + Testing Library.
- DB: PostgreSQL 16. Everything runs via `docker compose`.

## Repository layout
```
backend/
  config/            settings (base/dev), urls, celery.py
  apps/accounts/     User, Profile, auth, /me, export/delete, onboarding
  apps/tracking/     DailyCheckIn, Period, EPDS, cycle status, risk.py
  apps/support/      CopingStrategy, preferences+ranking, sessions, contacts, helplines
  apps/goals/        GoalTemplate, Goal, GoalLog, streaks
  apps/notifications/ PushSubscription, Notification, push.py, tasks.py
  apps/content/      Article, Specialist
  apps/insights/     engine.py, /insights, /dashboard
  apps/ai/           optional weekly summary (provider-agnostic, template fallback)
  fixtures/ + management commands: seed_content, seed_demo, generate_vapid
frontend/
  src/api/           generated types (openapi-typescript) + typed client + query hooks
  src/components/ui/ shadcn primitives;  src/components/  shared app components
  src/features/<feature>/  pages + feature components (onboarding, home, checkin, cycle,
                     insights, goals, support, epds, knowledge, notifications, settings, auth)
  src/i18n/locales/{pl,en}.json
  src/sw.ts          service worker (push + notificationclick)
  src/styles/tokens.css  design tokens (CSS variables) — Figma maps here
docker-compose.yml, Makefile, .env.example
```

## Commands
- `make up` — build & start all services (db, redis, backend, worker, beat, frontend)
- `make migrate`, `make seed` (seed_content + seed_demo), `make test` (backend pytest + frontend vitest)
- `make schema` — regenerate `frontend/src/api/schema.d.ts` from `/api/schema/`
- Frontend: http://localhost:5173 · API: http://localhost:8000/api/v1 · Docs: http://localhost:8000/api/docs/

## Conventions
- **Contract first.** The API in `docs/SPEC.md` §7 is the contract between backend and frontend agents. Do not change a path or field name unilaterally — if a change is needed, update SPEC §7 in the same commit and note it in your final report.
- Backend: one Django app per domain; business logic in plain modules (`risk.py`, `engine.py`, `ranking.py`, `cycle.py`) with unit tests, thin views/serializers. Every queryset is filtered by `request.user`. Bilingual DB content uses `*_pl`/`*_en` fields; serializers pick the language from `Accept-Language` (helper in `apps/common/i18n.py`).
- Frontend: no hardcoded user-facing strings — always `t('...')` with keys in both `pl.json` and `en.json`. Use design tokens (Tailwind theme mapped to CSS vars), never raw hex in components. Mobile-first (390px), max content width 480px on desktop, touch targets ≥44px, respect `prefers-reduced-motion`.
- Server state only via TanStack Query hooks in `src/api/hooks/`. No global state library.
- Tests: each backend app ships tests for its logic modules and main endpoints. Keep `make test` green before finishing.
- Commits: small, conventional (`feat(goals): ...`). Commit only when your task says so.

## Product-safety rules (non-negotiable)
- Never present a diagnosis. Wording: "Your result suggests it may help to talk to a specialist", not "you have depression".
- Crisis UI (`/help`) must work without login and be reachable in ≤2 taps from every screen.
- Postpartum exercise content always carries a "consult your doctor/physiotherapist" note.
- No fertile-window / contraception predictions.
- Notes are encrypted at rest; never log check-in contents or notes.
- Helpline numbers live only in seed data (`apps/support/fixtures/helplines.json`) and must be marked `# VERIFY` until a human confirms them.
- Do not add analytics, trackers or external network calls (except optional LLM provider behind a feature flag).

## Secrets
`.env` is git-ignored; `.env.example` holds placeholders and local demo values only. VAPID keys are generated locally via `python manage.py generate_vapid`. No real API keys in the repo.
