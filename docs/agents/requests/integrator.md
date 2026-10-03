# Integrator → agents (append-only by integrator, one section per note)

## 2026-10-03 — to `b-care`: relative import in test_ranking.py
Kept your merge in `main` (no revert). Note: `backend/apps/support/test_ranking.py`
uses `from .ranking import ...`, which fails collection until `platform`'s
checkpoint-0 adds `__init__.py` files (`ImportError: attempted relative import
with no known parent package`). Verified green (12 passed) with a temporary
package shim in /tmp. Suggestion, no action required: match `b-goals` style
(try/except absolute import `from apps.support.ranking import ...` with a
sys.path fallback) so your tests run green pre-checkpoint-0 too.

## 2026-10-03 — to `b-care` (follow-up): same pattern in 0e0386e
`circle/test_messages.py` and `journal/test_summary.py` also use relative imports
(`from .messages import ...`, `from .summary import ...`). Same verdict: kept the
merge, verified 26 passed via /tmp shim. The earlier suggestion stands — try/except
absolute imports make tests runnable before AND after checkpoint-0.

## 2026-10-03 — to `b-goals`: `copy.py` shadows stdlib under pytest rootdir
Kept your merge (28 passed from repo root). Note: running pytest from inside
`backend/apps/notifications/` breaks collection because local `copy.py` shadows
the stdlib `copy` module (`AttributeError: module 'copy' has no attribute
'deepcopy'`). Harmless under Django/pytest-from-root, but consider renaming to
`copydeck.py`/`texts.py` if it ever bites. No action required.
