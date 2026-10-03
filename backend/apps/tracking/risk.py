"""Risk engine (SPEC §6.2, rules R1-R8).

Pure functions, no Django. Called after a check-in or EPDS is saved and
its result is returned in the API response.
"""
from __future__ import annotations

from dataclasses import dataclass

LEVELS = ("none", "info", "moderate", "high", "urgent")
_LEVEL_RANK = {name: i for i, name in enumerate(LEVELS)}


@dataclass(frozen=True)
class RiskContext:
    """Everything the rules need; plain values, no ORM."""

    red_flags: tuple[str, ...] = ()
    recent_moods: tuple[int, ...] = ()  # oldest -> newest; last 4 are used
    mode: str = "postpartum"  # postpartum | cycle
    postpartum_day: int | None = None
    anxiety_today: int | None = None
    epds_total: int | None = None
    epds_self_harm: int | None = None  # EPDS question 10 score, 0-3


@dataclass(frozen=True)
class RiskResult:
    level: str  # none | info | moderate | high | urgent
    reasons: tuple[str, ...] = ()
    actions: tuple[str, ...] = ()


def _r5_holds(moods: tuple[int, ...]) -> bool:
    window = moods[-4:]
    return len(window) == 4 and sum(1 for m in window if m <= 2) >= 3


def evaluate_risk(ctx: RiskContext) -> RiskResult:
    """Apply R1-R8 in SPEC order; level is the max of triggered rules."""
    level = "none"
    reasons: list[str] = []
    actions: list[str] = []

    def fire(rule: str, rule_level: str, rule_actions: list[str]) -> None:
        nonlocal level
        reasons.append(rule)
        for a in rule_actions:
            if a not in actions:
                actions.append(a)
        if _LEVEL_RANK[rule_level] > _LEVEL_RANK[level]:
            level = rule_level

    # R1: self-harm answer on EPDS.
    if ctx.epds_self_harm is not None and ctx.epds_self_harm >= 1:
        fire("R1", "urgent", ["show_crisis"])
    # R2: any postpartum red flag.
    if ctx.red_flags:
        fire("R2", "urgent", ["contact_doctor_now", "show_emergency"])
    # R3 / R4: EPDS total bands.
    if ctx.epds_total is not None:
        if ctx.epds_total >= 13:
            fire("R3", "high", ["contact_specialist", "show_specialists", "ask_support"])
        elif 10 <= ctx.epds_total <= 12:
            fire("R4", "moderate", ["repeat_epds_14d", "open_toolkit"])

    r5 = _r5_holds(tuple(ctx.recent_moods))
    if r5:
        # R5: low mood in >= 3 of the last 4 check-ins.
        fire("R5", "moderate", ["open_toolkit", "ask_support", "suggest_epds"])
        if ctx.mode == "postpartum" and (
            ctx.postpartum_day is None or ctx.postpartum_day > 14
        ):
            # R7: persistent low mood past the baby-blues window
            # (unknown day counts as past the window — safer default).
            fire("R7", "moderate", ["read_ppd", "suggest_epds"])
        elif ctx.mode == "postpartum" and ctx.postpartum_day is not None and ctx.postpartum_day <= 14:
            # R6: same signal inside the baby-blues window — informational.
            fire("R6", "info", ["read_baby_blues"])
    # R8: high anxiety today.
    if ctx.anxiety_today is not None and ctx.anxiety_today >= 4:
        fire("R8", "info", ["open_breathing"])

    return RiskResult(level=level, reasons=tuple(reasons), actions=tuple(actions))
