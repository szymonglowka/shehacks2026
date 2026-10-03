# f-core report

## Done
- **Checkpoint-0 (on main `80ef1c4`)**: Vite + React 18 + TS strict, Tailwind mapped to
  CSS vars (`tokens.css`: exact Figma tokens, `[data-theme="night"]` per SCREENS §3.11,
  mood scale per §4), @fontsource Newsreader + DM Sans, BrowserRouter with
  auto-registration of `features/*/routes.tsx` (`routes: RouteObject[]` + `handle:
  {public, modal}`), modal routes render over a background location
  (`state={{background}}`, direct visits fall back to /today), i18next auto-registration
  of `features/*/locales/{pl,en}.json` (namespace = folder), TanStack Query, MSW
  (`VITE_USE_MOCKS`) auto-registering `mocks/handlers/*.ts`, `@/` alias, ESLint (flat,
  strict) + Prettier + Vitest, scripts dev/build/test/typecheck/lint/gen:api, Dockerfile.
  20 feature folders (19 + `shell`) with placeholder routes, `{}` locales, widget stubs
  from shared names (`TodayGoalsCard`, `WinsJarCard`, `RandomWinCard`,
  `TopStrategiesCards`, `ForecastCard`, `InsightCard`, `EpdsDueCard`).
- **Part B — design system** (`src/components`, Figma-faithful, no AI-look):
  Button (primary/forest/peach/link/text/icon), Card + ForestHeroCard with petal art,
  Eyebrow, SerifNumber, StagePill, Pill/TagSelector (fieldset+legend), Segmented,
  MoodScale (radiogroup, mood colors, labels ≥11px), Scale (1–5/0–10), Stepper,
  PetalProgress/PetalBar/PetalFinale, Modal/Sheet (rise/fade, full-screen ≤620px,
  Escape/backdrop close), Toast, EmptyState, Skeleton, Placeholder, Brand (petals SVG),
  WeatherIcon (sunny/partly/cloudy/rainy line SVG), paper-grain SVG noise in tokens.css,
  `prefers-reduced-motion` respected.
- **Shell** (`src/app/layout.tsx`): sidebar (Dzisiaj, Kalendarz, Wzorce, Cele, Wsparcie,
  Wiedza + Profil + help card → /help), sticky blurred topbar (localized date,
  "Gorszy dzień" pill → /tough-day, moon toggle, bell with unread dot → /notifications,
  avatar → /profile), mobile bottom nav (Dzisiaj, Kalendarz, [+] → /quick-add, Cele,
  Wsparcie), breakpoints 821px/620px (1080px single-column is feature pages' job).
  QuickAdd sheet (`/quick-add` modal): check-in → /checkin, win → /support,
  question → /report, period → /calendar. `useNightMode()` (auto 22–6 + device override,
  sets `data-theme`, 600ms transition).
- **API**: `client.ts` (VITE_API_URL, refresh-on-401 with single-flight, Accept-Language,
  logout), `auth.ts` (login/register/logout hooks), `me.ts` (useMe enabled only with
  token, useUpdateMe), `push.ts` (usePushSubscription: permission → VAPID key →
  subscribe → POST). MSW `auth.ts` + `me.ts` (Marta per SPEC §9, token refresh,
  PATCH /me, export, vapid key, notifications).
- **Auth feature**: /welcome (SCREENS §3.1 + crisis footer), /login, /register
  (health-data consent checkbox, required), guards (no token → /welcome;
  onboarding_completed=false → /onboarding; logged-in on auth pages → /today).
- **PWA**: manifest (Otula, #3f6959/#f8f5ef), `sw.ts` (precache + push →
  showNotification + notificationclick focus/open), `public/mockServiceWorker.js`.
- **Tests** (6 passing): route auto-registration (all 20 contracted paths + public
  flags), client refresh (headers, single-flight refresh, failure clears tokens),
  MoodScale a11y (radiogroup, 5 radios, select → aria-checked).
- `tsc`, `eslint --max-warnings 0`, `vite build` green. Live-serve smoke test not
  possible in this session (network sandbox blocks listening sockets); verify with
  `npm run dev` (VITE_USE_MOCKS=true) on a sandbox-free machine.

## Missing / for owners
- Shell leaves the 1080px one-column and page-level empty/loading/error states to
  feature pages. Unread-dot query in shell is a minimal read-only `useQuery`
  (f-plan owns full notification hooks — reuse or replace).
- QuickAdd "win/question/period" targets assume owner routes exist (/support,
  /report, /calendar) — deep-link sheets (e.g. "add win" directly) need owner support.
- `gen:api` needs a running backend (`make schema` by integrator).
- No `verify`-marked helpline data touched (seed owned by b-care).

## Contract deviations
- None. Modal-over-background implemented with BrowserRouter + `state.background`
  instead of data-router `RouteObject` nesting (auto-registration contract unchanged).
- `src/sw.ts` excluded from `tsc` (no webworker lib in app config); bundled by
  vite-plugin-pwa injectManifest.

## Polish round (2026-10-04)
Setup: rebased on main, `.env` completed from `.env.example` (own ports/project,
`VITE_USE_MOCKS=false`), `docker compose up -d db redis backend` + migrate +
`seed_content` + `seed_demo` green. Real API verified: login 200 as
`demo@otula.app`, `/cycle/status` → postpartum day 39 week 6.

1. **Night contrast** — computed WCAG ratios for every token pair my components
   use (script `/tmp/contrast.py`, kept out of repo). Before: day `muted`
   3.8–4.1 (fail), `bg-clay` class didn't exist at all (emergency block had no
   background in EITHER theme). After: 0 failures. Changes (`styles/tokens.css`,
   `tailwind.config.js`, components, `components.css`):
   - day `--muted` `#718079`→`#5d6f67` (4.9–5.3:1 on cream/paper; deviation from
     Figma hex, required for AA), day `--clay` `#c98b6b`→`#9c5636` (5.1:1 with
     cream text; the old value never rendered since the class didn't exist).
   - New semantic tokens, AA in both themes: `--on-forest` (fff / #1b1a17),
     `--peach-ink` (#684b3d / cream), `--danger` (#b4533c / #d08a70),
     `--warm` (#85614f / amber), `--card-sage-bg/border`, `--card-lav-bg/border`.
     Tailwind: `bg-clay(/-deep)`, `text-onforest/peachink/danger/warm`.
   - Button/Scale/Segmented/bottom-nav [+] use `text-onforest`; Card sage/lavender
     use card tokens; `ForestHeroCard` becomes a calm dark card in night mode
     (amber eyebrow, muted body, amber-tinted petal art); MoodScale selected tile
     turns near-black text in night (only combo passing on all 5 mood colors);
     auth error boxes use `.danger-box`; ToughDay pill uses `text-warm`+`border-line`.
   - /help 112 block fixed with zero owner changes (`bg-clay` now resolves).
   - Owner leftovers logged in `docs/agents/requests/f-core.md` (hardcoded `#fff`
     on forest → `var(--on-forest)`; `#f1eff5` → `var(--card-lav-bg)`), per file/line.
2. **Public layout** — `Shell` renders `PublicShell` (logo + "Telefony wsparcia",
   no sidebar/bottom nav/topbar) when logged out; covers /welcome, /login,
   /register, /help, /c/:token. Test: logged-out render has no `<nav>` and no
   tough-day pill.
3. **Error boundary** — `components/ErrorBoundary.tsx` wired in providers:
   "Coś poszło nie tak." + Back-to-/today + support-lines link (PL/EN). Tested.
4. **QuickAdd vs real API** — all four land correctly: /checkin ← PUT
   `/checkins/{date}` → `{checkin, risk}` 200; win ← POST+DELETE `/wins` (204,
   count back to seed 9); question ← POST+DELETE `/visit-questions` (204);
   period ← `/calendar` (GET `/periods` → `[]` for postpartum Marta; POST not
   fired — it would flip her to cycle mode). One self-inflicted overwrite of
   Marta's today check-in was restored to seed-distribution values via the same
   endpoint. Routes /checkin, /support, /report, /calendar all registered.

Gates: `tsc` ✓, `vitest` 33/33 ✓, `vite build` ✓ (night CSS confirmed in bundle),
owned-files eslint ✓ (repo-wide eslint still fails on other agents' files:
`no-invalid-void-type` in api/{circle,goals,notifications,support,tracking,visit,wins}.ts,
unused vars in mocks/handlers/{circle,content,goals,notifications}.ts + GoalSheet —
not mine, not touched).

NOT verified: real browser rendering (no usable browser in this sandbox — Chrome
aborts on launch; no listening sockets allowed, so the app was served from an
nginx container on :8002 for nothing). The 1440/820/375 × day/night × PL/EN walk
was replaced by computed contrast + jsdom tests + API checks. Please eyeball
/today, /help and /c/:token in night mode before the demo.
