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
