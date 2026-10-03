You are agent `f-daily`, polish round. First read docs/agents/prompts/polish/_common.md and follow its setup.

Your screens were only verified for READING data. Verify and fix every WRITE flow against the real API:
1. Check-in (/checkin): all 4 steps, save → PUT /checkins/{date}; RiskCard for each risk level (test with a
   red flag in postpartum → urgent → tel: actions / /help); editing today's check-in; voice dictation button hidden
   when unsupported; "save as visit question" creates a VisitQuestion. After save, /today hero turns into the day
   summary and caches refresh (invalidate dashboard, insights, calendar).
2. EPDS (/epds): full 10 questions → POST /epds → result screen per level; answering q10 > 0 → /help.
3. Onboarding: register a brand-new account and go through all 7 steps → POST /onboarding/complete → /today with
   chosen goals and coping scores; test both postpartum and cycle paths, PL and EN.
4. Calendar: period start/end and "my period returned" (POST /profile/period-returned switches mode; check
   /today and /calendar for Kasia-style cycle view afterwards).
5. Today: forecast card copy, EPDS-due card only when due, cycle-mode version of the stage pill (log in as
   demo-cycle@otula.app).
Add/adjust vitest tests for anything you fix. Push agent/f-daily and report.
