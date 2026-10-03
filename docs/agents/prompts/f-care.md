You are already inside your own git worktree on branch agent/f-care (created from origin/main); .env in this directory holds your COMPOSE_PROJECT_NAME and ports — do not create another worktree.
"Shared names" = section "Wspólne nazwy ustalone z góry" in docs/AGENT_PROMPTS.md — read it. Follow AGENTS.md "Parallel work protocol" strictly.

You are agent `f-care`. Read AGENTS.md (protocol!), docs/design/SCREENS.md §0, §1, §3.8–3.12, §3.3 (wins card), §4 (follow exactly), docs/design/figma-make/App.tsx
(HardDayModal), docs/SPEC.md §6.2, §6.7, §6.8, §7. You own: src/features/{support,toughday,help,circle,wins,night}/**, src/api/{support,circle,wins,night}.ts,
src/mocks/handlers/{support,circle,wins,night}.ts.

BEFORE checkpoint-0: types + hooks + MSW handlers for your domains (realistic Marta data: toolkit ranking with evidence, circle with 4 requests, 9 wins, awake_count 37),
all PL+EN copy in the human tone of SCREENS §0.

AFTER rebasing on checkpoint-0:
- Support hub (/support) per SCREENS §3.8. Export TopStrategiesCards (2 best strategies with "helped X of Y" evidence).
- Tough day (/tough-day modal route) per SCREENS §3.9: intensity petals (5 → /help), breathing orb faithful to Figma (4-7-8 and box, 1-min timer, phase text,
  reduced-motion fallback), top 3 strategies with step-by-step + timer, ask for support (sms/WhatsApp URL from API), RandomWinCard, "did it help?" + mood after → PATCH.
- Help (/help, PUBLIC, no auth, no decoration) per SCREENS §3.10, tel: links, trusted contact when logged in.
- Circle: mum side inside /support (requests list with statuses, new request sheet, share link: copy + navigator.share, revoke, share_mood toggle) and the PUBLIC
  page /c/:token per SCREENS §3.12 (claim with name, done, partner guide link /knowledge/jak-wspierac-mame — make that article route public-safe or link to help).
- Wins: WinsJarCard (jar fills with petals, add sheet), RandomWinCard, export both.
- Night shift (/night + automatic home swap when night theme active on /today → redirect to /night unless user dismissed tonight): SCREENS §3.11, time in serif,
  "X mam też teraz nie śpi" (hidden when null), 4 big actions (quick 1-tap mood check-in via PUT /checkins/{today}, breathe, can't sleep 5-4-3-2-1, note for morning).
Tests: tough-day flow, public circle page without auth. Report docs/agents/reports/f-care.md, push often.
