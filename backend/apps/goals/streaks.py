"""Streak + weekly-progress helpers for goals (SPEC §6.5, §7).

Django-free on purpose: inputs are plain ``datetime.date`` values, ints and
strings, so this module (and its tests) run without Django or a database.
The Django layer (models / serializers / ``selectors.today_goals``) is built
on top of these helpers after checkpoint-0 and only converts ``GoalLog``
rows into ``date`` sets.

Conventions (also used by the API fields ``current_streak``, ``done_today``,
``progress_this_week``):
- weeks run Monday–Sunday (``week_start`` parameter exists for tests only;
  the API always uses Monday),
- a missing log for *today* does not break a daily streak: the streak counts
  back from today when today is done, otherwise from yesterday,
- a weekly (N-per-week) streak counts consecutive weeks whose completion
  count reached ``target_count``; the current week counts only when its
  target is already met, otherwise the streak counts back from last week.
"""

from __future__ import annotations

from collections.abc import Iterable
from datetime import date, timedelta

DAILY = "daily"
WEEKLY = "weekly"
FREQUENCIES = (DAILY, WEEKLY)

MONDAY = 0


def _as_set(completed: Iterable[date]) -> set[date]:
    return set(completed)


def week_bounds(day: date, week_start: int = MONDAY) -> tuple[date, date]:
    """Return (start, end) inclusive dates of the week containing ``day``."""
    start = day - timedelta(days=(day.weekday() - week_start) % 7)
    return start, start + timedelta(days=6)


def current_streak_daily(completed: Iterable[date], today: date) -> int:
    """Consecutive completed days ending today (or yesterday if today is open)."""
    done = _as_set(completed)
    cursor = today if today in done else today - timedelta(days=1)
    streak = 0
    while cursor in done:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def completions_this_week(
    completed: Iterable[date], today: date, week_start: int = MONDAY
) -> int:
    """Number of completed days in the week containing ``today``."""
    start, end = week_bounds(today, week_start)
    return sum(1 for day in _as_set(completed) if start <= day <= end)


def weekly_progress(
    completed: Iterable[date],
    today: date,
    target_count: int,
    week_start: int = MONDAY,
) -> dict:
    """Progress of an N-per-week goal: ``{"done", "target", "remaining"}``."""
    if target_count < 1:
        raise ValueError("target_count must be >= 1")
    done = completions_this_week(completed, today, week_start)
    return {"done": done, "target": target_count, "remaining": max(0, target_count - done)}


def current_streak_weekly(
    completed: Iterable[date],
    today: date,
    target_count: int,
    week_start: int = MONDAY,
) -> int:
    """Consecutive weeks meeting ``target_count`` (current week if already met)."""
    if target_count < 1:
        raise ValueError("target_count must be >= 1")
    done = _as_set(completed)
    start, _ = week_bounds(today, week_start)

    def week_met(week_start_day: date) -> bool:
        week_end = week_start_day + timedelta(days=6)
        count = sum(1 for day in done if week_start_day <= day <= week_end)
        return count >= target_count

    streak = 0
    cursor = start
    if not week_met(cursor):
        cursor -= timedelta(weeks=1)
    while week_met(cursor):
        streak += 1
        cursor -= timedelta(weeks=1)
    return streak


def goal_stats(
    frequency: str,
    target_count: int,
    completed: Iterable[date],
    today: date,
) -> dict:
    """API-facing stats for one goal.

    Returns ``{"current_streak", "done_today", "progress_this_week"}`` matching
    the computed fields on ``GET /goals`` (SPEC §7). For daily goals the
    weekly progress target is 7; for weekly goals it is ``target_count``.
    """
    if frequency not in FREQUENCIES:
        raise ValueError(f"frequency must be one of {FREQUENCIES}")
    if target_count < 1:
        raise ValueError("target_count must be >= 1")
    done = _as_set(completed)
    # Future logs (date > today) never count: they are data errors, not progress.
    done = {day for day in done if day <= today}
    if frequency == DAILY:
        streak = current_streak_daily(done, today)
        progress = {
            "done": completions_this_week(done, today),
            "target": 7,
            "remaining": max(0, 7 - completions_this_week(done, today)),
        }
    else:
        streak = current_streak_weekly(done, today, target_count)
        progress = weekly_progress(done, today, target_count)
    return {
        "current_streak": streak,
        "done_today": today in done,
        "progress_this_week": progress,
    }
