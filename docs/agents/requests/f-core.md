# Requests from f-core (polish round — night contrast)

f-core shipped night-safe tokens; please swap these hardcoded values so your
screens pass WCAG AA in night mode. New tokens (both themes verified, ratios in
`docs/agents/reports/f-core.md`):
`var(--on-forest, #fff)` (text on forest bg), `var(--card-sage-bg, #f0f4ef)`,
`var(--card-lav-bg, #f1eff5)`, `var(--danger, #b4533c)`, `var(--warm, #85614f)`,
`var(--peach-ink, #684b3d)`. Tailwind classes also exist: `text-onforest`,
`text-peachink`, `text-danger`, `text-warm`, `bg-clay`, `bg-clay-deep`.

## To f-daily
1. `features/insights/components/InsightCard.tsx:76` — `background: '#f1eff5'`
   is near-white in night mode while text uses `var(--ink)` (light) → invisible.
   Use `background: 'var(--card-lav-bg, #f1eff5)'`. Same for the border if you add one:
   `var(--card-lav-border, #e3dfe9)`.
2. `features/insights/components/ForecastCard.tsx` — check any hardcoded light
   background the same way.
3. `features/calendar/pages/CalendarPage.tsx:177,188,211`,
   `features/patterns/pages/PatternsPage.tsx:144,165`,
   `features/today/pages/TodayPage.tsx:216,244,255`,
   `features/checkin/pages/CheckinPage.tsx:387,420`,
   `features/onboarding/pages/OnboardingPage.tsx:380,403` —
   `background: 'var(--forest, #3f6959)'` with `color: '#fff'`: in night mode forest
   is amber `#e0a46b`, white on amber is ~2:1. Use `color: 'var(--on-forest, #fff)'`
   (near-black in night, ~8:1).
4. `features/epds/components/EpdsDueCard.tsx:34` — `background: '#f1eff5'` →
   `'var(--card-lav-bg, #f1eff5)'` (+ `var(--card-lav-border, #e3dfe9)` for borders).
5. `features/goals/components/RecommendedCarousel.tsx:19` — `bg-[#f1eff5]` →
   `bg-[var(--card-lav-bg)]`.

## To f-care
6. `features/today` is f-daily's, but your `TopStrategiesCards` /
   `SupportPage` / `ToughDayFlow` — same two swaps as above if present
   (`#fff` on forest → `var(--on-forest)`; `#f1eff5` → `var(--card-lav-bg)`).
7. `/help` 112 block is fixed without your change: `bg-clay` now resolves
   (`--clay`: day `#9c5636`, night `#c98b6b`, both AA with your `text-cream`).

## To f-plan
8. Same two swaps wherever `#fff`-on-forest or hardcoded `#f1eff5` /
   `#f0f4ef` appear (I saw candidates in goals, profile, knowledge, report,
   circle files — full list in my report). Sage equivalent:
   `var(--card-sage-bg, #f0f4ef)` / `var(--card-sage-border, #d9e4db)`.
