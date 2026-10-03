"""Pure aggregation helpers for the visit report (SPEC W10, K3).

Django-free: the future ``GET /reports/visit`` view will map
``DailyCheckIn`` / ``EPDSAssessment`` querysets (SPEC section 5 names) onto
the dataclasses below and call these helpers. Field names mirror SPEC so
the view is a thin translation layer::

    CheckInPoint(date=ci.date, mood=ci.mood, sleep_hours=float(ci.sleep_hours or 0),
                 symptoms=list(ci.symptoms), red_flags=list(ci.red_flags))
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date


@dataclass
class CheckInPoint:
    date: date
    mood: int | None = None
    sleep_hours: float | None = None
    symptoms: list[str] = field(default_factory=list)
    red_flags: list[str] = field(default_factory=list)


@dataclass
class EpdsPoint:
    date: date
    total: int = 0
    risk_level: str = "low"


def symptom_frequency(points: list[CheckInPoint]) -> list[dict]:
    """Symptom counts, most frequent first: [{symptom, count, days}]."""
    counts: dict[str, int] = {}
    for p in points:
        for symptom in set(p.symptoms or []):
            counts[symptom] = counts.get(symptom, 0) + 1
    days = len({p.date for p in points})
    return [
        {"symptom": symptom, "count": count, "days": days}
        for symptom, count in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    ]


def red_flags_seen(points: list[CheckInPoint]) -> list[dict]:
    """Every day with red flags: [{date, red_flags}]."""
    return [
        {"date": p.date.isoformat(), "red_flags": list(p.red_flags)}
        for p in sorted(points, key=lambda p: p.date)
        if p.red_flags
    ]


def mood_sleep_summary(points: list[CheckInPoint]) -> dict:
    """Averages over days that have data (None when no data at all)."""
    moods = [p.mood for p in points if p.mood is not None]
    sleeps = [p.sleep_hours for p in points if p.sleep_hours is not None]
    return {
        "days": len({p.date for p in points}),
        "avg_mood": round(sum(moods) / len(moods), 2) if moods else None,
        "avg_sleep_hours": round(sum(sleeps) / len(sleeps), 2) if sleeps else None,
    }


def epds_trend(points: list[EpdsPoint]) -> dict | None:
    """First vs last assessment: {first, last, delta, direction}."""
    ordered = sorted(points, key=lambda p: p.date)
    if not ordered:
        return None
    first, last = ordered[0].total, ordered[-1].total
    delta = last - first
    return {
        "first": {"date": ordered[0].date.isoformat(), "total": first},
        "last": {"date": ordered[-1].date.isoformat(), "total": last},
        "delta": delta,
        "direction": "down" if delta < 0 else "up" if delta > 0 else "flat",
    }
