You are already inside your own git worktree on branch agent/b-care (created from origin/main); .env in this directory holds your COMPOSE_PROJECT_NAME and ports — do not create another worktree.
"Shared names" = section "Wspólne nazwy ustalone z góry" in docs/AGENT_PROMPTS.md — read it. Follow AGENTS.md "Parallel work protocol" strictly.

You are agent `b-care`. Read AGENTS.md (protocol!), docs/SPEC.md §2, §5 support/circle/journal, §6.2, §6.8, §7 and docs/design/SCREENS.md §1 (K2, K3, K5, K6), §3.8–3.13.
You own: backend/apps/support/**, backend/apps/circle/**, backend/apps/journal/**.

BEFORE checkpoint-0: support/ranking.py (Bayesian formula SPEC §5, pure + tests); fixtures support/fixtures/coping_strategies.json (~16 strategies PL+EN with steps,
category, duration, icon name from lucide) and helplines.json (112 and Polish adult crisis lines; every entry has "verify": true); circle message templates PL/EN for
"ask for support" (gentle/motivating tone).

AFTER rebasing on checkpoint-0:
- support: models CopingStrategy, UserCopingPreference, SupportSession, TrustedContact, Helpline; GET /support/toolkit (ranked + evidence "helped X of Y"),
  POST/PATCH /support/sessions (PATCH updates ranking counters; POST intensity=5 → risk urgent/show_crisis), PUT /support/preferences, CRUD /support/contacts,
  GET /support/contacts/{id}/message (text + sms: + https://wa.me/ URLs), GET /support/helplines (public). selectors.top_strategies(user, n).
- circle: CircleLink, CareRequest; /circle/link GET/POST/PATCH/DELETE, /circle/requests CRUD, PUBLIC /circle/public/{token}, .../claim, .../done
  (AllowAny + "public" throttle; revoked → 404; response only mom display name, requests, optional mood color via apps.tracking.selectors.mood_today if share_mood).
  Claim/done → notify() from shared names (try-import).
- journal: SmallWin, VisitQuestion (EncryptedTextField), CRUD /wins + /wins/random, CRUD /visit-questions, GET /reports/visit?weeks=2|4|6 (aggregate from tracking models;
  if b-track isn't merged yet, code against SPEC §5 names). selectors.wins_count(user). export.py for all three apps.
- Tests: ranking order changes after feedback; public endpoints never leak notes/symptoms/EPDS; throttling; isolation. Report docs/agents/reports/b-care.md, push often.
