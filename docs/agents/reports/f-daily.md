# Report: f-daily (onboarding, Today, check-in, calendar, patterns, EPDS)

## Status: pre-checkpoint-0 slice complete (no skeleton on main yet)

`git log origin/main` shows no `checkpoint-0` commits, so per protocol I did NOT
create skeleton files (no package.json / vite config / client.ts). Everything below
lives strictly in my owned paths and compiles against the announced contracts.

## Done
- `src/api/tracking.ts` — CheckIn/Risk/CycleStatus/Period/EPDS types + TanStack
  Query hooks (checkins, upsert → `{checkin, risk}`, cycle status, periods CRUD,
  period-returned, EPDS questions/history/submit/due) + `riskActionTarget()`.
- `src/api/insights.ts` — forecast/insight/dashboard types + hooks.
- `src/api/onboarding.ts` — options/complete types + hooks (SPEC §7 shapes).
- `src/mocks/handlers/{tracking,insights,onboarding}.ts` — MSW handlers, Marta
  story: postpartum day 39, C-section, dip weeks 2–3, recovery after walks+sleep,
  EPDS 14→11→8, hand-written notes on landmark days; `/dashboard`, `/insights`,
  `/forecast/tomorrow`, EPDS PL/EN wordings with the Cox et al. (1987) citation.
- Copy: `src/features/{onboarding,today,checkin,calendar,patterns,epds,insights}/locales/{pl,en}.json`
  — human tone per SCREENS §0, feminine “Ty”, no AI-slope.
- Screens (self-contained, CSS vars, lucide strokeWidth 1.8, ≥44px targets):
  - Onboarding: 7 steps, serif step number, 7-petal progress, mode branching,
    coping rows with 4-petal scale + counter, worsening pills, circle, goals +
    tone + reminder + push step, POST /onboarding/complete, petal finale → /today.
  - Today: greeting, stage pill, check-in hero → day summary, ForecastCard,
    2 recommendations w/ evidence line, InsightCard, right column (goals fallback,
    EpdsDueCard, wins fallback, article). Re-exports ForecastCard/InsightCard/EpdsDueCard.
  - Check-in (`/checkin`, `handle.modal`): 4 steps, mood radiogroup w/ SCREENS §4
    colors, red-flag section → immediate `tel:112` alert, Web Speech dictation
    (hidden if unsupported), save-as-visit-question, success + RiskCard
    (urgent → /help; EPDS q10 urgent navigates straight to /help).
  - Calendar: Month|Patterns segmented, mood dots (shared MOOD_COLORS),
    period lines, postpartum 1–12 week strip + 6-week milestone, day sheet,
    period start/end, “period returned” confirm → mode switch.
  - Patterns: 7/30 toggle, Recharts ribbon (no grid, Y only 1+5, sleep bars),
    hand-written annotations, 3 serif-number findings, EPDS timeline with
    lavender/clay threshold bands + ≥13 note, strategy bars, CTA → /report.
  - EPDS: intro (screening-not-diagnosis), one question/screen, 10-petal progress,
    result-first wording, R1/high → /help + specialists, EpdsDueCard exported.
- Tests: `risk.test.ts` (action→route mapping) + `checkin.test.tsx` (4-step flow,
  red-flag `tel:112` alert, mood gate). **Not run**: no package.json/vitest until
  f-core checkpoint-0 lands — will run `npm test` + typecheck right after rebase.

## Missing / after rebase on checkpoint-0
- Rebase, adopt f-core components/client/i18n-auto-registration, swap the three
  neighbor-card fallbacks for real widgets (see requests/f-daily.md).
- Run `npm run typecheck`, `npm test`, and MSW dev (`VITE_USE_MOCKS=true`).
- Push branch after rebase + green run.

## Contract deviations
- None from SPEC §7. One addition: `handle: { modal: true }` on `/checkin`
  (per AGENT_PROMPTS modal-routes convention).

---

## Polish round (2026-10-04, against the REAL API)

Setup: rebased on main (integrated, green); `.env` completed from
`.env.example`, `VITE_USE_MOCKS=false`; `docker compose up -d --build db redis
backend` on ports 8060/5174; `seed_content` + `seed_demo` green. Note: this
machine's Docker Desktop app is broken and the default sandbox blocks all
sockets, so every docker/curl/npm command ran with `require_escalated`.

### Verified write flows (real backend, curl + python)
- Auth + register; `PUT /checkins/{date}` incl. red flag `fever` → risk
  `urgent`, reasons `[R2, R8]`, actions include `contact_doctor_now` /
  `show_emergency` (RiskCard covers both → /help + `tel:112`).
- `POST /epds` with q10=1 → `urgent` + `show_crisis` (EpdsPage navigates to
  /help immediately, no result screen).
- `POST /visit-questions` → `{id, text, done:false}` (check-in checkbox now
  uses f-plan's `useAddVisitQuestion`, not raw fetch).
- Register → `GET /onboarding/options` → `POST /onboarding/complete` for BOTH
  modes → dashboard shows correct status (postpartum day 39 / cycle) + 2 goals.
  Response is `{user: {...}}`, not `{ok}` — type fixed.
- `POST /profile/period-returned` on a throwaway cycle account → cycle day 1,
  menstrual, `next_period_date` set; dashboard status follows.
- Kasia (cycle): status `{cycle_day:6, phase:menstrual, next:2026-10-27,
  confidence:high}` — Today now renders the cycle stage pill (phase ring +
  “okres za ~N dni”); fresh cycle profiles with null day/phase render safely.

### Real-vs-mock mismatches found and fixed (all in my files)
- `GET /checkins/{date}` → **404**, not null → new `fetchCheckin()` maps 404→
  null; check-in modal now **prefills today's existing check-in** (edit mode)
  via `draftFromCheckin()`.
- EPDS questions use **`number`**, not `index` → type + MSW handler fixed.
- Fresh cycle/postpartum statuses contain **nulls** → CycleStatus nulled,
  Today/Calendar guard them.
- Check-in save now also invalidates `['insights']`; period mutations +
  period-returned also invalidate `['dashboard']` (mode switch reaches /today).
- Onboarding push step now uses f-core's `usePushSubscription` (local
  `usePushOptIn` removed); goals preselect the first 3 real template ids from
  the API instead of hardcoded `[1,3]`.
- MSW tracking handler: missing check-in → 404, questions → `{number}`.

### Gates (all green)
- `npm run typecheck` clean; `npx vitest run` **39/39 pass (11 files)**;
  `npm run build` ok (PWA precache 25 entries); eslint on all owned files clean
  (fixed `apiDelete<void>` invalid-void-type).
- New tests: `fetch-checkin.test.ts` (404→null, 500 rethrows, data),
  `draft.test.ts` (`draftFromCheckin` mapping/defaults/null + `daysUntil`),
  mic-button-hidden test in `checkin.test.tsx`.
- Dev server smoke: `npm run dev -- --port 5174` serves HTTP 200 with
  `VITE_USE_MOCKS=false`; backend `/api/v1/health/` route exists
  (earlier empty curl was the missing trailing slash).

### Cleanup
- All probe artifacts removed: 4 throwaway `test*` accounts deleted,
  `seed_demo` re-run → Marta pristine (42 checkins, 3 EPDS, 3 visit questions,
  today checkin mood 4, no red flags; 14 users total).

### Not verified
- Clicking through screens in a real browser at 1440/820/375, day+night, PL+EN
  (no browser tooling in this environment — flows verified at the API level
  plus unit/component tests). Visual responsive check is integrator/QA turf.
