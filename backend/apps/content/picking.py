"""Article-of-the-day picking (SPEC sections 5 and 7, dashboard field).

Rule: match the user's mode plus postpartum week, deterministic per day.

This module is Django-free on purpose: it works on plain values /
dataclasses so it can be unit-tested without a database. After
checkpoint-0, ``selectors.article_of_the_day(user, lang)`` will load
``Article`` rows, map them to :class:`ArticleCandidate` and call
:func:`pick_article_of_the_day`.

Ranking tiers (first non-empty tier wins, hashed order inside the tier):
1. mode-specific articles whose week range covers the user's postpartum week,
2. other mode-specific articles (no range, or range not covering the week),
3. ``both``-mode articles (week-range covering first, then the rest).

Inside one tier the order is a stable SHA-256 hash of
``(day, slug)``: fully deterministic, no stored state, and the pick
rotates day to day. Final tie-break is the slug itself.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class ArticleCandidate:
    """Minimal fields the picking rule needs (mapped from Article)."""

    slug: str
    mode: str  # "postpartum" | "cycle" | "both"
    min_week: int | None = None
    max_week: int | None = None


def _covers(candidate: ArticleCandidate, week: int | None) -> bool:
    return (
        week is not None
        and candidate.min_week is not None
        and candidate.max_week is not None
        and candidate.min_week <= week <= candidate.max_week
    )


def _day_key(day: date, slug: str) -> tuple[str, str]:
    digest = hashlib.sha256(f"{day.isoformat()}|{slug}".encode()).hexdigest()
    return (digest, slug)


def pick_article_of_the_day(
    candidates: list[ArticleCandidate],
    *,
    mode: str,
    postpartum_week: int | None,
    day: date,
) -> str | None:
    """Return the slug of the article of the day, or None when no match.

    ``mode`` is the user's profile mode; ``postpartum_week`` is 1-indexed
    (None outside postpartum mode or when the birth date is unknown).
    """
    if mode not in ("postpartum", "cycle"):
        raise ValueError(f"mode must be postpartum|cycle, got {mode!r}")
    specific = [c for c in candidates if c.mode == mode]
    both = [c for c in candidates if c.mode == "both"]

    tiers: list[list[ArticleCandidate]] = [
        [c for c in specific if _covers(c, postpartum_week)],
        [c for c in specific if not _covers(c, postpartum_week)],
        [c for c in both if _covers(c, postpartum_week)],
        [c for c in both if not _covers(c, postpartum_week)],
    ]
    for tier in tiers:
        if tier:
            return min(tier, key=lambda c: _day_key(day, c.slug)).slug
    return None
