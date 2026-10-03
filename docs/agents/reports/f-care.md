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
