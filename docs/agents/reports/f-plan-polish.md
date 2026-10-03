# Polish round — f-plan (appended; rebased on integrated main)

## Fixes from real-API verification (backend :8090, seeded demo, `VITE_USE_MOCKS=false`)
- **Goals row** (polish task 1): long titles now `line-clamp-2`; fixed the
  double streak ("11 11 dni" — locale string already contained the count, row
  added it again); single serif streak + reminder pill + `PetalWeek` indicator;
  title tap opens the edit sheet, delete moved into the sheet with confirm
  (row stays compact at 375px).
- **`reminder_time` is `HH:MM:SS`** on the wire: added `shortTime`/`toApiTime`
  helpers in `api/goals.ts` — pill shows `09:00`, `<input type=time>` gets a
  valid value, submit posts back `HH:MM:SS`.
- **Recommended has no `reason` field** in the real API: `templateReason()`
  builds the justification client-side from `min_week` (`reasonFromWeek`) +
  `delivery_types: [cesarean]` (`reasonCesarean`); backend `reason` still wins
  when present. New PL/EN keys added.
- **Profile stage counters**: `/me` profile carries no `postpartum_day/week`
  or `cycle_day` — `useProfile()` now merges `/cycle/status`
  (`days_since_birth`, `postpartum_week`, `cycle_day`) with `/me` fallback.
- **Profile mode switch added** (was missing): postpartum/cycle segmented
  control → `PATCH /me`, with hint copy (PL/EN).
- **Reader markdown**: scanned all 16 article bodies — constructs in the wild
  are `##`, `-` lists, `1.` lists (3×) and `[text](url)` links (64×). Reader
  now renders links as anchors (new tab) and numbered lists; no tables/images.
- **Print**: `print.css` pins day-theme tokens on `.report-sheet` so a night
  session still prints ink-on-white; chrome hidden via `.report-no-print`.
  (Tailwind colors resolve `var(--*)` at use, so scoping works — confirmed in
  `tailwind.config.js`.)
- **Lint**: fixed all 10 errors in owned files (`apiFetch<void>` →
  `apiFetch`, conditional hooks in `GoalSheet`, `let`→`const` in mocks,
  unused `body` destructure). Remaining lint errors are in other agents'
  files (`circle.ts`, `support.ts`, `tracking.ts`, `wins.ts`,
  `mocks/handlers/circle.ts`) — untouched.

## Verified against the real API (throwaway account, then deleted)
- Goals: create daily (long title) + weekly N× with reminder time+weekdays,
  edit, log done → `/goals/today` shows `done_today: true` + normalized
  progress, undo, delete (204s). `POST /goals/{id}/log {completed:false}`
  accepted.
- Profile: `PATCH /me` language + mode switch, `/me/export` keys
  (`data`, `user`), `POST /push/test` → notification appears in
  `/notifications`, `POST /notifications/read-all` marks it, single
  `POST /notifications/1/read` verified on Marta, delete account → login 401.
- Visit questions: add → check done → delete (204).
- Knowledge: 16 articles, category/mode filters, 2 midwife specialists via
  `?specialty=midwife`, helplines localized (PL),_epds/mood shapes in
  `/reports/visit` match the `api/visit.ts` adapter (`mood_sleep` is an
  aggregate — daily series comes from `/insights`, as the adapter does).
- Demo restored afterwards: `seed_demo` re-run, Marta goals all
  `done_today: true`, notifications back to seeded state.
- Gates: `npm run typecheck` clean, `npx vitest run` 9 files / 35 tests
  green, `npm run build` green — BUT those runs predate the last edit batch
  (void→unknown, unconditional hooks, mocks const, reader links/lists,
  print token pinning, profile mode switch, `templateReason` signature).
  Final re-run + commit + push were blocked: every shell spawn fails with
  `EMFILE (Too many open files)` from the sandbox, while file tools keep
  working. The last edits were self-reviewed (types narrow, patterns match
  the green tree) and API-verified where they touch the wire, but the final
  tree still needs one `typecheck + vitest + build` pass and a push once
  shell recovers. Uncommitted files are all inside my owned paths
  (`frontend/src/{api/goals,api/visit,api/notifications,features/goals,
  features/knowledge,features/report,features/profile,features/notifications,
  mocks/handlers/*}`, `docs/agents/{reports/f-plan-polish.md,
  requests/f-plan.md}`).

## NOT verified
- No pixel checks at 1440/820/375, day/night, PL/EN: no headless browser in
  this environment (only vitest binary; no chromium/playwright) and the
  prompt forbids ending the turn to wait. Layout follows the same token
  classes as the rest of the app; row/reader/print changes are
  CSS-scoped and unit-tested where logic is involved.
- Chrome print→PDF eyeballed by nobody — print CSS forces white + day tokens
  + hides `.report-no-print`, but app-chrome selectors outside my components
  were not audited for print.

## BLOCKED: final gates + commit + push not executed
- Every shell spawn (`bash`, incl. bare `echo`) fails with
  `EMFILE (Too many open files)` in the agent sandbox — confirmed from both
  this session and a delegated child session (child: BLOCKED, 4 attempts).
  File tools work; nothing is committed.
- Earlier green runs (typecheck clean, vitest 9 files/35 tests, build ok)
  predate the last edit batch listed under Gates above.
- To finish, run in a real terminal in this worktree (user shell is
  unaffected — the FD exhaustion is agent-sandbox-side):

  ```bash
  cd /Users/szymonglowka/Desktop/GIT/otula-f-plan
  git status --porcelain   # expect only f-plan owned paths (list under Gates)
  cd frontend && npm run typecheck && npx vitest run && npm run build
  cd ..
  git add frontend/src/api/goals.ts frontend/src/api/content.ts \
    frontend/src/api/visit.ts frontend/src/api/notifications.ts \
    frontend/src/mocks/handlers/goals.ts frontend/src/mocks/handlers/content.ts \
    frontend/src/mocks/handlers/visit.ts frontend/src/mocks/handlers/notifications.ts \
    frontend/src/features/goals frontend/src/features/knowledge \
    frontend/src/features/report frontend/src/features/profile \
    frontend/src/features/notifications \
    docs/agents/requests/f-plan.md docs/agents/reports/f-plan-polish.md
  git commit -m "feat(f-plan): polish fixes verified against real API"
  git push origin agent/f-plan
  ```
