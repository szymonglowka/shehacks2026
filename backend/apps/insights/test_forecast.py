"""Unit tests for insights/forecast.py (SPEC §6.6)."""
from .forecast import ForecastContext, forecast_tomorrow


def fc(**kw):
    return ForecastContext(**{"mode": "cycle", **kw})


def test_clear_day_is_sunny():
    f = forecast_tomorrow(fc(avg_sleep_3d=7.5, avg_mood_3d=4.0))
    assert f.outlook == "sunny" and f.factors == ()


def test_period_soon_minus_two():
    f = forecast_tomorrow(fc(days_until_period=2))
    assert (f.outlook, f.factors, f.tip_code) == ("cloudy", ("period_soon",), "lower_expectations")


def test_period_days_one_and_two():
    for day in (1, 2):
        f = forecast_tomorrow(fc(tomorrow_period_day=day))
        assert f.outlook == "cloudy" and f.factors == ("period_days",)
    assert forecast_tomorrow(fc(tomorrow_period_day=3)).outlook == "sunny"


def test_luteal_minus_one_partly():
    f = forecast_tomorrow(fc(luteal_tomorrow=True))
    assert (f.outlook, f.factors, f.tip_code) == ("partly", ("luteal",), "plan_me_time")


def test_baby_blues_peak_minus_two():
    for day in (3, 4, 5):
        f = forecast_tomorrow(fc(mode="postpartum", postpartum_day_tomorrow=day))
        assert f.outlook == "cloudy", day
        assert f.factors == ("baby_blues_peak",)
    assert forecast_tomorrow(fc(mode="postpartum", postpartum_day_tomorrow=6)).factors == ("baby_blues_window",)


def test_postpartum_window_exclusive_not_stacked():
    # day 4 is inside <= 14 but must count only the -2 peak, not -3 total
    f = forecast_tomorrow(fc(mode="postpartum", postpartum_day_tomorrow=4))
    assert f.factors == ("baby_blues_peak",)
    f = forecast_tomorrow(fc(mode="postpartum", postpartum_day_tomorrow=10))
    assert (f.outlook, f.factors) == ("partly", ("baby_blues_window",))
    assert forecast_tomorrow(fc(mode="postpartum", postpartum_day_tomorrow=20)).outlook == "sunny"


def test_sleep_thresholds():
    assert forecast_tomorrow(fc(avg_sleep_3d=4.9)).factors == ("poor_sleep",)
    f = forecast_tomorrow(fc(avg_sleep_3d=5.0))
    assert f.factors == ("short_sleep",) and f.outlook == "partly"
    assert forecast_tomorrow(fc(avg_sleep_3d=6.0)).factors == ()
    f = forecast_tomorrow(fc(avg_sleep_3d=4.0))
    assert (f.outlook, f.tip_code) == ("cloudy", "rest_more")


def test_low_trend_and_boundary():
    assert forecast_tomorrow(fc(avg_mood_3d=2.5)).factors == ("low_trend",)
    assert forecast_tomorrow(fc(avg_mood_3d=2.6)).factors == ()
    f = forecast_tomorrow(fc(avg_mood_3d=2.0))
    assert (f.outlook, f.tip_code) == ("partly", "ask_circle")


def test_goal_streak_adds_point():
    f = forecast_tomorrow(fc(luteal_tomorrow=True, goal_streak=3))
    assert f.outlook == "sunny" and "goal_streak" in f.factors
    f = forecast_tomorrow(fc(goal_streak=5))
    assert (f.outlook, f.tip_code) == ("sunny", "keep_going")
    assert forecast_tomorrow(fc(luteal_tomorrow=True, goal_streak=2)).outlook == "partly"


def test_rainy_needs_minus_four():
    f = forecast_tomorrow(fc(days_until_period=2, avg_sleep_3d=4.0))
    assert f.outlook == "rainy"  # -2 -2
    f = forecast_tomorrow(fc(days_until_period=2, avg_sleep_3d=5.5, avg_mood_3d=2.0))
    assert f.outlook == "rainy"  # -2 -1 -1


def test_strongest_factor_wins_tip_tiebreak():
    # poor_sleep (-2) beats low_trend (-1)
    f = forecast_tomorrow(fc(avg_sleep_3d=4.0, avg_mood_3d=2.0))
    assert f.tip_code == "rest_more"
    # two -2 factors: period_soon outranks poor_sleep? no — check priority:
    # poor_sleep is first in _FACTOR_PRIORITY
    f = forecast_tomorrow(fc(days_until_period=2, avg_sleep_3d=4.0))
    assert f.tip_code == "rest_more"


def test_cloudy_range_and_shape():
    f = forecast_tomorrow(fc(luteal_tomorrow=True, avg_sleep_3d=5.5))
    assert f.outlook == "cloudy"  # -2 total
    d = f.as_dict()
    assert set(d) == {"outlook", "factors", "tip_code"}
