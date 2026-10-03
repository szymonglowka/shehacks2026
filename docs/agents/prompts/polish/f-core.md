You are agent `f-core`, polish round. First read docs/agents/prompts/polish/_common.md and follow its setup.

Tasks (your area: src/components, src/styles, src/app, features/auth):
1. Night theme contrast audit. Known broken: on /today the insight ("Twoje odkrycie") card is light with
   near-invisible text, the check-in hero card has low-contrast text/button, on /help the 112 emergency block text
   is invisible. Fix at the token/component level ([data-theme="night"] tokens, Card variants) so every screen
   passes WCAG AA in night mode; walk ALL routes in night mode and fix what you own, log the rest to owners.
2. Logged-out pages (/welcome, /login, /register, /help, /c/:token) must not show the app sidebar/bottom nav or
   topbar actions meant for logged-in users; give them a minimal public header (logo + "Telefony wsparcia").
   /c/:token for a logged-out partner must look like a standalone page (SCREENS §3.12).
3. Add a top-level React error boundary with a calm fallback ("Coś poszło nie tak. Wróć do Dzisiaj" + link to
   /help), so a single broken screen never shows a blank page during the demo.
4. Quick-add [+] sheet: verify all 4 actions work against the real API (check-in, small win, visit question,
   period started) and land on the right screens.
Push agent/f-core and report.
