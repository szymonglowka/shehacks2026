You are agent `qa` (run it in the integrator's main checkout on a branch `agent/qa`, or in the integrator session),
polish round. First read docs/agents/prompts/polish/_common.md and follow its setup.

1. Add Playwright E2E in frontend/e2e running against the REAL API (seeded DB): the demo script —
   login Marta → /today → check-in (4 steps) → summary on /today → tough day (intensity 3 → breathing →
   strategy → helped) → goals log one → patterns → report → night mode toggle → /night shows the awake count
   (run `make demo-night` in setup) → public circle page logged out → claim → help page logged out →
   language switch EN. Plus onboarding of a fresh account. `npm run e2e` script, headless.
2. Run it, file every failure as a ranked bug list in docs/agents/QA.md (screen, steps, expected, actual,
   owner). Fix trivial ones yourself in your branch; leave the rest to owners.
3. Take clean screenshots for the pitch deck (1440 and 375, day + night, PL) of: Dzisiaj, Check-in, Gorszy dzień,
   Wzorce, Krąg (publiczna strona), Raport na wizytę, Nocna zmiana → docs/screenshots/.
Push agent/qa and report.
