"""Unit tests for content/picking.py (Django-free)."""

from datetime import date, timedelta
from pathlib import Path
import sys

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))

from picking import ArticleCandidate, pick_article_of_the_day  # noqa: E402

DAY = date(2026, 10, 3)

CANDIDATES = [
    ArticleCandidate("pp-weekly", "postpartum", 1, 12),
    ArticleCandidate("pp-generic", "postpartum"),
    ArticleCandidate("pp-late", "postpartum", 8, 12),
    ArticleCandidate("cycle-only", "cycle"),
    ArticleCandidate("both-weekly", "both", 1, 12),
    ArticleCandidate("both-generic", "both"),
]


def pick(**kwargs):
    args = {"mode": "postpartum", "postpartum_week": 6, "day": DAY}
    args.update(kwargs)
    return pick_article_of_the_day(CANDIDATES, **args)


def test_deterministic_per_day():
    assert pick() == pick()
    assert pick(day=DAY + timedelta(days=1)) == pick(day=DAY + timedelta(days=1))


def test_rotates_across_days():
    # Unknown week: all three mode-specific articles share the winning tier.
    seen = {
        pick(postpartum_week=None, day=DAY + timedelta(days=i))
        for i in range(30)
    }
    assert len(seen) > 1, "expected the pick to rotate, got a fixed slug"


def test_week_covering_tier_always_wins():
    for i in range(30):
        assert pick(day=DAY + timedelta(days=i)) == "pp-weekly"


def test_week_outside_range_falls_to_generic_specific():
    # Week 30: no postpartum range covers it; latest-tier specific wins.
    seen = {
        pick(postpartum_week=30, day=DAY + timedelta(days=i)) for i in range(30)
    }
    assert seen <= {"pp-weekly", "pp-generic", "pp-late"}
    assert "pp-generic" in seen or "pp-late" in seen or "pp-weekly" in seen


def test_cycle_user_never_gets_postpartum_only():
    for i in range(30):
        slug = pick(mode="cycle", postpartum_week=None,
                    day=DAY + timedelta(days=i))
        assert slug in {"cycle-only", "both-weekly", "both-generic"}, slug


def test_unknown_week_prefers_specific_over_both():
    for i in range(30):
        slug = pick(postpartum_week=None, day=DAY + timedelta(days=i))
        assert slug in {"pp-weekly", "pp-generic", "pp-late"}, slug


def test_fallback_to_both_when_mode_has_no_articles():
    only_both = [c for c in CANDIDATES if c.mode == "both"]
    slug = pick_article_of_the_day(only_both, mode="cycle",
                                   postpartum_week=None, day=DAY)
    assert slug in {"both-weekly", "both-generic"}


def test_empty_candidates_returns_none():
    assert pick_article_of_the_day([], mode="postpartum",
                                   postpartum_week=6, day=DAY) is None


def test_invalid_mode_raises():
    with pytest.raises(ValueError):
        pick(mode="nonsense")


def test_picks_from_real_fixtures():
    """The shipped fixture set yields a valid, mode-appropriate slug daily."""
    import json
    from pathlib import Path

    raw = json.loads(
        (Path(__file__).parent / "fixtures" / "articles.json").read_text(
            encoding="utf-8")
    )
    candidates = [
        ArticleCandidate(
            a["fields"]["slug"], a["fields"]["mode"],
            a["fields"]["min_week"], a["fields"]["max_week"],
        )
        for a in raw
    ]
    slugs = {c.slug for c in candidates}
    for i in range(30):
        day = DAY + timedelta(days=i)
        marta = pick_article_of_the_day(
            candidates, mode="postpartum", postpartum_week=6, day=day)
        assert marta in slugs
        kasia = pick_article_of_the_day(
            candidates, mode="cycle", postpartum_week=None, day=day)
        assert kasia in slugs
        assert next(c for c in candidates if c.slug == kasia).mode != \
            "postpartum"
