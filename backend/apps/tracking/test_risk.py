"""Unit tests for tracking/risk.py — one case per rule plus combinations."""
from . import risk
from .risk import RiskContext, evaluate_risk


def ctx(**kw):
    base = dict(
        red_flags=(),
        recent_moods=(),
        mode="postpartum",
        postpartum_day=30,
        anxiety_today=2,
        epds_total=None,
        epds_self_harm=None,
    )
    base.update(kw)
    return RiskContext(**base)


def test_all_clear_is_none():
    r = evaluate_risk(ctx(recent_moods=(4, 4, 5, 3)))
    assert (r.level, r.reasons, r.actions) == ("none", (), ())


def test_r1_self_harm_is_urgent_even_with_low_total():
    r = evaluate_risk(ctx(epds_total=5, epds_self_harm=1))
    assert r.level == "urgent"
    assert r.reasons == ("R1",)
    assert r.actions == ("show_crisis",)


def test_r2_red_flag_is_urgent():
    r = evaluate_risk(ctx(red_flags=("fever",)))
    assert r.level == "urgent"
    assert r.reasons == ("R2",)
    assert r.actions == ("contact_doctor_now", "show_emergency")


def test_r3_high_epds():
    r = evaluate_risk(ctx(epds_total=14, epds_self_harm=0))
    assert r.level == "high"
    assert r.reasons == ("R3",)
    assert r.actions == ("contact_specialist", "show_specialists", "ask_support")


def test_r3_boundary_13():
    assert evaluate_risk(ctx(epds_total=13)).level == "high"


def test_r4_moderate_band():
    for total in (10, 11, 12):
        r = evaluate_risk(ctx(epds_total=total))
        assert r.level == "moderate", total
        assert r.reasons == ("R4",)
    assert evaluate_risk(ctx(epds_total=9)).level == "none"


def test_r5_and_r7_past_baby_blues():
    r = evaluate_risk(ctx(recent_moods=(2, 1, 2, 4), postpartum_day=30))
    assert r.level == "moderate"
    assert r.reasons == ("R5", "R7")
    assert r.actions == ("open_toolkit", "ask_support", "suggest_epds", "read_ppd")


def test_r5_and_r6_inside_window_keeps_moderate_with_info_reason():
    r = evaluate_risk(ctx(recent_moods=(1, 2, 2, 5), postpartum_day=10))
    assert r.level == "moderate"
    assert r.reasons == ("R5", "R6")
    assert "read_baby_blues" in r.actions


def test_r5_day_14_is_still_window():
    r = evaluate_risk(ctx(recent_moods=(2, 2, 2, 2), postpartum_day=14))
    assert r.reasons == ("R5", "R6")
    r = evaluate_risk(ctx(recent_moods=(2, 2, 2, 2), postpartum_day=15))
    assert r.reasons == ("R5", "R7")


def test_r5_unknown_day_defaults_to_r7():
    r = evaluate_risk(ctx(recent_moods=(2, 2, 1, 2), postpartum_day=None))
    assert r.reasons == ("R5", "R7")


def test_r5_not_in_cycle_mode_extra_rules():
    r = evaluate_risk(
        ctx(recent_moods=(1, 1, 2, 3), mode="cycle", postpartum_day=None)
    )
    assert r.reasons == ("R5",)
    assert r.level == "moderate"


def test_r5_needs_full_window_of_four():
    assert evaluate_risk(ctx(recent_moods=(1, 1, 1))).reasons == ()
    assert evaluate_risk(ctx(recent_moods=(2, 2, 3, 3))).reasons == ()
    # longer history: only the last 4 count
    r = evaluate_risk(ctx(recent_moods=(1, 1, 1, 5, 5, 5, 5)))
    assert r.reasons == ()


def test_r8_anxiety_is_info():
    r = evaluate_risk(ctx(anxiety_today=4, recent_moods=(4, 4, 4, 4)))
    assert r.level == "info"
    assert r.reasons == ("R8",)
    assert r.actions == ("open_breathing",)
    assert evaluate_risk(ctx(anxiety_today=3)).level == "none"


def test_max_level_wins_and_actions_deduplicated():
    r = evaluate_risk(
        ctx(
            epds_total=15,
            recent_moods=(1, 1, 1, 1),
            anxiety_today=5,
            postpartum_day=30,
        )
    )
    assert r.level == "high"
    assert r.reasons == ("R3", "R5", "R7", "R8")
    assert r.actions.count("ask_support") == 1
    assert r.actions.count("suggest_epds") == 1


def test_urgent_combination_r1_r2():
    r = evaluate_risk(
        ctx(epds_total=16, epds_self_harm=2, red_flags=("heavy_bleeding",)))
    assert r.level == "urgent"
    assert r.reasons == ("R1", "R2", "R3")
