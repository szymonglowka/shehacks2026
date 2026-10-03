You are agent `f-plan`, polish round. First read docs/agents/prompts/polish/_common.md and follow its setup.

1. Goals (/goals): long titles wrap badly at 375px and the streak number is rendered twice — fix the row layout
   per SCREENS §3.7 (title max 2 lines with ellipsis, single serif streak, petal week indicator next to it).
   Note: API progress_this_week is {done,target,remaining}; api/goals.ts normalizes it to boolean[] — keep that.
   Verify WRITE flows: create goal (daily + N per week, reminder time + weekdays), edit, delete, log done/undo
   (petal-closing animation), add from "Polecane"; TodayGoalsCard on /today updates after logging.
2. Knowledge: article reader for every article (markdown, sources), filters, specialists filters + "dane
   przykładowe" badge, helplines tab, "save as visit question" from the reader.
3. Visit report (/report): adapter in api/visit.ts builds mood_sleep_series from /insights — verify charts,
   EPDS table, symptoms, red flags, questions add/check; print preview (Chrome print → PDF) looks like a clean A4
   document, no app chrome, no night theme in print.
4. Profile: language switch PL/EN persists (PATCH /me), mode switch, export JSON downloads, "Wyślij testowe"
   push (POST /push/test) creates a notification visible in /notifications, delete account flow (test on a
   throwaway account!), logout.
5. Notifications: mark read / read-all, unread dot in topbar updates.
Push agent/f-plan and report.
