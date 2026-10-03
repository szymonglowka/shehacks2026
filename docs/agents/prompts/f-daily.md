You are already inside your own git worktree on branch agent/f-daily (created from origin/main); .env in this directory holds your COMPOSE_PROJECT_NAME and ports — do not create another worktree.
"Shared names" = section "Wspólne nazwy ustalone z góry" in docs/AGENT_PROMPTS.md — read it. Follow AGENTS.md "Parallel work protocol" strictly.

You are agent `f-daily`. Read AGENTS.md (protocol!), docs/design/SCREENS.md §0, §3.2–3.6, §3.14, §4 (follow them exactly — they override SPEC §4 details),
docs/design/README.md, docs/design/figma-make/App.tsx (Dzisiaj, check-in modal), docs/SPEC.md §6.1–6.4, §6.6, §7.
You own: src/features/{onboarding,today,checkin,calendar,patterns,epds,insights}/**, src/api/{tracking,insights,onboarding}.ts, src/mocks/handlers/{tracking,insights,onboarding}.ts.

BEFORE checkpoint-0: write TS types + TanStack Query hooks for your domains from SPEC §7 and MSW handlers with realistic data for Marta (6 weeks, SPEC §9), plus all
PL+EN copy for your screens (namespaced JSON) in the human tone of SCREENS §0. Do not create package.json/vite config.

AFTER rebasing on checkpoint-0 (use f-core components; if something is missing, build it inside your feature and log a request):
- Onboarding: 7 steps (SCREENS §3.2), big serif step number, petal progress, branching by mode, coping rating as rows with 4-petal scale, POST /onboarding/complete,
  push permission step via usePushSubscription, finale animation.
- Today (/today): faithful to Figma + forecast card, check-in hero turning into day summary, recommendations (TopStrategiesCards from features/support index),
  insight card, right column: TodayGoalsCard (features/goals), EpdsDueCard, WinsJarCard (features/wins), article card. Export ForecastCard, InsightCard, EpdsDueCard.
- Check-in (/checkin modal route): 4 steps per SCREENS §3.4, red-flag section in postpartum with immediate tel: actions, voice dictation button (Web Speech API,
  lang by i18n, hidden if unsupported), "save as visit question" checkbox (POST /visit-questions), success + RiskCard by risk.actions (urgent → /help).
- Calendar (/calendar): Month | Patterns segmented, mood dots, period lines, predicted period dashed, postpartum week strip with 6-week milestone, day drawer/sheet,
  period start/end, "my period returned".
- Patterns (/patterns): editorial report — mood ribbon (Recharts styled: no grid, Y only 1 and 5, sleep bars behind) with HAND-WRITTEN ANNOTATIONS on key points,
  3 findings with big serif numbers, phase wheel (cycle mode), EPDS timeline with threshold bands, strategy effectiveness bars, CTA → /report.
- EPDS (/epds): intro, one question per screen, 10-petal progress, result-first wording, R1 → /help.
Tests for check-in flow and risk handling. Report docs/agents/reports/f-daily.md, push often.
