# Prompty dla agentów (praca równoległa)

Każdy agent to osobna sesja `muse`, uruchomiona w **osobnym worktree** na swojej gałęzi. Wszyscy startują jednocześnie. Zasady współpracy są w `AGENTS.md` → „Parallel work protocol” (Muse wczytuje ten plik automatycznie).

## Start (dla każdego agenta, w terminalu)

```bash
cd ~/Desktop/GIT/shehacks2026 && git pull
git worktree add ../otula-<id> -b agent/<id> origin/main
cd ../otula-<id> && muse
```
Potem wklej prompt danego agenta. `<id>` = identyfikator z tabeli.

| # | id | Obszar | Backend port | Frontend port |
|---|---|---|---|---|
| 1 | `platform` | infrastruktura, szkielet Django, konta, onboarding API | 8000 | — |
| 2 | `b-track` | check-iny, cykl/połóg, EPDS, ryzyko, statystyki, prognoza, noc | 8010 | — |
| 3 | `b-care` | zestaw wsparcia, krąg, wygrane, pytania i raport na wizytę | 8020 | — |
| 4 | `b-goals` | cele, powiadomienia, web push, Celery | 8030 | — |
| 5 | `b-content` | artykuły, specjaliści, wszystkie treści, dane demo | 8040 | — |
| 6 | `f-core` | szkielet frontu, design system, layout, auth, PWA | 8000* | 5173 |
| 7 | `f-daily` | onboarding, Dzisiaj, check-in, Kalendarz, Wzorce, EPDS | — | 5174 |
| 8 | `f-care` | Wsparcie, Gorszy dzień, /help, Krąg (+ strona publiczna), wygrane, Nocna zmiana | — | 5175 |
| 9 | `f-plan` | Cele, Wiedza, Raport na wizytę, Profil, Powiadomienia | — | 5176 |
| 10 | `integrator` | merge, testy, schemat API, prośby między agentami (najlepiej człowiek + agent) | 8000 | 5173 |

\* frontend łączy się z backendem integratora/platformy dopiero po merge'u; wcześniej MSW (`VITE_USE_MOCKS=true`).

### Wspólne nazwy ustalone z góry (nikt ich nie zmienia)
- **Backend, powiadomienia**: `apps.notifications.services.notify(user, kind: str, title: str, body: str, url: str = "/") -> Notification` (implementuje `b-goals`). Inni wołają przez `try: from apps.notifications.services import notify except ImportError: notify = None`.
- **Backend, Celery beat** (ustawia `platform` w settings): `apps.notifications.tasks.send_due_goal_reminders` (co 1 min), `send_checkin_reminders` (co 1 min), `send_epds_due` (codziennie 10:00), `send_gentle_nudges` (co 30 min).
- **Backend, eksport**: każda aplikacja może mieć `export.py` z `export_user_data(user) -> dict`. `platform` zbiera je w `/me/export`.
- **Backend, selektory dla dashboardu**: `apps.goals.selectors.today_goals(user)`, `apps.content.selectors.article_of_the_day(user, lang)`, `apps.support.selectors.top_strategies(user, n=2)`, `apps.journal.selectors.wins_count(user)`.
- **Frontend, trasy**: `/welcome` `/login` `/register` `/onboarding` `/today` `/calendar` `/patterns` `/goals` `/support` `/knowledge` `/knowledge/:slug` `/profile` `/notifications` `/report` `/epds` `/night` `/help` (publiczna) `/c/:token` (publiczna). Modale jako trasy nad tłem: `/checkin`, `/tough-day`, `/quick-add`.
- **Frontend, widżety eksportowane z `features/<x>/index.ts`** (f-core tworzy zaślepki, właściciele podmieniają): `goals → TodayGoalsCard`, `wins → WinsJarCard, RandomWinCard`, `support → TopStrategiesCards`, `insights → ForecastCard, InsightCard`, `epds → EpdsDueCard`.

---

## 1. `platform` — infrastruktura, szkielet, konta

```text
You are agent `platform`. Read AGENTS.md (especially "Parallel work protocol"), docs/SPEC.md §5 accounts, §7, §8, and docs/AGENT_PROMPTS.md "shared names".
You own: docker-compose.yml, Makefile, .env.example, backend/Dockerfile, backend/requirements*.txt, backend/config/**, backend/apps/common/**, backend/apps/accounts/**,
and the empty skeleton of every other backend app.

PART A — CHECKPOINT-0 (do this first, fast, ≤30 min, commit directly to main with prefix "chore(checkpoint-0)" and push):
1. docker-compose.yml: db (postgres:16 + healthcheck + volume, NO host port mapping), redis:7 (NO host port mapping), backend (runserver 0.0.0.0:8000 → host ${BACKEND_PORT:-8000}), worker, beat,
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
```

## 2. `b-track` — tracking, EPDS, ryzyko, statystyki, prognoza, noc

```text
You are agent `b-track`. Read AGENTS.md (protocol!), docs/SPEC.md §4, §5 tracking, §6.1–6.4, §6.6, §6.7, §7 and docs/design/SCREENS.md §1 (K4, K1), §3.4–3.6, §3.11, §3.14.
You own: backend/apps/tracking/**, backend/apps/insights/** (after checkpoint-0 exists).

BEFORE checkpoint-0 is on main: write pure, Django-free modules with exhaustive pytest unit tests (plain dataclasses as inputs):
tracking/cycle.py (§6.1), tracking/risk.py (R1–R8 exactly per §6.2), tracking/epds.py (10 questions PL+EN with citation comment, scoring incl. reverse-scored items,
risk level, due logic), insights/engine.py (cards §6.4 → {code, params, strength}, min 7 points), insights/forecast.py (§6.6 exactly). Do not create apps.py/urls.py/__init__.py yet.

AFTER rebasing on checkpoint-0:
- Models DailyCheckIn (note = EncryptedTextField), Period, EPDSAssessment per SPEC §5 + migrations (only your apps).
- Endpoints: /checkins?from&to, GET/PUT /checkins/{date} (upsert → {checkin, risk}), /cycle/status, /periods CRUD, POST /profile/period-returned,
  /epds/questions, GET/POST /epds (→ {assessment, risk}), /epds/due, /insights?range=7|30, /forecast/tomorrow, /night/now (§6.7, null if < 5),
  /dashboard (one response per §7; uses the selectors from "shared names" via try-import, falling back to empty values).
- tracking/export.py and insights selectors you expose: `apps.tracking.selectors.latest_checkins(user, days)` and `mood_today(user)` (used by circle).
- Never log notes. Tests for every endpoint + user isolation. Report in docs/agents/reports/b-track.md, push agent/b-track often.
```

## 3. `b-care` — wsparcie, krąg, wygrane, raport

```text
You are agent `b-care`. Read AGENTS.md (protocol!), docs/SPEC.md §2, §5 support/circle/journal, §6.2, §6.8, §7 and docs/design/SCREENS.md §1 (K2, K3, K5, K6), §3.8–3.13.
You own: backend/apps/support/**, backend/apps/circle/**, backend/apps/journal/**.

BEFORE checkpoint-0: support/ranking.py (Bayesian formula SPEC §5, pure + tests); fixtures support/fixtures/coping_strategies.json (~16 strategies PL+EN with steps,
category, duration, icon name from lucide) and helplines.json (112 and Polish adult crisis lines; every entry has "verify": true); circle message templates PL/EN for
"ask for support" (gentle/motivating tone).

AFTER rebasing on checkpoint-0:
- support: models CopingStrategy, UserCopingPreference, SupportSession, TrustedContact, Helpline; GET /support/toolkit (ranked + evidence "helped X of Y"),
  POST/PATCH /support/sessions (PATCH updates ranking counters; POST intensity=5 → risk urgent/show_crisis), PUT /support/preferences, CRUD /support/contacts,
  GET /support/contacts/{id}/message (text + sms: + https://wa.me/ URLs), GET /support/helplines (public). selectors.top_strategies(user, n).
- circle: CircleLink, CareRequest; /circle/link GET/POST/PATCH/DELETE, /circle/requests CRUD, PUBLIC /circle/public/{token}, .../claim, .../done
  (AllowAny + "public" throttle; revoked → 404; response only mom display name, requests, optional mood color via apps.tracking.selectors.mood_today if share_mood).
  Claim/done → notify() from shared names (try-import).
- journal: SmallWin, VisitQuestion (EncryptedTextField), CRUD /wins + /wins/random, CRUD /visit-questions, GET /reports/visit?weeks=2|4|6 (aggregate from tracking models;
  if b-track isn't merged yet, code against SPEC §5 names). selectors.wins_count(user). export.py for all three apps.
- Tests: ranking order changes after feedback; public endpoints never leak notes/symptoms/EPDS; throttling; isolation. Report docs/agents/reports/b-care.md, push often.
```

## 4. `b-goals` — cele, powiadomienia, push, Celery

```text
You are agent `b-goals`. Read AGENTS.md (protocol!), docs/SPEC.md §5 goals/notifications, §6.5, §7 and docs/design/SCREENS.md §3.7, §3.17.
You own: backend/apps/goals/**, backend/apps/notifications/**.

BEFORE checkpoint-0: goals/streaks.py (current streak + progress for daily and N-per-week goals, pure + tests); goals/fixtures/goal_templates.json (~25 templates PL+EN
per SPEC §5: week ranges, C-section variants, safety notes, mode postpartum/cycle/both); notification copy PL/EN for every kind × tone (gentle/motivating).

AFTER rebasing on checkpoint-0:
- Models GoalTemplate, Goal, GoalLog, PushSubscription, Notification + migrations.
- Goals API: CRUD /goals (+ current_streak, done_today, progress_this_week), POST /goals/{id}/log, GET /goals/today, GET /goals/recommended (profile mode,
  postpartum week, delivery type; exclude added). selectors.today_goals(user).
- notifications/services.py notify(user, kind, title, body, url) → creates Notification and sends web push to all subscriptions (push.py with pywebpush, VAPID from env,
  delete subscription on 404/410, never raise to caller). management command generate_vapid. API: /push/vapid-public-key, POST/DELETE /push/subscriptions, POST /push/test,
  /notifications (paginated), /notifications/{id}/read, /notifications/read-all.
- notifications/tasks.py with the 4 Celery tasks from "shared names" (user timezone, ±1 min window, gentle nudge throttle 48h using tracking.risk via try-import).
- Tests with mocked webpush + freezegun. export.py. Report docs/agents/reports/b-goals.md, push often.
```

## 5. `b-content` — treści i dane demo

```text
You are agent `b-content`. Read AGENTS.md (protocol!), docs/SPEC.md §2, §5 content, §9 and docs/design/SCREENS.md §0 (copy tone!), §3.15.
You own: backend/apps/content/** (incl. management commands seed_content and seed_demo), backend/fixtures/**.

BEFORE checkpoint-0 (most of your work — writing): content/fixtures/articles.json with 16 articles PL+EN (markdown body 400–700 words, warm, concrete, non-diagnostic,
human tone from SCREENS §0 — no generic AI phrasing; each ends with "Źródła/Sources" linking WHO, NHS, ACOG, pacjent.gov.pl or similar): baby blues vs postpartum
depression, sleep with a newborn, pelvic floor basics, recovery after C-section, diastasis recti, breastfeeding & mood, return of periods after birth, mood across
the cycle, PMS/PMDD, how to ask for help, guide for partners (linked from the public circle page — slug `jak-wspierac-mame`), gentle movement, postpartum nutrition,
anxiety grounding 5-4-3-2-1, intrusive thoughts, self-compassion. Fields per SPEC §5 (category, mode, week range, reading_minutes, cover image filename).
specialists.json: 10 clearly fictional sample entries (is_sample=true).

AFTER rebasing on checkpoint-0:
- Models Article, Specialist + migrations; GET /articles (filters, paginated, localized), /articles/{slug}, /specialists (filters); selectors.article_of_the_day(user, lang)
  (match mode + postpartum week, deterministic per day).
- seed_content: idempotent, loads fixtures of ALL apps that exist (content, support, goals) via loaddata/update_or_create.
- seed_demo (deterministic random seed, password from env DEMO_PASSWORD) exactly per SPEC §9: Marta (postpartum day 39, C-section, breastfeeding) with 6 weeks of
  realistic check-ins (dip in weeks 2–3, recovery after walks + sleep), EPDS 14→11→8, 5 goals with logs, 6 support sessions shifting the ranking, circle link with
  4 requests (1 claimed by "Tomek", 1 done), 9 small wins, 3 visit questions; second user Kasia in cycle mode with 4 cycles; 12 background users with night last_seen_at.
  Models of other apps may not be merged yet — write it against SPEC §5 names, guard each block with apps.is_installed/try-import, finish after integrator merges.
- Tests: seed commands run twice without duplicates. Report docs/agents/reports/b-content.md, push often.
```

## 6. `f-core` — szkielet frontu i design system

```text
You are agent `f-core`. Read AGENTS.md (protocol!), docs/design/README.md, docs/design/SCREENS.md §0, §2, §4, docs/design/figma-make/App.tsx + styles.css,
look at docs/design/screens/*.jpg, and docs/SPEC.md §7–8. You own: frontend/** except src/features/<feature>/** of other agents, src/api/<domain>.ts and src/mocks/handlers/<domain>.ts of other domains.

PART A — CHECKPOINT-0 (≤30 min, commit to main "chore(checkpoint-0): frontend skeleton", push):
Vite + React + TS strict, Tailwind (theme mapped to CSS vars in src/styles/tokens.css — exact Figma tokens + night theme under [data-theme="night"] from SCREENS §3.11
+ mood scale SCREENS §4), @fontsource Newsreader + DM Sans, React Router with AUTO-REGISTRATION of `src/features/*/routes.tsx` (import.meta.glob, each exports
`routes: RouteObject[]` with optional `handle: { public?: boolean, modal?: boolean, nav?: ... }`) incl. modal routes over a background location,
i18next with AUTO-REGISTRATION of `src/features/*/locales/{pl,en}.json` as namespace = folder name, TanStack Query provider, MSW (enabled by VITE_USE_MOCKS)
with AUTO-REGISTRATION of `src/mocks/handlers/*.ts`, `@/` alias, ESLint + Prettier + Vitest, npm scripts dev/build/test/typecheck/lint/gen:api.
Create stub folders for every feature (auth, onboarding, today, checkin, calendar, patterns, epds, support, toughday, help, circle, wins, night, goals,
knowledge, report, profile, notifications, insights) with routes.tsx (placeholder page using the shared Placeholder pattern), locales/pl.json + en.json ({}),
index.ts exporting the placeholder widgets listed in "shared names". Dockerfile. Commit + push to main.

PART B — branch agent/f-core:
1. Components (src/components, faithful to Figma, see SCREENS §0 for the anti-AI rules): Button (primary/forest/peach/link/text/icon), Card variants (paper, featured sage,
   lavender, forest hero with petal art), Eyebrow, SerifNumber, StagePill, Pill/TagSelector, Segmented, MoodScale (5 tiles, colors from mood scale, accessible radiogroup),
   Scale (1–5, 0–10), Stepper (+/−), PetalProgress (4-petal fill indicator + N-step petal bar), Modal/Sheet (rise/fade; full-screen sheet ≤620px), Toast, EmptyState,
   Skeleton, Placeholder, Brand logo (petals SVG from App.tsx), paper-grain background (SVG noise 3–4%), line-drawn weather icons (sunny/partly/cloudy/rainy, custom SVG).
2. App shell: sidebar (Dzisiaj, Kalendarz, Wzorce, Cele, Wsparcie, Wiedza + Profil + "Potrzebujesz pomocy?" card → /help), sticky blurred topbar (date, "Gorszy dzień"
   pill → /tough-day, moon toggle for night mode, bell with unread dot → /notifications, avatar → /profile), mobile bottom nav (Dzisiaj, Kalendarz, [+] → /quick-add,
   Cele, Wsparcie), breakpoints 1080/820/620. QuickAdd sheet with 4 actions (check-in, small win, visit question, period started — links to owners' routes).
   useNightMode() (profile.night_mode auto 22–6 local + manual toggle, sets data-theme, 600 ms transition).
3. api/client.ts (base URL from VITE_API_URL, JWT access/refresh with refresh-on-401 and logout, Accept-Language from i18n), api/auth.ts + api/me.ts hooks,
   mocks/handlers/auth.ts + me.ts (demo user Marta per SPEC §9).
4. features/auth: welcome (SCREENS §3.1), login, register (health-data consent checkbox), route guards (no token → /welcome; onboarding_completed=false → /onboarding;
   public routes: /help, /c/:token, /welcome, /login, /register).
5. PWA: manifest (Otula, theme #3f6959, background #f8f5ef, icons from logo), src/sw.ts (push → showNotification, notificationclick → focus/open url),
   api/push.ts usePushSubscription (permission, subscribe with VAPID key from /push/vapid-public-key, POST /push/subscriptions).
Tests: client refresh logic, MoodScale a11y, route auto-registration. Report docs/agents/reports/f-core.md, push often.
```

## 7. `f-daily` — onboarding, Dzisiaj, check-in, Kalendarz, Wzorce, EPDS

```text
You are agent `f-daily`. Read AGENTS.md (protocol!), docs/design/SCREENS.md §0, §3.2–3.6, §3.14, §4 (follow them exactly — they override SPEC §4 details),
docs/design/README.md, docs/design/figma-make/App.tsx (Dzisiaj, check-in modal), docs/SPEC.md §6.1–6.4, §6.6, §7.
You own: src/features/{onboarding,today,checkin,calendar,patterns,epds,insights}/**, src/api/{tracking,insights,onboarding}.ts, src/mocks/handlers/{tracking,insights,onboarding}.ts.

BEFORE checkpoint-0: write TS types + TanStack Query hooks for your domains from SPEC §7 and MSW handlers with realistic data for Marta (6 weeks, SPEC §9), plus all
PL+EN copy for your screens (namespaced JSON) in the human tone of SCREENS §0. Do not create package.json/vite config.

AFTER rebasing on checkpoint-0 (use f-core components; if something is missing, build it inside your feature and log a request):
- Onboarding: 7 steps (SCREENS §3.2), big serif step number, petal progress, branching by mode, coping rating as rows with 4-petal scale, POST /onboarding/complete,
  push permission step via usePushSubscription, finale animation.
- Today (/today): faithful to Figma + forecast card, check-in hero turning into day summary, recommendations (TopStrategiesCards from features/support index),
  insight card, right column: TodayGoalsCard (features/goals), EpdsDueCard, WinsJarCard (features/wins), article card. Export ForecastCard, InsightCard, EpdsDueCard.
- Check-in (/checkin modal route): 4 steps per SCREENS §3.4, red-flag section in postpartum with immediate tel: actions, voice dictation button (Web Speech API,
  lang by i18n, hidden if unsupported), "save as visit question" checkbox (POST /visit-questions), success + RiskCard by risk.actions (urgent → /help).
- Calendar (/calendar): Month | Patterns segmented, mood dots, period lines, predicted period dashed, postpartum week strip with 6-week milestone, day drawer/sheet,
  period start/end, "my period returned".
- Patterns (/patterns): editorial report — mood ribbon (Recharts styled: no grid, Y only 1 and 5, sleep bars behind) with HAND-WRITTEN ANNOTATIONS on key points,
  3 findings with big serif numbers, phase wheel (cycle mode), EPDS timeline with threshold bands, strategy effectiveness bars, CTA → /report.
- EPDS (/epds): intro, one question per screen, 10-petal progress, result-first wording, R1 → /help.
Tests for check-in flow and risk handling. Report docs/agents/reports/f-daily.md, push often.
```

## 8. `f-care` — Wsparcie, Gorszy dzień, pomoc, Krąg, wygrane, Nocna zmiana

```text
You are agent `f-care`. Read AGENTS.md (protocol!), docs/design/SCREENS.md §0, §1, §3.8–3.12, §3.3 (wins card), §4 (follow exactly), docs/design/figma-make/App.tsx
(HardDayModal), docs/SPEC.md §6.2, §6.7, §6.8, §7. You own: src/features/{support,toughday,help,circle,wins,night}/**, src/api/{support,circle,wins,night}.ts,
src/mocks/handlers/{support,circle,wins,night}.ts.

BEFORE checkpoint-0: types + hooks + MSW handlers for your domains (realistic Marta data: toolkit ranking with evidence, circle with 4 requests, 9 wins, awake_count 37),
all PL+EN copy in the human tone of SCREENS §0.

AFTER rebasing on checkpoint-0:
- Support hub (/support) per SCREENS §3.8. Export TopStrategiesCards (2 best strategies with "helped X of Y" evidence).
- Tough day (/tough-day modal route) per SCREENS §3.9: intensity petals (5 → /help), breathing orb faithful to Figma (4-7-8 and box, 1-min timer, phase text,
  reduced-motion fallback), top 3 strategies with step-by-step + timer, ask for support (sms/WhatsApp URL from API), RandomWinCard, "did it help?" + mood after → PATCH.
- Help (/help, PUBLIC, no auth, no decoration) per SCREENS §3.10, tel: links, trusted contact when logged in.
- Circle: mum side inside /support (requests list with statuses, new request sheet, share link: copy + navigator.share, revoke, share_mood toggle) and the PUBLIC
  page /c/:token per SCREENS §3.12 (claim with name, done, partner guide link /knowledge/jak-wspierac-mame — make that article route public-safe or link to help).
- Wins: WinsJarCard (jar fills with petals, add sheet), RandomWinCard, export both.
- Night shift (/night + automatic home swap when night theme active on /today → redirect to /night unless user dismissed tonight): SCREENS §3.11, time in serif,
  "X mam też teraz nie śpi" (hidden when null), 4 big actions (quick 1-tap mood check-in via PUT /checkins/{today}, breathe, can't sleep 5-4-3-2-1, note for morning).
Tests: tough-day flow, public circle page without auth. Report docs/agents/reports/f-care.md, push often.
```

## 9. `f-plan` — Cele, Wiedza, Raport, Profil, Powiadomienia

```text
You are agent `f-plan`. Read AGENTS.md (protocol!), docs/design/SCREENS.md §0, §3.7, §3.13, §3.15–3.17 (follow exactly), docs/design/README.md, docs/SPEC.md §6.5, §7.
You own: src/features/{goals,knowledge,report,profile,notifications}/**, src/api/{goals,content,visit,notifications}.ts, src/mocks/handlers/{goals,content,visit,notifications}.ts.

BEFORE checkpoint-0: types + hooks + MSW handlers (Marta's 5 goals with logs, 16 articles with short bodies, 10 sample specialists, 3 visit questions, report data,
notifications), all PL+EN copy in the human tone of SCREENS §0.

AFTER rebasing on checkpoint-0:
- Goals (/goals) per SCREENS §3.7: rows with 4-petal weekly indicator and serif streak, recommended carousel with reasons, new/edit goal sheet with rhythm,
  reminder time + 7 weekday circles and live sentence preview, log done with petal-closing animation. Export TodayGoalsCard (Figma "Dzisiaj" card: checkboxes,
  "1 z 3", progress bar).
- Knowledge (/knowledge, /knowledge/:slug) per SCREENS §3.15: editorial list, featured article for the user's week, filters, reader (680px column, sources,
  "save as visit question"), specialists with "dane przykładowe" badge, helplines tab (reuse data from /support/helplines).
- Visit report (/report) per SCREENS §3.13: weeks selector, section toggles, A4-like preview, charts, EPDS table, symptoms frequency, red flags, questions with
  checkboxes + add, disclaimer, print via window.print() with dedicated @media print CSS (looks great as PDF).
- Profile (/profile) per SCREENS §3.16 incl. language switch, mode switch, retake coping survey link, circle link (to /support), reminders + push toggle + "send test",
  night mode auto/off, export JSON download, delete account confirm, logout, medical disclaimer.
- Notifications (/notifications) sheet/page per SCREENS §3.17, mark read, actions.
Tests: goal form validation, report print view renders. Report docs/agents/reports/f-plan.md, push often.
```

## 10. `integrator` — scalanie (człowiek z agentem w głównym katalogu repo)

```text
You are agent `integrator` working in the main checkout on branch main. Read AGENTS.md, docs/PLAN.md and docs/AGENT_PROMPTS.md.
Every ~30–45 min: `git fetch --all`, list agent/* branches with new commits, merge them into main one by one in this order when conflicts are possible:
platform → b-track → b-goals → b-care → b-content → f-core → f-daily → f-plan → f-care. After each merge: `make up`, `make migrate`, `make test`;
if red, fix trivially or revert the merge and tell the owner via docs/agents/requests/integrator.md. After backend merges run `make schema` and commit.
Read docs/agents/requests/*.md and apply cross-area requests (SPEC §7 changes, shared components, settings). Keep a running status table in docs/agents/STATUS.md
(agent, last merged commit, green/red, blockers). Never rewrite agent branches. Push main after every green merge.
When all features are merged: run `make seed`, walk all screens at 1440/820/375 for both demo users and both languages, write docs/agents/QA.md with bugs ranked by demo impact.
```

---

## Faza końcowa (po merge'ach, ok. 14:00–18:00)
- **qa**: testy E2E w Playwright (logowanie demo → Dzisiaj → check-in → Gorszy dzień → cel → przełączenie języka → Nocna zmiana → strona publiczna kręgu → raport), naprawa błędów z `docs/agents/QA.md`.
- **polish** (z `f-core`): porównanie każdego ekranu z `docs/design` w 3 rozdzielczościach, spójność, puste stany, animacje, zrzuty do `docs/screenshots/` na prezentację.
- **ai** (opcjonalnie, tylko gdy wszystko działa): `apps/ai` z cotygodniowym podsumowaniem i wariantem szablonowym bez klucza API (patrz SPEC W7).
