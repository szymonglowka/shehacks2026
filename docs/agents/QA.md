# QA — polish round (agent/qa)

Date: 2026-10-04. Branch: `agent/qa`. Method: Playwright E2E suite (new,
`frontend/e2e/`, runs against the REAL API) + backend contract probe
(Django test client vs seeded sqlite DB) + code inspection of every screen
on the demo path.

## Environment blockers (not product bugs)

- **E1.** Docker unavailable in this sandbox (`docker.sock` permission
  denied) → `docker compose` stack could not be started here.
- **E2.** Sandbox denies `bind()` (`EPERM` on every port) → neither
  `runserver 8110` nor `vite dev` can start here.
- **E3.** Playwright browser download fails (`EPERM` on
  `~/Library/Caches/ms-playwright`).
- Consequence: `npm run e2e` is committed and typechecks but has **not**
  been executed end-to-end in a browser here. The API half of the demo
  script **was** executed for real (contract probe, 23/23 green, see §3).
  Whoever has docker: `migrate + seed_content + seed_demo + demo-night`,
  then `npm run e2e` (defaults: frontend 5191, API 8110; override with
  `E2E_PORT` / `E2E_API_URL` / `E2E_BASE_URL`).
- Note: during this round `localhost:8000` briefly served a skeleton
  backend (only the 8 accounts paths) — another agent's stack, not main.

## 1. Bugs fixed in `agent/qa` (all on the pitch path)

| # | Sev | Screen / file | Problem | Fix |
|---|-----|---------------|---------|-----|
| F1 | P1 | Check-in step 3 · `CheckinPage.tsx` + `checkin/locales/{pl,en}.json` | Symptom and red-flag pills rendered raw API codes (`lack_of_sleep`, `thoughts_of_harm`, …) — no i18n keys existed. Pitch-visible. | Added 12 `sym*`/`flag*` keys (PL+EN), label maps, `t()` rendering with code fallback. New vitest covers it (`renders translated symptom and red-flag labels`). |
| F2 | P1 | Check-in save · `CheckinPage.tsx` `todayISO()` | Date built with `toISOString()` (UTC) → between 00:00–02:00 CEST the check-in is stamped with the wrong local day. Same class of bug as bb599b2 (backend already fixed EPDS to local day). | Local calendar-day construction. |
| F3 | P1 | Check-in step 4 · `CheckinPage.tsx` "save as question" | Fire-and-forget `fetch('/api/v1/visit-questions')` used a path relative to the frontend origin (ignores `VITE_API_URL`) with no JWT → always fails, silently caught. The advertised feature never persisted. | Uses the landed `useAddVisitQuestion()` hook (authenticated client). |

## 2. Ranked bug list for owners (not fixed)

| # | Sev | Owner | Screen | Steps | Expected | Actual |
|---|-----|-------|--------|-------|----------|--------|
| B1 | P2 | onboarding (`features/onboarding`) | Onboarding step 7 | Break `POST /onboarding/complete` (e.g. offline, or 400) → click "Zaczynamy" | Visible error, stay on step | `complete` mutation has no `onError` UI — button just re-enables, user is stuck with no message |
| B2 | P3 | f-care | Tough day, intensity 5 | Pick petal 5 | One navigation to `/help`, session recorded | `navigate('/help')` fires twice (in `onSuccess` AND synchronously after `mutate`); on network error the user still lands on `/help` with no session |
| B3 | P3 | f-care | Tough day → strategies | Open step 3 with no contacts | One message query, none when no contact selected | `AskSupport` calls `useSupportMessage(null)` unconditionally AND `InnerMessage` fires a second query for the same contact |

## 3. Contract probe: 23/23 green on the REAL backend

Scratch: `/tmp/qa_contract_probe.py` (not committed) against sqlite DB
seeded with `seed_content + seed_demo + demo-night`. Mirrors every API
call the E2E makes: register, demo login (Marta exists), onboarding
complete with UI defaults, check-in upsert + `risk` in response,
dashboard `today_checkin`, toolkit → session create (intensity 3) →
session PATCH (`strategy`/`somewhat`/`mood_after`), goal create + log +
`goals/today` flag, `insights?range=30`, `night/now` awake_count ≥ 5
(demo-night's 12 users counted), circle link → care request → public
read (no notes/symptoms leaked) → public claim → attribution,
public helplines (for logged-out `/help`), `/me` language en→pl.
One probe-side mistake, not a bug: `insights?range=90` → 400; valid
ranges are only `7|30` and the UI only sends those.

## 4. E2E suite (committed, not yet run in a browser)

- `frontend/playwright.config.ts` (real API only, `VITE_USE_MOCKS=false`,
  webServer starts `vite dev`, 1 worker — the Marta script mutates shared
  seed state), `frontend/e2e/helpers.ts`, `frontend/e2e/demo.spec.ts`
  (login Marta → check-in 4 steps → /today summary → tough-day 3 →
  breathing → strategy → helped → goals log → patterns → report → night
  toggle (`data-theme`) → /night awake → logged-out public circle → claim
  → logged-out /help → EN switch and back to PL), `frontend/e2e/onboarding.spec.ts`
  (fresh account, unique e-mail, defaults, lands on /today).
- `npm run e2e` script added. `tsconfig.json` now includes `e2e/` +
  `playwright.config.ts`; `vitest.config.ts` excludes `e2e/`.
- Gates observed here: `typecheck` green (incl. e2e), `vitest` 9 files /
  30 tests green (31 with the new translation test — rerun pending,
  shell outage), `vite build` green.

## 5. Screenshots — NOT DONE

`docs/screenshots/` could not be produced: no browser and no servers can
run in this sandbox (E1–E3). The E2E run + screenshot pass must happen on
a machine with docker. Recommended: after `npm run e2e` is green, reuse
its authenticated state to capture 1440/375 × day/night × PL for:
Dzisiaj, Check-in, Gorszy dzień, Wzorce, Krąg (publiczna), Raport, Noc.
