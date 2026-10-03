# Plan pracy — 24h (3.10 23:00 → 4.10 23:00)

Wykonawca: **Muse Code** (`muse`) z agentem głównym (lead), który uruchamia **subagenty w izolowanych worktree**.
Uwaga: publiczna paczka Muse na macOS Apple Silicon **nie ma Workflows**, więc używamy subagentów (limit: 8 agentów naraz, wliczając lead; `/subagents` i `/tasks` do podglądu).

Zasady orkiestracji:
- Agenci piszący kod pracują w **izolowanych worktree** na gałęziach `agent/<id>` i commitują na końcu zadania. Lead merguje do `main` w ustalonej kolejności, uruchamia `make test` i `make schema`.
- **Wszystkie modele i migracje powstają w Fazie 0**, w jednym przebiegu. Dzięki temu równoległe worktree nie robią sobie konfliktów migracji. Jeśli agent w Fazie 1+ musi zmienić model, dodaje nową migrację tylko w swojej aplikacji i zgłasza to w raporcie.
- Każdy agent ma **wyłączną własność** swoich katalogów (tabela niżej). Pliki współdzielone (`config/urls.py`, `pl.json`, `en.json`, `router.tsx`) zmienia się tylko przez dopisywanie, a konflikty rozwiązuje lead.
- Zanim agent zakończy pracę, wszystkie testy i lint muszą przechodzić.

## Harmonogram

| Faza | Okno | Agenci (równolegle) | Wynik |
|---|---|---|---|
| 0 Szkielet | 23:00–00:30 | **A0** | `make up` działa, modele i migracje, puste API, powłoka frontu |
| 1 Rdzeń | 00:30–05:00 | **B1, B2, B3, B4, F1** | całe API wg kontraktu, treści seed, system designu i powłoka PWA |
| 2 Ekrany | 05:00–11:00 | **F2, F3, Q1** | wszystkie ekrany podpięte pod API, testy integracyjne |
| 3 Design i demo | 11:00–16:00 | **D1** (Figma → tokeny/komponenty), **Q2** (demo, poprawki), **A1** (AI, opcjonalnie) | dopracowany wygląd, dane demo, nagranie |
| 4 Prezentacja | 16:00–21:30 | ludzie | 10 slajdów PDF, opis, zrzuty ekranu, film demo |
| Bufor | 21:30–23:00 | — | wysyłka na platformę **do 22:30** |

Ludzie równolegle: projekt w Figmie (Faza 1–2), weryfikacja numerów pomocowych i polskiej wersji EPDS, przegląd merge'y, scenariusz pitchu.

## Własność katalogów

| Agent | Zakres | Katalogi |
|---|---|---|
| A0 | szkielet i infrastruktura | `docker-compose.yml`, `Makefile`, `.env.example`, `backend/config/`, wszystkie `backend/apps/*/models.py` i `migrations/`, `frontend/` (szkielet) |
| B1 | konta, onboarding, wsparcie | `apps/accounts`, `apps/support`, `apps/common` |
| B2 | tracking, EPDS, ryzyko, statystyki | `apps/tracking`, `apps/insights` |
| B3 | cele i powiadomienia | `apps/goals`, `apps/notifications`, `config/celery.py` |
| B4 | treści i dane demo | `apps/content`, `backend/fixtures/`, `*/fixtures/*.json`, `seed_*` |
| F1 | fundament frontu | `src/components/`, `src/styles/`, `src/api/`, `src/i18n/`, `src/sw.ts`, `src/features/auth`, `src/app/` |
| F2 | ekrany „śledzenia” | `src/features/{onboarding,home,checkin,cycle,insights,epds}` |
| F3 | ekrany „wsparcia” | `src/features/{goals,support,knowledge,notifications,settings}` |
| Q1/Q2 | jakość, demo | `backend/**/tests`, `frontend/e2e`, poprawki zgłaszane do właściciela lub robione przy małym zakresie |
| D1 | design | `src/styles/`, `src/components/ui/`, `public/` (ikony, ilustracje) |
| A1 | AI | `apps/ai`, karta podsumowania na Home |

---

## Prompty dla Muse (kopiuj i wklejaj)

### Prompt startowy dla lead (wklej o 23:00 w `muse` w katalogu repo)

```text
You are the lead agent for the Otula hackathon project. Read AGENTS.md, docs/SPEC.md and docs/PLAN.md fully first.
Your job: orchestrate subagents phase by phase exactly as defined in docs/PLAN.md, merge their branches into main,
keep `make test` green, regenerate the API schema/types after backend merges, and report progress to me after every phase.
Rules:
- Every writing subagent runs in an ISOLATED WORKTREE on branch agent/<id> and commits its work at the end.
- Read-only reviewers stay in the shared checkout.
- Respect the directory ownership table. Resolve merge conflicts in shared files (urls.py, locales, router) yourself.
- Do not start the next phase until the previous phase is merged and `make up && make migrate && make test` pass.
- After each phase give me: what merged, what failed, open questions, contract changes to docs/SPEC.md §7.
Start with Phase 0: run agent A0 with the prompt from docs/PLAN.md section "A0".
```

### A0 — Szkielet (Faza 0, worktree)

```text
Task A0 (scaffold). Read AGENTS.md and docs/SPEC.md §5, §7, §8.
1. docker-compose.yml with services: db (postgres:16, healthcheck, named volume), redis (redis:7), backend (Django dev server on 8000, depends on db healthy, mounts ./backend),
   worker (celery worker), beat (celery beat), frontend (node:22, vite dev on 5173 with --host, mounts ./frontend). One .env file; .env.example with placeholders.
   Makefile targets: up, down, logs, migrate, seed, test, schema, shell. Backend Dockerfile (python:3.12-slim) and frontend Dockerfile.
2. Django project `config` (settings split base/dev, env via django-environ), custom User (email login) and ALL models from SPEC §5 in their apps
   (accounts, tracking, support, goals, notifications, content, insights (no models), ai (no models), common), with Postgres ArrayFields, sensible indexes
   ((user,date) unique on DailyCheckIn, (goal,date) unique on GoalLog), an EncryptedTextField in apps/common/fields.py (Fernet, key from FIELD_ENCRYPTION_KEY),
   Django admin registration for all models, initial migrations. DRF + SimpleJWT + drf-spectacular + CORS configured; /api/v1/ router root, /api/schema/, /api/docs/, /api/v1/health.
   Celery app in config/celery.py with beat schedule placeholders. pytest configured with one passing smoke test.
3. Frontend: Vite React TS strict, Tailwind + shadcn/ui init, React Router with placeholder routes for every screen in SPEC §4,
   react-i18next with pl/en locale files, TanStack Query provider, src/styles/tokens.css with CSS-variable tokens
   (placeholder warm palette: sage, peach, cream, deep plum text; radius; shadows) mapped in tailwind config, vite-plugin-pwa (injectManifest) with empty src/sw.ts,
   Vitest with one passing test, ESLint + Prettier. `npm run typecheck` script.
4. Verify: `make up`, `make migrate`, `make test` all succeed; http://localhost:5173 renders, /api/docs/ renders.
Commit on branch agent/a0 with conventional commits. Report the exact commands you verified.
```

### B1 — Konta, onboarding, wsparcie (Faza 1, worktree)

```text
Task B1. Read AGENTS.md and docs/SPEC.md (§4 screens 1–2, 8–9, §5 accounts/support, §6.2 R1, §7). Own: apps/accounts, apps/support, apps/common.
Implement: register/login/refresh (JWT, email login), GET/PATCH/DELETE /me, GET /me/export (all user data JSON, decrypted notes),
GET /onboarding/options (coping strategies, worsening factor codes, goal templates filtered by mode/week/delivery_type — query GoalTemplate model directly),
POST /onboarding/complete (atomic: profile, UserCopingPreference rows, worsening factors, optional TrustedContact, Goals from templates + custom goals, onboarding_completed=true),
support: GET /support/toolkit ranked by apps/support/ranking.py (Bayesian formula in SPEC §5), POST/PATCH /support/sessions (PATCH updates used_count/helped_score_sum;
POST with intensity=5 returns risk level urgent with show_crisis), PUT /support/preferences, CRUD /support/contacts, GET /support/contacts/{id}/message
(localized default message using profile tone; returns sms: and https://wa.me/ URLs), GET /support/helplines (public, no auth).
apps/common/i18n.py: get_lang(request) + localized field helper used by serializers. Seed fixture apps/support/fixtures/coping_strategies.json with ~16 strategies (PL+EN, steps)
and helplines.json (112; Polish 24/7 adult crisis support line; 116 123 — every number marked "VERIFY" in a comment field). 
Tests: ranking.py unit tests, onboarding/complete, toolkit order changes after feedback, user isolation. Commit on agent/b1.
```

### B2 — Tracking, EPDS, ryzyko, statystyki (Faza 1, worktree)

```text
Task B2. Read AGENTS.md and docs/SPEC.md (§4 screens 3–6, 10, §5 tracking, §6.1–6.4, §7). Own: apps/tracking, apps/insights.
Implement pure modules with exhaustive unit tests first: tracking/cycle.py (postpartum status + cycle phase/prediction per §6.1),
tracking/risk.py (rules R1–R8 exactly per §6.2, returns {level, reasons, actions}), tracking/epds.py (questions PL/EN with citation, scoring incl. reverse-scored items, risk level, due logic),
insights/engine.py (cards per §6.4 returning {code, params, strength}, min 7 data points).
Endpoints: /checkins (list by range), GET/PUT /checkins/{date} (upsert, returns {checkin, risk}), /cycle/status, /periods CRUD, POST /profile/period-returned,
/epds/questions, GET/POST /epds (returns {assessment, risk}), /epds/due, /insights?range=7|30, /dashboard (single aggregated response per §7; for goals/article fields
call small selector functions — if apps/goals or apps/content selectors don't exist yet, implement them as thin queries on the models inside apps/insights/selectors.py).
Never log notes. Tests for endpoints + user isolation. Commit on agent/b2.
```

### B3 — Cele i powiadomienia (Faza 1, worktree)

```text
Task B3. Read AGENTS.md and docs/SPEC.md (§4 screen 7, 12, §5 goals/notifications, §6.5, §7). Own: apps/goals, apps/notifications, config/celery.py.
Goals: CRUD /goals with computed current_streak, done_today, progress_this_week (goals/streaks.py, unit-tested for daily and N-per-week goals),
POST /goals/{id}/log, GET /goals/today (goals scheduled today), GET /goals/recommended (templates matching profile mode, postpartum week, delivery type; exclude already added).
Notifications: push.py wrapping pywebpush (VAPID from env; delete subscription on 404/410), management command generate_vapid (prints keys for .env),
/push/vapid-public-key, POST/DELETE /push/subscriptions, POST /push/test, /notifications list (paginated), read & read-all.
Celery beat tasks per §6.5 (every minute: goal + check-in reminders in user timezone, daily epds_due, gentle_nudge with 48h throttle — reuse tracking.risk if present, else stub with TODO).
Localized notification texts PL/EN respecting profile tone. Tests with mocked webpush and freezegun. Commit on agent/b3.
```

### B4 — Treści i dane demo (Faza 1, worktree)

```text
Task B4. Read AGENTS.md and docs/SPEC.md (§2, §5 content/goals, §9). Own: apps/content, backend/fixtures, seed commands.
1. content endpoints: GET /articles (filters category, mode; paginated; localized), GET /articles/{slug}, GET /specialists (filters).
2. Fixtures (PL + EN, warm, evidence-based, non-diagnostic, each article ends with a "Sources" list of reputable public sources — WHO, NHS, ACOG, Polish NFZ/pacjent.gov.pl):
   ~16 articles (baby blues vs postpartum depression, sleep when baby wakes, pelvic floor basics, recovery after C-section, diastasis recti, breastfeeding & mood,
   return of periods after birth, mood across the cycle, PMS/PMDD, asking for help, partner guide, gentle movement, nutrition in postpartum, anxiety grounding, intrusive thoughts, self-compassion);
   ~25 goal templates per SPEC §5 (week ranges, C-section variants, safety notes); ~10 SAMPLE specialists clearly marked as example data.
3. `seed_content` (idempotent, loads all fixtures incl. coping strategies/helplines if present) and `seed_demo` per SPEC §9 using models directly
   (deterministic random seed; realistic 6-week postpartum story; EPDS 14→11→8; support sessions shifting toolkit ranking; second cycle-mode user with 4 cycles).
   Demo passwords read from env DEMO_PASSWORD. `make seed` runs both. Commit on agent/b4.
```

### F1 — Fundament frontu (Faza 1, worktree)

```text
Task F1. Read AGENTS.md and docs/SPEC.md (§4, §7, §8). Own: src/components, src/styles, src/api, src/i18n, src/sw.ts, src/features/auth, src/app.
1. API layer: typed fetch client with JWT access/refresh (refresh on 401, logout on failure), Accept-Language header from i18n, openapi-typescript script (`npm run gen:api`),
   TanStack Query hooks for EVERY endpoint in SPEC §7 in src/api/hooks/<domain>.ts (write them against the contract; types from schema when available).
2. Design system on tokens.css: Button, Card, Chip/TagSelector, MoodPicker (5 faces, accessible radio group), ScaleSelector (1–5 / 0–10), Stepper/progress, BottomSheet,
   EmptyState, StatTile, StreakBadge, Toast, PageHeader, Skeletons. Mobile-first layout with bottom nav (Home, Check-in, Goals, Knowledge, Profile)
   and a persistent floating "Tough day" heart button; max width 480px centered on desktop.
3. Auth pages (welcome, login, register with health-data consent checkbox), route guards (unauthenticated → welcome; onboarding_completed=false → /onboarding),
   public /help route placeholder reachable without login.
4. PWA: manifest (name Otula, icons placeholder), sw.ts handling `push` (show notification) and `notificationclick` (focus/open url), usePushSubscription hook
   (permission request, subscribe with VAPID key, POST to API).
5. i18n: all strings in pl.json/en.json, language switcher component.
Vitest tests for client refresh logic and MoodPicker. Commit on agent/f1.
```

### F2 — Ekrany „śledzenia” (Faza 2, worktree)

```text
Task F2. Read AGENTS.md, docs/SPEC.md §4 screens 2–6 and 10, §6. Use ONLY components and hooks from F1 (extend them via small additions, report them).
Build: Onboarding (all 9 steps, progress bar, back/skip, branching by mode, coping-strategy grid with 0–3 rating, goal suggestions, push permission step, POST /onboarding/complete),
Home dashboard (status card: postpartum day/week or cycle ring with phase; today check-in state; today goals with checkboxes; insight card; EPDS due card; article of the day),
Check-in (≤30s flow, red-flag section only in postpartum mode, after save show RiskCard driven by risk.actions: urgent → navigate to /help crisis),
Cycle calendar (month grid colored by mood, period days, add/edit period, prediction, "my period returned" in postpartum),
Insights (Recharts line chart mood/energy/sleep 7/30, mood per phase bar chart, EPDS history, insight cards localized from {code, params}),
EPDS (one question per screen, result screen with non-diagnostic wording, R1 → crisis).
Loading/empty/error states everywhere; PL+EN strings. Commit on agent/f2.
```

### F3 — Ekrany „wsparcia” (Faza 2, worktree)

```text
Task F3. Read AGENTS.md, docs/SPEC.md §4 screens 7–9, 11–13, §6.2, §6.5. Use ONLY components and hooks from F1.
Build: Goals (list with streaks/progress, create/edit form with frequency + reminder time/weekdays, recommended section, log done),
Tough day flow (intensity 1–5 → 5 goes to crisis; animated breathing exercise 4-7-8 and box breathing honoring prefers-reduced-motion; ranked toolkit with step-by-step cards;
"Ask for support" opening sms/WhatsApp URL from API; helplines; closing "Did it help?" + mood after → PATCH session),
Crisis/help page (public: 112, helplines as tel: links, trusted contact one-tap, warm copy),
Knowledge tab with sub-tabs Articles (filters, markdown reader), Specialists (filters, "example data" badge), Helplines,
Notifications list, Settings (language, mode switch, postpartum/cycle data, retake coping survey, trusted contacts CRUD, reminders + push toggle + "send test push",
export JSON download, delete account with confirm, logout, medical disclaimer). PL+EN strings. Commit on agent/f3.
```

### Q1 — Integracja i QA (Faza 2, shared checkout, a na końcu worktree na poprawki)

```text
Task Q1. After F2/F3 are merged: run the full stack, seed demo data, and walk every screen in SPEC §4 for both demo users and both languages.
Add Playwright smoke tests in frontend/e2e (login demo → home → check-in → tough day → goal log → language switch). Add backend contract test that every path in SPEC §7 exists in /api/schema/.
Produce docs/QA_REPORT.md: bugs ranked by demo impact with file references. Fix small bugs yourself in a worktree (agent/q1); report bigger ones to the lead.
```

### D1 — Wdrożenie designu z Figmy (Faza 3, worktree)

```text
Task D1. The team's Figma export/screens are in docs/design/ (images + token list). Map colors, typography, radii, shadows and spacing into src/styles/tokens.css and tailwind config,
restyle src/components/ui and shared components to match, add illustrations/icons to public/, and adjust screen layouts where Figma differs.
Do not change behavior or API usage. Check contrast (WCAG AA) and reduced motion. Before/after screenshots of every screen into docs/screenshots/. Commit on agent/d1.
```

### A1 — Podsumowanie AI (Faza 3, opcjonalnie, worktree)

```text
Task A1 (optional, only if everything else is merged). apps/ai: POST /ai/weekly-summary builds a prompt from the last 7 days of aggregated data (no raw notes),
calls an OpenAI-compatible endpoint configured by LLM_BASE_URL / LLM_API_KEY / LLM_MODEL when LLM_API_KEY is set, otherwise produces a template-based summary
from insights cards. Response {text, source}. Safety: system prompt forbids diagnosis, always includes help resources if risk ≥ moderate. Home card "Your week".
Tests with mocked HTTP. Commit on agent/a1.
```

---

## Prezentacja (maks. 10 slajdów)

1. Tytuł, zespół, hasło („Otula — troska o mamę, nie tylko o dziecko”)
2. Problem: dane o depresji poporodowej, luka po 6 tygodniach, samotność
3. Persony: Ania (połóg) i Kasia (cykl)
4. Rozwiązanie: 5 filarów
5. Innowacja: adaptacyjny zestaw wsparcia i krąg wsparcia
6. Bezpieczeństwo: EPDS, silnik ryzyka, objawy alarmowe, ścieżka kryzysowa
7. Demo: zrzuty ekranów (Home, Check-in, Gorszy dzień, Statystyki)
8. Architektura: Django, React, Postgres, Celery, PWA push, Docker, prywatność (RODO, szyfrowanie)
9. Wpływ i wdrożenie: współpraca z położnymi i POZ, NFZ, fundacje; dalsze kroki
10. Ujawnienie zasobów (AI, biblioteki, EPDS) i podziękowania
