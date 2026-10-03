"""Unit tests for insights/engine.py (SPEC §6.4)."""
from datetime import date, timedelta

from engine import (
    DayPoint, StrategyStat, build_cards, current_streak, goals_mood_card,
    phase_mood_card, sleep_mood_card, streak_card, toolkit_top_card,
    trend_card,
)

TODAY = date(2026, 10, 3)


def days(n, **kw):
    return [DayPoint(day=TODAY - timedelta(days=i), **kw)
            for i in range(n - 1, -1, -1)]


def test_sleep_mood_needs_seven_points():
    pts = days(6, mood=4, sleep_hours=7.0)
    assert sleep_mood_card(pts) is None


def test_sleep_mood_fires_on_real_gap():
    pts = days(4, mood=4, sleep_hours=7.0) + days(4, mood=2, sleep_hours=4.0)
    c = sleep_mood_card(pts)
    assert c is not None and c.code == "sleep_mood"
    assert c.params["diff"] >= 0.5
    assert 0.0 <= c.strength <= 1.0
    assert set(c.as_dict()) == {"code", "params", "strength"}


def test_sleep_mood_silent_when_no_gap():
    pts = days(8, mood=3, sleep_hours=7.0)
    assert sleep_mood_card(pts) is None  # single group only


def test_sleep_mood_silent_below_threshold():
    pts = ([DayPoint(day=TODAY - timedelta(days=i), mood=4,
                     sleep_hours=7.0) for i in range(4)] +
           [DayPoint(day=TODAY - timedelta(days=4 + i), mood=4,
                     sleep_hours=4.0) for i in range(4)])
    assert sleep_mood_card(pts) is None


def test_goals_mood_card():
    pts = ([DayPoint(day=TODAY - timedelta(days=i), mood=4, goal_done=True)
            for i in range(4)] +
           [DayPoint(day=TODAY - timedelta(days=4 + i), mood=2, goal_done=False)
            for i in range(4)])
    c = goals_mood_card(pts)
    assert c is not None and c.code == "goals_mood"
    assert c.params["diff"] == 2.0


def test_goals_mood_missing_goal_info_ignored():
    pts = days(10, mood=4)
    assert goals_mood_card(pts) is None


def test_phase_mood_needs_three_phases():
    pts = ([DayPoint(day=TODAY - timedelta(days=i), mood=4, phase="luteal")
            for i in range(4)] +
           [DayPoint(day=TODAY - timedelta(days=4 + i), mood=2, phase="menstrual")
            for i in range(4)])
    assert phase_mood_card(pts) is None  # only 2 phases
    pts += [DayPoint(day=TODAY - timedelta(days=8), mood=3, phase="follicular")]
    c = phase_mood_card(pts)
    assert c is not None and c.code == "phase_mood"
    assert c.params["best_phase"] == "luteal"


def test_trend_card_directions():
    prev = [DayPoint(day=TODAY - timedelta(days=8 + i), mood=2) for i in range(7)]
    rec = [DayPoint(day=TODAY - timedelta(days=i), mood=4) for i in range(7)]
    c = trend_card(prev + rec, TODAY)
    assert c is not None and c.params["direction"] == "up"
    c = trend_card(
        [DayPoint(day=p.day, mood=6 - p.mood) for p in prev + rec], TODAY
    )  # mirrored: recent is bad
    assert c.params["direction"] == "down"


def test_trend_needs_data_in_both_halves():
    pts = [DayPoint(day=TODAY - timedelta(days=i), mood=4) for i in range(7)]
    assert trend_card(pts, TODAY) is None


def test_current_streak():
    assert current_streak([], TODAY) == 0
    assert current_streak([TODAY], TODAY) == 1
    assert current_streak([TODAY - timedelta(days=1)], TODAY) == 1  # alive
    assert current_streak([TODAY - timedelta(days=2)], TODAY) == 0  # broken
    ds = [TODAY - timedelta(days=i) for i in range(5)]
    assert current_streak(ds, TODAY) == 5
    ds = [TODAY - timedelta(days=i) for i in range(1, 4)]
    assert current_streak(ds, TODAY) == 3  # alive via yesterday


def test_streak_card_threshold():
    assert streak_card([TODAY], TODAY) is None
    c = streak_card([TODAY - timedelta(days=i) for i in range(5)], TODAY)
    assert c is not None and c.params["days"] == 5


def test_toolkit_top_picks_bayesian_best():
    stats = [
        StrategyStat(code="walk", survey_score=3, used_count=5, helped_score_sum=4.0),
        StrategyStat(code="breath", survey_score=1, used_count=5, helped_score_sum=5.0),
        StrategyStat(code="never", survey_score=0, used_count=0),
    ]
    c = toolkit_top_card(stats)
    assert c is not None and c.params["strategy"] == "walk"
    assert c.params["helped"] == 4.0 and c.params["total"] == 5


def test_toolkit_top_none_without_use():
    assert toolkit_top_card([]) is None
    assert toolkit_top_card([StrategyStat(code="x", survey_score=3)]) is None


def test_build_cards_shape_and_min_points():
    pts = ([DayPoint(day=TODAY - timedelta(days=i), mood=4,
                     sleep_hours=7.0, goal_done=True) for i in range(7)] +
           [DayPoint(day=TODAY - timedelta(days=7 + i), mood=2,
                     sleep_hours=4.0, goal_done=False) for i in range(7)])
    cards = build_cards(
        pts, TODAY,
        checkin_days=[p.day for p in pts],
        strategies=[StrategyStat(code="walk", survey_score=3,
                                 used_count=4, helped_score_sum=3.5)],
    )
    codes = {c["code"] for c in cards}
    assert {"sleep_mood", "goals_mood", "trend", "streak", "toolkit_top"} <= codes
    for c in cards:
        assert set(c) == {"code", "params", "strength"}
        assert 0.0 <= c["strength"] <= 1.0


def test_build_cards_empty_when_no_data():
    assert build_cards([], TODAY) == []
