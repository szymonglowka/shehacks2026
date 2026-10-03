You are already inside your own git worktree on branch agent/b-content (created from origin/main); .env in this directory holds your COMPOSE_PROJECT_NAME and ports — do not create another worktree.
"Shared names" = section "Wspólne nazwy ustalone z góry" in docs/AGENT_PROMPTS.md — read it. Follow AGENTS.md "Parallel work protocol" strictly.

You are agent `b-content`. Read AGENTS.md (protocol!), docs/SPEC.md §2, §5 content, §9 and docs/design/SCREENS.md §0 (copy tone!), §3.15.
You own: backend/apps/content/** (incl. management commands seed_content and seed_demo), backend/fixtures/**.

BEFORE checkpoint-0 (most of your work — writing): content/fixtures/articles.json with 16 articles PL+EN (markdown body 400–700 words, warm, concrete, non-diagnostic,
human tone from SCREENS §0 — no generic AI phrasing; each ends with "Źródła/Sources" linking WHO, NHS, ACOG, pacjent.gov.pl or similar): baby blues vs postpartum
depression, sleep with a newborn, pelvic floor basics, recovery after C-section, diastasis recti, breastfeeding & mood, return of periods after birth, mood across
the cycle, PMS/PMDD, how to ask for help, guide for partners (linked from the public circle page — slug `jak-wspierac-mame`), gentle movement, postpartum nutrition,
anxiety grounding 5-4-3-2-1, intrusive thoughts, self-compassion. Fields per SPEC §5 (category, mode, week range, reading_minutes, cover image filename).
specialists.json: 10 clearly fictional sample entries (is_sample=true).

AFTER rebasing on checkpoint-0:
- Models Article, Specialist + migrations; GET /articles (filters, paginated, localized), /articles/{slug}, /specialists (filters); selectors.article_of_the_day(user, lang)
  (match mode + postpartum week, deterministic per day).
- seed_content: idempotent, loads fixtures of ALL apps that exist (content, support, goals) via loaddata/update_or_create.
- seed_demo (deterministic random seed, password from env DEMO_PASSWORD) exactly per SPEC §9: Marta (postpartum day 39, C-section, breastfeeding) with 6 weeks of
  realistic check-ins (dip in weeks 2–3, recovery after walks + sleep), EPDS 14→11→8, 5 goals with logs, 6 support sessions shifting the ranking, circle link with
  4 requests (1 claimed by "Tomek", 1 done), 9 small wins, 3 visit questions; second user Kasia in cycle mode with 4 cycles; 12 background users with night last_seen_at.
  Models of other apps may not be merged yet — write it against SPEC §5 names, guard each block with apps.is_installed/try-import, finish after integrator merges.
- Tests: seed commands run twice without duplicates. Report docs/agents/reports/b-content.md, push often.
