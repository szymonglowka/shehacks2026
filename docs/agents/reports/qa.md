# Report: agent/qa (polish round)

## Delivered (branch `agent/qa`, NOT pushed — shell died, see below)

- **Playwright E2E** (`frontend/e2e/`, `frontend/playwright.config.ts`,
  `npm run e2e`): Marta demo script (login → 4-step check-in → /today
  summary → tough-day 3 → breathing → strategy → helped → goals log →
  patterns → report → night toggle → /night awake → logged-out public
  circle → claim → logged-out /help → EN→PL) + fresh-account onboarding.
  Real API only (`VITE_USE_MOCKS=false`), 1 worker (shared seed state).
  Also: `tsconfig.json` includes e2e, `vitest.config.ts` excludes e2e.
- **Bug list**: `docs/agents/QA.md` (ranked, with owner + steps).
- **Fixed in-branch** (pitch-path, trivial): raw symptom/red-flag codes →
  translated (F1, +vitest), UTC check-in date → local day (F2),
  dead save-as-question POST → `useAddVisitQuestion` (F3).
- **Left to owners**: B1 onboarding silent failure (P2), B2 double
  navigate on intensity 5 (P3, f-care), B3 duplicate support-message
  queries (P3, f-care).

## What I verified

- Real backend contract: 23/23 green via Django test client against
  sqlite DB seeded with `seed_content + seed_demo + demo-night`
  (register, Marta login, onboarding, check-in+risk, dashboard, toolkit,
  session create/PATCH, goals log, insights 7/30, night awake_count≥5,
  circle link/request/public/claim, public helplines, language switch).
  Scratch script kept at `/tmp/qa_contract_probe.py` (not committed).
- `npm run typecheck` green incl. e2e; `vitest` 9 files/30 tests green;
  `vite build` green. (The new translation test came after the last
  vitest run — rerun needed.)
- New keys present in both `pl.json` and `en.json`; no hardcoded UI copy
  in the fix (uses `t()`).

## What I did NOT verify (blocked, not skipped)

- `npm run e2e` in a real browser: this sandbox denies docker, denies
  `bind()` (no runserver/vite), and blocks the Playwright browser
  download. Run on a docker machine: seed, then `npm run e2e`.
- Pitch screenshots (`docs/screenshots/`): same blocker.
- Final `typecheck/vitest` rerun after the last edits + `git push`:
  shell hit persistent EMFILE ("Too many open files") for all commands.
  Next step on a healthy shell: `npm run typecheck && npx vitest run &&
  npm run build && git push -u origin agent/qa`.

## Notes for integrator

- Local `.venv-qa/` (gitignored) + `/tmp/otula-qa.sqlite3` (seeded) left
  in place for whoever reruns; `.gitignore` gained `.venv-qa/`.
- `frontend/package.json`/`package-lock.json`: added
  `@playwright/test@^1.63.0` + `e2e` script — keep.
- The CheckinPage fixes touch f-daily files; diffs are tiny
  (labels, date fn, one hook) — safe to keep or revert per owner.
