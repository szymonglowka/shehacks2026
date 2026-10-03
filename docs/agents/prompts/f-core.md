You are already inside your own git worktree on branch agent/f-core (created from origin/main); .env in this directory holds your COMPOSE_PROJECT_NAME and ports — do not create another worktree.
"Shared names" = section "Wspólne nazwy ustalone z góry" in docs/AGENT_PROMPTS.md — read it. Follow AGENTS.md "Parallel work protocol" strictly.

You are agent `f-core`. Read AGENTS.md (protocol!), docs/design/README.md, docs/design/SCREENS.md §0, §2, §4, docs/design/figma-make/App.tsx + styles.css,
look at docs/design/screens/*.jpg, and docs/SPEC.md §7–8. You own: frontend/** except src/features/<feature>/** of other agents, src/api/<domain>.ts and src/mocks/handlers/<domain>.ts of other domains.

PART A — CHECKPOINT-0 (≤30 min, commit to main "chore(checkpoint-0): frontend skeleton", push):
Vite + React + TS strict, Tailwind (theme mapped to CSS vars in src/styles/tokens.css — exact Figma tokens + night theme under [data-theme="night"] from SCREENS §3.11
+ mood scale SCREENS §4), @fontsource Newsreader + DM Sans, React Router with AUTO-REGISTRATION of `src/features/*/routes.tsx` (import.meta.glob, each exports
`routes: RouteObject[]` with optional `handle: { public?: boolean, modal?: boolean, nav?: ... }`) incl. modal routes over a background location,
i18next with AUTO-REGISTRATION of `src/features/*/locales/{pl,en}.json` as namespace = folder name, TanStack Query provider, MSW (enabled by VITE_USE_MOCKS)
with AUTO-REGISTRATION of `src/mocks/handlers/*.ts`, `@/` alias, ESLint + Prettier + Vitest, npm scripts dev/build/test/typecheck/lint/gen:api.
Create stub folders for every feature (auth, onboarding, today, checkin, calendar, patterns, epds, support, toughday, help, circle, wins, night, goals,
knowledge, report, profile, notifications, insights) with routes.tsx (placeholder page using the shared Placeholder pattern), locales/pl.json + en.json ({}),
index.ts exporting the placeholder widgets listed in "shared names". Dockerfile. Commit + push to main.

PART B — branch agent/f-core:
1. Components (src/components, faithful to Figma, see SCREENS §0 for the anti-AI rules): Button (primary/forest/peach/link/text/icon), Card variants (paper, featured sage,
   lavender, forest hero with petal art), Eyebrow, SerifNumber, StagePill, Pill/TagSelector, Segmented, MoodScale (5 tiles, colors from mood scale, accessible radiogroup),
   Scale (1–5, 0–10), Stepper (+/−), PetalProgress (4-petal fill indicator + N-step petal bar), Modal/Sheet (rise/fade; full-screen sheet ≤620px), Toast, EmptyState,
   Skeleton, Placeholder, Brand logo (petals SVG from App.tsx), paper-grain background (SVG noise 3–4%), line-drawn weather icons (sunny/partly/cloudy/rainy, custom SVG).
2. App shell: sidebar (Dzisiaj, Kalendarz, Wzorce, Cele, Wsparcie, Wiedza + Profil + "Potrzebujesz pomocy?" card → /help), sticky blurred topbar (date, "Gorszy dzień"
   pill → /tough-day, moon toggle for night mode, bell with unread dot → /notifications, avatar → /profile), mobile bottom nav (Dzisiaj, Kalendarz, [+] → /quick-add,
   Cele, Wsparcie), breakpoints 1080/820/620. QuickAdd sheet with 4 actions (check-in, small win, visit question, period started — links to owners' routes).
   useNightMode() (profile.night_mode auto 22–6 local + manual toggle, sets data-theme, 600 ms transition).
3. api/client.ts (base URL from VITE_API_URL, JWT access/refresh with refresh-on-401 and logout, Accept-Language from i18n), api/auth.ts + api/me.ts hooks,
   mocks/handlers/auth.ts + me.ts (demo user Marta per SPEC §9).
4. features/auth: welcome (SCREENS §3.1), login, register (health-data consent checkbox), route guards (no token → /welcome; onboarding_completed=false → /onboarding;
   public routes: /help, /c/:token, /welcome, /login, /register).
5. PWA: manifest (Otula, theme #3f6959, background #f8f5ef, icons from logo), src/sw.ts (push → showNotification, notificationclick → focus/open url),
   api/push.ts usePushSubscription (permission, subscribe with VAPID key from /push/vapid-public-key, POST /push/subscriptions).
Tests: client refresh logic, MoodScale a11y, route auto-registration. Report docs/agents/reports/f-core.md, push often.

CHECKPOINT-0 PUSH: main is checked out in the main repo folder, so from your worktree do: `git fetch origin && git rebase origin/main && git push origin HEAD:main`, then continue on agent/f-core.
