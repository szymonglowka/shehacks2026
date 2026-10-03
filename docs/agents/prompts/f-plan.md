You are already inside your own git worktree on branch agent/f-plan (created from origin/main); .env in this directory holds your COMPOSE_PROJECT_NAME and ports — do not create another worktree.
"Shared names" = section "Wspólne nazwy ustalone z góry" in docs/AGENT_PROMPTS.md — read it. Follow AGENTS.md "Parallel work protocol" strictly.

You are agent `f-plan`. Read AGENTS.md (protocol!), docs/design/SCREENS.md §0, §3.7, §3.13, §3.15–3.17 (follow exactly), docs/design/README.md, docs/SPEC.md §6.5, §7.
You own: src/features/{goals,knowledge,report,profile,notifications}/**, src/api/{goals,content,visit,notifications}.ts, src/mocks/handlers/{goals,content,visit,notifications}.ts.

BEFORE checkpoint-0: types + hooks + MSW handlers (Marta's 5 goals with logs, 16 articles with short bodies, 10 sample specialists, 3 visit questions, report data,
notifications), all PL+EN copy in the human tone of SCREENS §0.

AFTER rebasing on checkpoint-0:
- Goals (/goals) per SCREENS §3.7: rows with 4-petal weekly indicator and serif streak, recommended carousel with reasons, new/edit goal sheet with rhythm,
  reminder time + 7 weekday circles and live sentence preview, log done with petal-closing animation. Export TodayGoalsCard (Figma "Dzisiaj" card: checkboxes,
  "1 z 3", progress bar).
- Knowledge (/knowledge, /knowledge/:slug) per SCREENS §3.15: editorial list, featured article for the user's week, filters, reader (680px column, sources,
  "save as visit question"), specialists with "dane przykładowe" badge, helplines tab (reuse data from /support/helplines).
- Visit report (/report) per SCREENS §3.13: weeks selector, section toggles, A4-like preview, charts, EPDS table, symptoms frequency, red flags, questions with
  checkboxes + add, disclaimer, print via window.print() with dedicated @media print CSS (looks great as PDF).
- Profile (/profile) per SCREENS §3.16 incl. language switch, mode switch, retake coping survey link, circle link (to /support), reminders + push toggle + "send test",
  night mode auto/off, export JSON download, delete account confirm, logout, medical disclaimer.
- Notifications (/notifications) sheet/page per SCREENS §3.17, mark read, actions.
Tests: goal form validation, report print view renders. Report docs/agents/reports/f-plan.md, push often.
