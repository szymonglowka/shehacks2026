"""Tomorrow's wellbeing forecast (SPEC §6.6, W11).

Rule-based "weather": start at 0, each factor subtracts (a goal streak
adds back). Mapping: >= 0 sunny, -1 partly, -2/-3 cloudy, <= -4 rainy.
tip_code follows the strongest factor. Pure functions, no Django.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ForecastContext:
    mode: str = "cycle"  # postpartum | cycle
    # Postpartum: which day-after-birth tomorrow is (None when not postpartum).
    postpartum_day_tomorrow: int | None = None
    # Cycle: exactly one of these describes tomorrow.
    days_until_period: int | None = None  # 2 -> period in two days
    tomorrow_period_day: int | None = None  # 1|2 when tomorrow is a period day
    luteal_tomorrow: bool = False
    avg_sleep_3d: float | None = None
    avg_mood_3d: float | None = None
    goal_streak: int = 0


@dataclass(frozen=True)
class Forecast:
    outlook: str  # sunny | partly | cloudy | rainy
    factors: tuple[str, ...] = ()
    tip_code: str = "keep_going"  # rest_more | lower_expectations |
    # plan_me_time | ask_circle | keep_going

    def as_dict(self) -> dict:
        return {"outlook": self.outlook, "factors": list(self.factors),
                "tip_code": self.tip_code}


_TIP_BY_FACTOR = {
    "poor_sleep": "rest_more",
    "short_sleep": "rest_more",
    "period_soon": "lower_expectations",
    "period_days": "lower_expectations",
    "baby_blues_peak": "lower_expectations",
    "low_trend": "ask_circle",
    "luteal": "plan_me_time",
    "baby_blues_window": "plan_me_time",
}
# Tie-break order when several factors share the strongest deduction.
_FACTOR_PRIORITY = (
    "poor_sleep", "period_soon", "period_days", "baby_blues_peak",
    "low_trend", "short_sleep", "luteal", "baby_blues_window",
)


def forecast_tomorrow(ctx: ForecastContext) -> Forecast:
    score = 0
    factors: list[str] = []
    weights: dict[str, int] = {}

    def deduct(code: str, points: int) -> None:
        nonlocal score
        factors.append(code)
        weights[code] = points
        score -= points

    if ctx.mode == "postpartum" and ctx.postpartum_day_tomorrow is not None:
        day = ctx.postpartum_day_tomorrow
        if 3 <= day <= 5:
            deduct("baby_blues_peak", 2)
        elif day <= 14:
            deduct("baby_blues_window", 1)
    elif ctx.mode == "cycle":
        if ctx.tomorrow_period_day in (1, 2):
            deduct("period_days", 2)
        elif ctx.days_until_period == 2:
            deduct("period_soon", 2)
        elif ctx.luteal_tomorrow:
            deduct("luteal", 1)

    if ctx.avg_sleep_3d is not None:
        if ctx.avg_sleep_3d < 5:
            deduct("poor_sleep", 2)
        elif ctx.avg_sleep_3d < 6:
            deduct("short_sleep", 1)

    if ctx.avg_mood_3d is not None and ctx.avg_mood_3d <= 2.5:
        deduct("low_trend", 1)

    if ctx.goal_streak >= 3:
        score += 1
        factors.append("goal_streak")

    if score >= 0:
        outlook = "sunny"
    elif score == -1:
        outlook = "partly"
    elif score >= -3:
        outlook = "cloudy"
    else:
        outlook = "rainy"

    negatives = [f for f in factors if f in _TIP_BY_FACTOR]
    if negatives:
        strongest = max(weights[f] for f in negatives)
        candidates = [f for f in negatives if weights[f] == strongest]
        tip = _TIP_BY_FACTOR[sorted(candidates,
                                    key=_FACTOR_PRIORITY.index)[0]]
    elif "goal_streak" in factors:
        tip = "keep_going"
    else:
        tip = "plan_me_time"

    return Forecast(outlook=outlook, factors=tuple(factors), tip_code=tip)
