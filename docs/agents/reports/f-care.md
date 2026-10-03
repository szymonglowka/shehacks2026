# Report f-care — BEFORE checkpoint-0 (frontend care package)

## Done

**API layer** (`frontend/src/api/`): `support.ts`, `circle.ts`, `wins.ts`,
`night.ts` — SPEC §7 types + TanStack Query hooks. Public hooks
(`useHelplines`, `usePublicCircle`, claim/done) send `auth: false`.
Night helpers: `isNightHour()`, per-day dismiss flags for the /today→/night swap.

**MSW handlers** (`frontend/src/mocks/handlers/`): `support.ts` (toolkit ranking
with evidence — rest-no-phone 4/5 on top; sessions with intensity=5 → urgent
risk; contacts incl. Tomek; message with `sms:` + `wa.me` URLs; 3 helplines
with `verify: true`), `circle.ts` (link token `marta-krag-7f3k9`, 4 requests:
1 open ×2, 1 claimed by Tomek, 1 done; public claim/done mutate state,
revoked token → 404), `wins.ts` (9 Marta wins PL+EN, random, add, delete),
`night.ts` (`awake_count: 37`).

**Features** (routes + full PL/EN copy in SCREENS §0 tone + components):
- `support/` — `/support` hub (hard-day card, strategies, circle, wins jar,
  helplines with `tel:`, survey CTA). Exports `TopStrategiesCards`.
- `toughday/` — `/tough-day` modal flow: intensity petals (5 → `/help`),
  `BreathingOrb` (4-7-8 + box, 1-min timer, phase text, reduced-motion
  fallback), top-3 strategies step-by-step + timer, ask-for-support
  (sms/WhatsApp URLs from API), `RandomWinCard`, "did it help?" + mood → PATCH.
- `help/` — PUBLIC `/help`, no decoration, 112 + lines + trusted contact
  when logged in.
- `circle/` — `CircleSection` (mum side, rendered in `/support`: statuses,
  new-request sheet, copy + `navigator.share`, revoke, share_mood toggle)
  + PUBLIC `/c/:token` (claim with name, done, mood colour only, guide link
  to `/knowledge/jak-wspierac-mame`, fallback question logged in requests).
- `wins/` — `WinsJarCard` (12-petal jar + add sheet), `RandomWinCard`.
- `night/` — `/night` (serif clock, awake line hidden when null, 4 big
  56px actions, grounding 5-4-3-2-1, morning note to localStorage) +
  `NightRedirect` for f-daily's `/today`.

**Tests**: `toughday/ToughDay.test.tsx` (intensity POST → breath step,
5 → /help, helped+mood PATCH), `circle/PublicCircle.test.tsx`
(no-auth render, claim flow, invalid token).

## Not run yet

No `frontend/` skeleton on `main` (checkpoint-0 pending) — `vitest`/`tsc`
couldn't run. Tests are written against mocked api modules; will run
`npm test` + `typecheck` right after `git fetch && git rebase origin/main`.

## Contract deviations

None from SPEC §7. Open questions for other agents are in
`docs/agents/requests/f-care.md` (client contract, token class names,
guide-article public safety).

## Next (after rebase on checkpoint-0)

1. Rebase, adopt f-core shared components where they beat local markup.
2. Run tests + typecheck + lint; fix fallout.
3. Verify at 1440/820/375 + `prefers-reduced-motion` + EN language.

## Polish round (2026-10-04, verified vs real backend)

Environment: Docker daemon broken on this machine (Desktop bundle
unusable, no colima/podman), and the sandbox blocks socket binds — so no
`docker compose` and no running servers. Stood up the real backend
in-process instead: project `backend/.venv` (uv), real code + migrations +
`seed_content`/`seed_demo`/`demo_night` on sqlite (no pg-specific code in
the repo), exercised through DRF's test client: **25/25 checks green**
(`/tmp/verify_fcare.py`, throwaway). Fresh scratch user for all writes —
Marta's seed data untouched. Frontend: `typecheck` ✓, `vitest` 31/31 ✓,
`build` ✓, eslint clean on all owned files (remaining repo lint errors are
in other agents' files).

Flow results (real API):
1. Tough day: POST session → PATCH {strategy, helped: "somewhat",
   mood_after} → toolkit order changes; intensity 5 →
   urgent + `show_crisis`. UI: growing petals + selected label, orb (4-7-8/
   box, 1-min, reduced-motion), strategy cards now show "helped X of Y" +
   duration, full ranking with evidence on /support.
2. Ask-for-support: message endpoint returns `sms:` + `wa.me` URLs with a
   gentle PL text (verified).
3. Circle: create request, share link, revoke → 404, re-create works,
   share_mood toggle; public claim → mum Notification
   ("Ola wziął/wzięła: …") verified in DB; done; throttle verified (429
   after ~30/min); public payload leaks no notes (allowlist keys only);
   claim/done return the full payload (adapters fixed); 429 → friendly
   "Chwilę przerwy" page (new test).
4. Wins: POST requires `date` — `useAddWin` now sends it (was 400 before);
   random; night note → visit question (f-plan hook) with offline fallback.
5. Night: quick mood → PUT /checkins/{today} via apiFetch (was raw fetch
   with a wrong token key); grounding 5-4-3-2-1; awake_count 37 on demo.

Bugs fixed from verification: helpline `verify` inversion
(`!is_verified`), 112 duplicated in /help (hero now uses the API
emergency entry), MSW shapes aligned to real payloads (win date, claim/
done payload, evidence object, mood {color,label}).
Open: no browser on this machine — 1440/820/375, night theme, PL/EN
visual pass and real incognito /c/:token click-through NOT done; needs
someone with `docker compose up` + a browser. Backend seed gaps logged in
requests/f-care.md (flat Marta ranking, missing Tomek contact).
