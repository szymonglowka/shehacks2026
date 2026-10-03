"""Unit tests for goals.streaks (pure, no Django/DB). Run: pytest backend/apps/goals/test_streaks.py."""

from datetime import date, timedelta

import pytest

try:  # project convention after checkpoint-0 (backend/ on sys.path)
    from apps.goals.streaks import (
        completions_this_week,
        current_streak_daily,
        current_streak_weekly,
        goal_stats,
        week_bounds,
        weekly_progress,
    )
except ImportError:  # before checkpoint-0: namespace packages from repo root
    from backend.apps.goals.streaks import (
    completions_this_week,
    current_streak_daily,
    current_streak_weekly,
    goal_stats,
    week_bounds,
    weekly_progress,
)

D = date(2026, 9, 28)  # a Monday


def days(anchor: date, offsets: list[int]) -> set[date]:
    return {anchor + timedelta(days=o) for o in offsets}


# week_bounds / completions_this_week


def test_week_bounds_monday_to_sunday():
    assert week_bounds(D) == (D, D + timedelta(days=6))
    assert week_bounds(D + timedelta(days=6)) == (D, D + timedelta(days=6))


def test_completions_this_week_counts_only_current_week():
    done = days(D, [-1, 0, 1, 7, 8])
    assert completions_this_week(done, D + timedelta(days=3)) == 2


def test_completions_this_week_empty():
    assert completions_this_week(set(), D) == 0


# daily streak


def test_daily_streak_ending_today():
    assert current_streak_daily(days(D, [-2, -1, 0]), D) == 3


def test_daily_streak_today_open_counts_from_yesterday():
    assert current_streak_daily(days(D, [-2, -1]), D) == 2


def test_daily_streak_broken_by_gap():
    assert current_streak_daily(days(D, [-3, -1, 0]), D) == 2


def test_daily_streak_zero_when_nothing_recent():
    assert current_streak_daily(days(D, [-5, -4]), D) == 0
    assert current_streak_daily(set(), D) == 0


def test_daily_streak_single_today():
    assert current_streak_daily(days(D, [0]), D) == 1


def test_daily_streak_ignores_future_dates():
    # future days never extend a streak counted backwards from today
    assert current_streak_daily(days(D, [0, 1, 2]), D) == 1


# weekly progress + streak


def test_weekly_progress_shape():
    assert weekly_progress(days(D, [0, 2]), D + timedelta(days=3), 3) == {
        "done": 2,
        "target": 3,
        "remaining": 1,
    }


def test_weekly_progress_capped_remaining_at_zero():
    assert weekly_progress(days(D, [0, 1, 2, 3]), D + timedelta(days=3), 3)["remaining"] == 0


def test_weekly_progress_rejects_bad_target():
    with pytest.raises(ValueError):
        weekly_progress({D}, D, 0)


def test_weekly_streak_current_week_met():
    # 3 done this week + 3 last week -> streak 2
    done = days(D, [0, 1, 2, -7, -6, -5])
    assert current_streak_weekly(done, D + timedelta(days=3), 3) == 2


def test_weekly_streak_current_week_open_counts_from_last():
    done = days(D, [0, -7, -6, -5])
    assert current_streak_weekly(done, D + timedelta(days=3), 3) == 1


def test_weekly_streak_broken_by_missed_week():
    done = days(D, [0, 1, 2, -14, -13, -12])
    assert current_streak_weekly(done, D + timedelta(days=3), 3) == 1


def test_weekly_streak_zero_when_last_week_missed():
    done = days(D, [0, -14, -13, -12])
    assert current_streak_weekly(done, D + timedelta(days=3), 3) == 0


def test_weekly_streak_target_one_behaves_like_active_weeks():
    done = days(D, [0, -7, -14])
    assert current_streak_weekly(done, D + timedelta(days=3), 1) == 3


# goal_stats (API shape)


def test_goal_stats_daily():
    stats = goal_stats("daily", 1, days(D, [-1, 0]), D)
    assert stats == {
        "current_streak": 2,
        "done_today": True,
        "progress_this_week": {"done": 1, "target": 7, "remaining": 6},
    }


def test_goal_stats_daily_today_open():
    stats = goal_stats("daily", 1, days(D, [-2, -1]), D)
    assert stats["current_streak"] == 2
    assert stats["done_today"] is False


def test_goal_stats_weekly():
    done = days(D, [0, 1, -7, -6, -5])
    stats = goal_stats("weekly", 3, done, D + timedelta(days=2))
    assert stats["done_today"] is False
    assert stats["progress_this_week"] == {"done": 2, "target": 3, "remaining": 1}
    assert stats["current_streak"] == 1


def test_goal_stats_ignores_future_logs():
    done = days(D, [0, 1, 5])  # +5 is in the future relative to D+2
    stats = goal_stats("weekly", 3, done, D + timedelta(days=2))
    assert stats["progress_this_week"]["done"] == 2
    assert stats["done_today"] is False


def test_goal_stats_rejects_bad_input():
    with pytest.raises(ValueError):
        goal_stats("monthly", 1, set(), D)
    with pytest.raises(ValueError):
        goal_stats("daily", 0, set(), D)
