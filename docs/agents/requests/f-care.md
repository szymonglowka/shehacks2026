# Requests from f-care (frontend: support / tough-day / help / circle / wins / night)

## To f-core (skeleton + design system)

1. **`src/api/client.ts` contract** — my hooks import `{ apiFetch }` from `./client`.
   Expected: `apiFetch<T>(path: string, opts?: { method?: string; body?: unknown; auth?: boolean }) => Promise<T>`,
   base URL from `VITE_API_URL`, JWT access from storage + refresh-on-401,
   `Accept-Language` from i18n, throws `{ status }` on HTTP errors
   (I rely on `status === 404` for empty wins-random and missing circle link).
   `auth: false` = send no token (public `/help` data, `/c/:token` page).
2. **Auto-registration** must pick up: `features/*/routes.tsx` (`routes: RouteObject[]`
   + `handle: { public?, modal?, nav? }`), `features/*/locales/{pl,en}.json`
   (namespace = folder name), `mocks/handlers/*.ts` (each file exports
   `*Handlers` arrays — please spread all exports, not just default).
3. **Tailwind token classes I use** (map to CSS vars per SCREENS):
   `bg-cream text-ink bg-paper bg-forest text-cream text-forest bg-sage bg-lavender
   bg-clay bg-night text-night-ink bg-night-card bg-amber text-amber font-serif`.
   If any token name differs in your theme, tell me and I'll rename.
4. **Night theme**: `[data-theme="night"]` + `useNightMode()` (auto 22–6).
   My `NightRedirect` (exported from `features/night`) is for f-daily's `/today`:
   render it with `nightThemeActive` when the night theme is on.
5. **Modal routes**: `/tough-day` has `handle: { modal: true }` — render over
   the background location; full-screen sheet on mobile.
6. **Public routes** (no token → no redirect to /welcome): `/help`, `/c/:token`,
   `/welcome`, `/login`, `/register`.

## To f-daily

- Please render `TopStrategiesCards` (from `features/support`) in the
  "Na dzisiejszy dzień" section and `WinsJarCard` (from `features/wins`)
  in the right column of `/today`, and mount `<NightRedirect
  nightThemeActive={...} />` on `/today` for the automatic night swap.
- The night quick check-in does `PUT /checkins/{today}` with `{ mood }` —
  please keep that upsert shape on the backend (b-track).

## Cross-domain hook reuse (f-plan)

- `features/night/NightPage.tsx` imports `useAddVisitQuestion` from
  `src/api/visit.ts` so a night thought lands in the visit report (K3),
  with a localStorage offline fallback. No changes to your module.

## Note for b-content (seed_demo, Marta)

- Marta's 6 support sessions have `strategy=NULL` and she has 0 coping
  prefs, so her toolkit ranking is flat 0.0 with no evidence (SPEC §9 says
  the ranking should have shifted). Please link sessions to strategies and
  add prefs in seed_demo. Locally I verified the reorder flow on a scratch
  user instead (25/25 green).
- Marta has no trusted contact in seed_demo (you're adding "Tomek" —
  still missing on current main). I added Tomek for her only in my local
  scratch DB, not in the repo.

## To f-plan / b-content (partner guide link)

- The public circle page links to `/knowledge/jak-wspierac-mame`.
  If that article route cannot be public-safe, tell me — fallback is linking
  to `/help`. No action taken on my side until I hear back.

## To b-care (contract confirmation)

My TS types + MSW handlers assume SPEC §7 shapes:
- `GET /support/toolkit` → `{ strategies: [{ code, title, description, category,
  duration_minutes, steps, icon, score, helped_count, total_count }] }`
  (titles/steps localized server-side via Accept-Language).
- `POST /support/sessions` → `{ session, risk }` (risk non-null when
  intensity=5); `PATCH /support/sessions/{id}` accepts
  `{ strategy, helped: yes|partly|no, mood_after }`.
- `GET /support/contacts/{id}/message` → `{ text, sms_url, whatsapp_url }`.
- `GET /support/helplines` (public) → `[{ code, label, number, number_href, hours, verify }]`.
- Circle: `GET/POST/PATCH/DELETE /circle/link` → `{ token, url, share_mood }`;
  `GET /circle/public/{token}` → `{ mom_name, mood_color?, mood_word?, requests }`;
  claim `{ name }`, done `POST`. Public = AllowAny + throttle, revoked → 404.
- `CRUD /wins` + `GET /wins/random` (404 when empty) → `{ id, text, created_at }`.
- `GET /night/now` → `{ awake_count: int|null }` (null when < 5).
