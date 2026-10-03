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
