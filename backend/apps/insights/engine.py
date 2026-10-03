"""Insight cards engine (SPEC §6.4, W5).

Pure functions, no Django. Each card is {code, params, strength} with
strength in 0..1; the frontend translates code + params into copy.
Every card requires >= 7 data points (MIN_POINTS).
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta


MIN_POINTS = 7
SLEEP_GOOD_HOURS = 6.0
EFFECT_THRESHOLD = 0.5  # minimal mood difference worth reporting


@dataclass(frozen=True)
class DayPoint:
    day: date
    mood: int | None = None  # 1-5
    sleep_hours: float | None = None
    goal_done: bool | None = None  # True when >= 1 goal completed that day
    phase: str | None = None  # cycle phase that day (cycle mode)


@dataclass(frozen=True)
class StrategyStat:
    code: str
    survey_score: int  # 0-3 from onboarding
    used_count: int = 0
    helped_score_sum: float = 0.0  # yes=1, somewhat=0.5, no=0


@dataclass(frozen=True)
class InsightCard:
    code: str
    params: dict
    strength: float  # 0..1

    def as_dict(self) -> dict:
        return {"code": self.code, "params": dict(self.params),
                "strength": self.strength}


def _avg(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def sleep_mood_card(points: list[DayPoint]) -> InsightCard | None:
    """Mood on nights with >= 6 h sleep vs shorter nights (diff >= 0.5)."""
    usable = [p for p in points if p.mood is not None and p.sleep_hours is not None]
    if len(usable) < MIN_POINTS:
        return None
    good = [p.mood for p in usable if p.sleep_hours >= SLEEP_GOOD_HOURS]
    bad = [p.mood for p in usable if p.sleep_hours < SLEEP_GOOD_HOURS]
    if not good or not bad:
        return None
    avg_good, avg_bad = _avg(good), _avg(bad)
    diff = avg_good - avg_bad
    if diff < EFFECT_THRESHOLD:
        return None
    return InsightCard(
        code="sleep_mood",
        params={"good_avg": round(avg_good, 2), "bad_avg": round(avg_bad, 2),
                "diff": round(diff, 2), "n": len(usable)},
        strength=_clamp01(diff / 2.0),
    )


def goals_mood_card(points: list[DayPoint]) -> InsightCard | None:
    """Mood on days with >= 1 completed goal vs days without (diff >= 0.5)."""
    usable = [p for p in points if p.mood is not None and p.goal_done is not None]
    if len(usable) < MIN_POINTS:
        return None
    with_goals = [p.mood for p in usable if p.goal_done]
    without = [p.mood for p in usable if not p.goal_done]
    if not with_goals or not without:
        return None
    avg_with, avg_without = _avg(with_goals), _avg(without)
    diff = avg_with - avg_without
    if diff < EFFECT_THRESHOLD:
        return None
    return InsightCard(
        code="goals_mood",
        params={"with_avg": round(avg_with, 2), "without_avg": round(avg_without, 2),
                "diff": round(diff, 2), "n": len(usable)},
        strength=_clamp01(diff / 2.0),
    )


def phase_mood_card(points: list[DayPoint]) -> InsightCard | None:
    """Average mood per cycle phase (cycle mode, broad phase coverage)."""
    usable = [p for p in points if p.mood is not None and p.phase]
    if len(usable) < MIN_POINTS:
        return None
    by_phase: dict[str, list[int]] = {}
    for p in usable:
        by_phase.setdefault(p.phase, []).append(p.mood)
    # Require a near-full cycle of evidence: >= 3 distinct phases.
    if len(by_phase) < 3:
        return None
    avgs = {ph: round(_avg(ms), 2) for ph, ms in by_phase.items()}
    spread = max(avgs.values()) - min(avgs.values())
    best = max(avgs, key=lambda ph: avgs[ph])
    return InsightCard(
        code="phase_mood",
        params={"avgs": avgs, "best_phase": best, "n": len(usable)},
        strength=_clamp01(spread / 4.0),
    )


def trend_card(points: list[DayPoint], today: date) -> InsightCard | None:
    """Mood of the last 7 days vs the previous 7."""
    recent = [p.mood for p in points
              if p.mood is not None and today - timedelta(days=7) <= p.day <= today]
    previous = [p.mood for p in points
                if p.mood is not None
                and today - timedelta(days=14) <= p.day < today - timedelta(days=7)]
    if len(recent) + len(previous) < MIN_POINTS or len(recent) < 2 or len(previous) < 2:
        return None
    avg_recent, avg_prev = _avg(recent), _avg(previous)
    diff = avg_recent - avg_prev
    direction = "up" if diff > 0.15 else ("down" if diff < -0.15 else "flat")
    return InsightCard(
        code="trend",
        params={"recent_avg": round(avg_recent, 2), "previous_avg": round(avg_prev, 2),
                "diff": round(diff, 2), "direction": direction},
        strength=_clamp01(abs(diff) / 2.0),
    )


def current_streak(checkin_days: list[date], today: date) -> int:
    """Consecutive check-in days ending today or yesterday (alive streak)."""
    days = set(checkin_days)
    if today in days:
        cursor = today
    elif today - timedelta(days=1) in days:
        cursor = today - timedelta(days=1)
    else:
        return 0
    streak = 0
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def streak_card(checkin_days: list[date], today: date) -> InsightCard | None:
    if current_streak(checkin_days, today) < 2:
        return None
    n = current_streak(checkin_days, today)
    return InsightCard(
        code="streak",
        params={"days": n, "kind": "checkin"},
        strength=_clamp01(n / 14.0),
    )


def bayesian_score(stat: StrategyStat) -> float:
    """SPEC §5 ranking: (survey/3 * 2 + helped) / (2 + used)."""
    return (stat.survey_score / 3.0 * 2.0 + stat.helped_score_sum) / (2 + stat.used_count)


def toolkit_top_card(strategies: list[StrategyStat]) -> InsightCard | None:
    """The strategy that most often helped (needs >= 1 real use)."""
    used = [s for s in strategies if s.used_count >= 1]
    if not used:
        return None
    best = max(used, key=bayesian_score)
    score = bayesian_score(best)
    return InsightCard(
        code="toolkit_top",
        params={"strategy": best.code, "helped": best.helped_score_sum,
                "total": best.used_count},
        strength=_clamp01(score),
    )


def build_cards(
    points: list[DayPoint],
    today: date,
    checkin_days: list[date] | None = None,
    strategies: list[StrategyStat] | None = None,
) -> list[dict]:
    """All applicable cards as {code, params, strength} dicts."""
    cards: list[InsightCard | None] = [
        sleep_mood_card(points),
        goals_mood_card(points),
        phase_mood_card(points),
        trend_card(points, today),
        streak_card(checkin_days if checkin_days is not None else [p.day for p in points if p.mood is not None], today),
        toolkit_top_card(strategies or []),
    ]
    return [c.as_dict() for c in cards if c is not None]
