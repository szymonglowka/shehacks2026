# Report — f-plan (Cele, Wiedza, Raport, Profil, Powiadomienia)

Checkpoint-0 was NOT on `origin/main` during this work, so per protocol I only
touched owned paths: `src/features/{goals,knowledge,report,profile,
notifications}/**`, `src/api/{goals,content,visit,notifications}.ts`,
`src/mocks/handlers/{goals,content,visit,notifications}.ts`. No skeleton files
created.

## Done
- **API layer** (`src/api/`): types (snake_case, per SPEC §7) + TanStack Query
  hooks for goals (CRUD, log, today, recommended + `validateGoalForm` and
  `reminderSentence` helpers), content (articles, specialists, save-as-question),
  visit (questions CRUD, report), notifications (list, read, read-all, test
  push, VAPID key).
- **MSW handlers**: Marta demo data — 5 goals with streaks/logs, 3 recommended
  templates with reasons, 16 articles (short bodies + Źródła: WHO/NHS/ACOG/
  pacjent.gov.pl, incl. slug `jak-wspierac-mame`), 10 sample specialists
  (`is_sample`), 3 visit questions, 4-week report data, 5 notifications.
- **Copy**: full PL+EN namespaces for all 5 features, human tone per SCREENS §0
  (feminine form, capitalised Ty, no AI phrasing).
- **Goals** (`/goals`): rows with 4-petal weekly indicator + serif streak,
  reminder pill, recommended carousel with reasons + safety notes, new/edit sheet
  (rhythm, reminder time + 7 weekday circles + live sentence preview, validation
  errors), log toggle with petal-closing animation (`prefers-reduced-motion`
  safe). `TodayGoalsCard` exported from `features/goals/index.ts` (checkboxes,
  "1 z 3", progress bar).
- **Knowledge** (`/knowledge`, `/knowledge/:slug`): editorial list with featured
  card for the week, category filters, 680px reader (sources, "save as visit
  question"), specialists with "dane przykładowe" badge + filters, helplines tab
  via `/support/helplines` with static PL/EN fallback.
- **Report** (`/report`): weeks selector (2/4/6), section toggles, A4-like
  preview, hand-drawn SVG mood/sleep + EPDS charts, EPDS table, symptom
  frequency bars, red flags, questions with checkboxes + add, disclaimer,
  `window.print()` + dedicated `@media print` CSS (`print.css`).
- **Profile** (`/profile`): stage, retake-survey + circle links to `/support`,
  language switch (PL/EN via i18n + PATCH /me), mode info, reminders + push
  toggle + send test, night mode auto/off (PATCH /me), export JSON download,
  delete with confirm, logout, medical disclaimer.
- **Notifications** (`/notifications`): grouped Dziś/Wcześniej, unread dot, mark
  read on open, mark-all-read, empty state.
- **Tests**: `goalForm.test.ts` (validation + sentence, 9 cases),
  `ReportPage.test.tsx` (print view renders, `window.print` called).
- Cross-agent needs logged in `docs/agents/requests/f-plan.md`.

## Missing / unverified
- **Not run**: `vitest`, `tsc`, `eslint` — no `package.json`/skeleton yet
  (f-core checkpoint-0 pending). Tests are written to run after
  `git fetch && git rebase origin/main`. JSON locales validated with python.
- Assumes `apiFetch` export name from `src/api/client.ts` (see requests).
- MSW article bodies are short on purpose; full 400–700-word bodies come from
  b-content seed — mocks swap to real API after merge.
- After rebase: re-run tests, check 1440/820/375px + PL/EN, then push.
