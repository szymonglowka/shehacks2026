"""Postpartum / cycle status logic (SPEC §6.1).

Pure functions, no Django. Inputs are plain dataclasses so the same code
is unit-testable now and reusable by Django views later.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from itertools import pairwise


@dataclass(frozen=True)
class PeriodInput:
    start_date: date
    end_date: date | None = None


@dataclass(frozen=True)
class PostpartumStatus:
    days_since_birth: int
    postpartum_week: int  # 1-indexed: days 0-6 -> week 1
    stage: str  # early | recovery | beyond


@dataclass(frozen=True)
class CycleStatus:
    cycle_day: int  # 1-indexed day of current cycle
    phase: str  # menstrual | follicular | ovulation | luteal
    next_period_date: date
    confidence: str  # low | medium | high (by number of recorded periods)
    avg_cycle_used: float
    period_length_used: int


# Stage boundaries (SPEC §6.1): early 0-14 d ("baby blues" window),
# recovery 15-42 d, beyond > 42 d.
_EARLY_MAX = 14
_RECOVERY_MAX = 42


def postpartum_status(birth_date: date, today: date) -> PostpartumStatus:
    """Days since birth, 1-indexed week number and stage name."""
    days = (today - birth_date).days
    days = max(days, 0)  # birth date in the future: treat as day 0
    week = days // 7 + 1
    if days <= _EARLY_MAX:
        stage = "early"
    elif days <= _RECOVERY_MAX:
        stage = "recovery"
    else:
        stage = "beyond"
    return PostpartumStatus(days_since_birth=days, postpartum_week=week, stage=stage)


def _average_cycle(periods: list[PeriodInput]) -> float | None:
    """Mean of up to the 6 most recent cycle lengths (start-to-start gaps)."""
    starts = sorted(p.start_date for p in periods)
    if len(starts) < 2:
        return None
    gaps = [(b - a).days for a, b in pairwise(starts)]
    gaps = [g for g in gaps if g > 0]
    if not gaps:
        return None
    return sum(gaps[-6:]) / len(gaps[-6:])


def cycle_status(
    periods: list[PeriodInput],
    avg_cycle_length: float,
    avg_period_length: int,
    today: date,
) -> CycleStatus | None:
    """Cycle status from the last recorded period and averages.

    Uses the mean of the last 6 cycles when >= 2 periods exist, otherwise
    the profile average. Returns None when no period was ever recorded.
    """
    if not periods:
        return None
    last = max(periods, key=lambda p: p.start_date)
    observed = _average_cycle(periods)
    cycle_len = observed if observed is not None else float(avg_cycle_length)
    n = len(periods)
    if n <= 1:
        confidence = "low"
    elif n <= 3:
        confidence = "medium"
    else:
        confidence = "high"

    if last.end_date is not None and last.end_date >= last.start_date:
        period_len = (last.end_date - last.start_date).days + 1
    else:
        period_len = int(avg_period_length)

    cycle_day = (today - last.start_date).days + 1
    cycle_day = max(cycle_day, 1)

    ovulation = round(cycle_len) - 14
    if cycle_day <= period_len:
        phase = "menstrual"
    elif ovulation - 1 <= cycle_day <= ovulation + 1:
        # Reached only when cycle_day > period_len, so bleeding wins over
        # the window on degenerate short cycles.
        phase = "ovulation"
    elif cycle_day < ovulation - 1:
        phase = "follicular"
    else:
        phase = "luteal"

    next_period = last.start_date + timedelta(days=round(cycle_len))
    return CycleStatus(
        cycle_day=cycle_day,
        phase=phase,
        next_period_date=next_period,
        confidence=confidence,
        avg_cycle_used=cycle_len,
        period_length_used=period_len,
    )
