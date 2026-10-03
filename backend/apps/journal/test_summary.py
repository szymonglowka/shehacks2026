"""Tests for journal.summary (pure, no Django needed)."""

from datetime import date, timedelta

try:  # project convention after checkpoint-0 (backend/ on sys.path)
    from apps.journal.summary import (
        CheckInPoint,
        EpdsPoint,
        epds_trend,
        mood_sleep_summary,
        red_flags_seen,
        symptom_frequency,
    )
except ImportError:  # before checkpoint-0: namespace packages from repo root
    from backend.apps.journal.summary import (
        CheckInPoint,
        EpdsPoint,
        epds_trend,
        mood_sleep_summary,
        red_flags_seen,
        symptom_frequency,
    )

DAY = timedelta(days=1)
D0 = date(2026, 9, 1)


def sample_points():
    return [
        CheckInPoint(D0, mood=2, sleep_hours=4.0, symptoms=["headache", "fatigue"]),
        CheckInPoint(D0 + DAY, mood=3, sleep_hours=5.5, symptoms=["fatigue"]),
        CheckInPoint(D0 + 2 * DAY, mood=4, sleep_hours=6.5, symptoms=[]),
        CheckInPoint(
            D0 + 3 * DAY, mood=2, sleep_hours=3.0,
            symptoms=["fatigue"], red_flags=["fever"],
        ),
    ]


def test_symptom_frequency_counts_days_not_occurrences():
    freq = symptom_frequency(sample_points())
    assert freq[0] == {"symptom": "fatigue", "count": 3, "days": 4}
    assert freq[1] == {"symptom": "headache", "count": 1, "days": 4}
    assert symptom_frequency([]) == []


def test_red_flags_only_flagged_days_in_order():
    flags = red_flags_seen(list(reversed(sample_points())))
    assert flags == [{"date": "2026-09-04", "red_flags": ["fever"]}]


def test_mood_sleep_summary_averages():
    summary = mood_sleep_summary(sample_points())
    assert summary == {"days": 4, "avg_mood": 2.75, "avg_sleep_hours": 4.75}


def test_mood_sleep_summary_empty_is_none():
    assert mood_sleep_summary([]) == {"days": 0, "avg_mood": None, "avg_sleep_hours": None}


def test_epds_trend_down_up_flat():
    down = [
        EpdsPoint(D0, total=14, risk_level="high"),
        EpdsPoint(D0 + 14 * DAY, total=8, risk_level="low"),
    ]
    assert epds_trend(down)["delta"] == -6
    assert epds_trend(down)["direction"] == "down"
    assert epds_trend(list(reversed(down)))["direction"] == "down"  # order-proof
    assert epds_trend([EpdsPoint(D0, total=8)])["direction"] == "flat"
    assert epds_trend([]) is None
