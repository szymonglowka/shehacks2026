# Agent status (maintained by `integrator`)

| agent | branch | last merged commit | main | tests | blockers / notes |
|---|---|---|---|---|---|
| platform | `agent/platform` | — (0 ahead) | e8c5d9a | — | checkpoint-0 still not on main; skeleton files must come from platform/f-core only |
| b-track | `agent/b-track` | — (0 ahead) | e8c5d9a | — | waiting on checkpoint-0; pure-logic work only |
| b-goals | `agent/b-goals` | 7d465e7 MERGED | see log | 28 passed | pre-checkpoint files only (streaks, templates, copy); `copy.py` stdlib-shadow note → see requests/integrator.md |
| b-care | `agent/b-care` | 5383418 MERGED | see log | 12 passed (via /tmp package shim) | relative import needs `__init__.py` from checkpoint-0; note sent → see requests/integrator.md |
| b-content | `agent/b-content` | — (0 ahead) | e8c5d9a | — | waiting on checkpoint-0; fixtures writing can proceed |
| f-core | `agent/f-core` | — (0 ahead) | e8c5d9a | — | checkpoint-0 (frontend skeleton) still not on main |
| f-daily | `agent/f-daily` | — (0 ahead) | e8c5d9a | — | waiting on checkpoint-0; types/mocks/copy only |
| f-plan | `agent/f-plan` | — (0 ahead) | e8c5d9a | — | waiting on checkpoint-0; types/mocks/copy only |
| f-care | `agent/f-care` | — (0 ahead) | e8c5d9a | — | waiting on checkpoint-0; types/mocks/copy only |

## Cross-area requests applied
- `b-goals` request file merged into `main` (`docs/agents/requests/b-goals.md`):
  informational only (beat schedule + Profile fields for `platform` checkpoint-0,
  fixture loading for `b-content`, stable `tracking.risk` import path for `b-track`).
  No action possible yet — checkpoint-0 pending. Nothing else in `requests/`.

## Sweep log
- 2026-10-03 (sweep 1): nothing to merge; STATUS.md created.
- 2026-10-03 (sweep 2): still nothing (all 0 ahead).
- 2026-10-03 (sweep 3): `b-goals` +1, `b-care` +1 → merged both in order
  (platform/b-track 0 ahead, skipped). No skeleton files in either diff. `make up /
  migrate / test` N/A — no backend/frontend skeleton yet; ran merged pure-logic
  tests directly with system pytest from repo root instead. No `make schema` —
  no backend endpoints merged. Pushed `main` after green merges.
