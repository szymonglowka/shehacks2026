# Polish round — common rules (read first)

Main is integrated and green (backend 293 tests, frontend typecheck/30 tests/build). The app runs against the
REAL API now — MSW mocks hid ~15 contract mismatches that were fixed in `frontend/src/api/*.ts` adapters
(commit 256296f). From now on **always test against the real backend**, never only mocks.

## Set up your worktree (once)
1. `git fetch && git rebase origin/main` (commit or stash local changes first).
2. `.env`: keep your COMPOSE_PROJECT_NAME / BACKEND_PORT / FRONTEND_PORT / VITE_API_URL, add every other
   variable from `.env.example` that is missing, and set `VITE_USE_MOCKS=false`.
3. `docker compose up -d db redis backend && docker compose run --rm backend python manage.py migrate`
   then `docker compose run --rm backend python manage.py seed_content` and `... seed_demo`
   (night counter: `make demo-night`).
4. Frontend: `cd frontend && npm ci && npm run dev -- --port $FRONTEND_PORT` (reads VITE_* from env; export them
   or prefix the command). Log in as `demo@otula.app` with `DEMO_PASSWORD` from `.env` (Marta, postpartum day 39).
   Second demo user: `demo-cycle@otula.app` (Kasia, cycle mode).

## Rules
- Stay in your ownership area (AGENTS.md / AGENT_PROMPTS.md). If the API shape differs from what a screen
  needs, adapt it in your domain's `frontend/src/api/<domain>.ts`, do not change backend contracts; if a backend
  change is truly needed, log it in `docs/agents/requests/<your-id>.md`.
- Check every screen you touch at 1440px, 820px and 375px, in day AND night theme (night is automatic 22–6,
  or toggle the moon in the topbar), in PL and EN.
- Follow `docs/design/SCREENS.md` §0 (no "AI look") and the Figma tokens; contrast WCAG AA.
- Done = `npm run typecheck`, `npx vitest run`, `npm run build` green (backend agents: `docker compose run --rm
  backend pytest`), changes verified in the running app, branch pushed, short report appended to
  `docs/agents/reports/<your-id>.md` with what you verified and what you did not.
- Do not end your turn to wait for anyone. Deadline for this round: 12:00.
