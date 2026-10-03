"""Unit tests for support.ranking (pure, no Django needed)."""

import math

import pytest

try:  # project convention after checkpoint-0 (backend/ on sys.path)
    from apps.support.ranking import (
        RankedStrategy,
        apply_feedback,
        feedback_value,
        rank_strategies,
        strategy_score,
    )
except ImportError:  # before checkpoint-0: namespace packages from repo root
    from backend.apps.support.ranking import (
        RankedStrategy,
        apply_feedback,
        feedback_value,
        rank_strategies,
        strategy_score,
    )


def test_prior_only_order_follows_survey():
    assert strategy_score(3) > strategy_score(2) > strategy_score(1) > strategy_score(0)
    assert strategy_score(3) == pytest.approx(2.0 / 2.0)
    assert strategy_score(0) == 0.0


def test_bayesian_formula_matches_spec():
    # (survey/3 * 2 + helped_sum) / (2 + used)
    assert strategy_score(3, 2.5, 3) == pytest.approx((2.0 + 2.5) / 5.0)
    assert strategy_score(1, 0.0, 0) == pytest.approx((2.0 / 3.0) / 2.0)


def test_feedback_moves_ranking_up_and_down():
    before = strategy_score(2, 0.0, 0)
    up, used_up = apply_feedback(2, 0.0, 0, "yes")
    down, used_down = apply_feedback(2, 0.0, 0, "no")
    assert strategy_score(2, up, used_up) > before
    assert strategy_score(2, down, used_down) < before
    # "somewhat" is exactly half of "yes"
    some, _ = apply_feedback(2, 0.0, 0, "somewhat")
    assert some == pytest.approx(up / 2.0)


def test_feedback_without_answer_still_counts_as_use():
    helped_sum, used = apply_feedback(3, 1.0, 1, None)
    assert (helped_sum, used) == (1.0, 2)
    assert strategy_score(3, helped_sum, used) < strategy_score(3, 1.0, 1)


def test_ranking_order_changes_after_feedback():
    strategies = [
        RankedStrategy(code="walk", survey_score=3),
        RankedStrategy(code="breath", survey_score=2),
    ]
    assert [s.code for s in rank_strategies(strategies)] == ["walk", "breath"]
    # Two "no" feedbacks push the survey favourite below the runner-up.
    helped_sum, used = 0.0, 0
    for _ in range(2):
        helped_sum, used = apply_feedback(3, helped_sum, used, "no")
    strategies[0].helped_score_sum = helped_sum
    strategies[0].used_count = used
    strategies[0].score = strategy_score(3, helped_sum, used)
    assert [s.code for s in rank_strategies(strategies)] == ["breath", "walk"]


def test_many_yes_feedbacks_beat_mid_prior():
    low = RankedStrategy(code="low", survey_score=1)
    low.helped_score_sum, low.used_count = 4.0, 4  # 4x "yes"
    low.score = strategy_score(1, 4.0, 4)
    mid = RankedStrategy(code="mid", survey_score=2)
    assert [s.code for s in rank_strategies([mid, low])] == ["low", "mid"]


def test_pristine_top_prior_beats_everything_below_perfect():
    # A survey-3 strategy scores exactly 1.0; observed averages approach 1.0
    # from below, so only a perfect record ties it (tie -> by code).
    low = RankedStrategy(code="low", survey_score=1)
    low.helped_score_sum, low.used_count = 10.0, 10  # 10x "yes"
    low.score = strategy_score(1, 10.0, 10)
    assert low.score < strategy_score(3)
    assert [s.code for s in rank_strategies([low, RankedStrategy(code="aaa", survey_score=3)])][0] == "aaa"


def test_untried_rejected_sort_last():
    strategies = [
        RankedStrategy(code="rejected", survey_score=0),
        RankedStrategy(code="weak", survey_score=1),
        RankedStrategy(code="tried", survey_score=0, helped_score_sum=0.0, used_count=2),
    ]
    assert [s.code for s in rank_strategies(strategies)] == [
        "weak",
        "tried",
        "rejected",
    ]


def test_ties_broken_deterministically_by_code():
    strategies = [RankedStrategy(code=b, survey_score=2) for b in ("b2", "b1", "b3")]
    assert [s.code for s in rank_strategies(strategies)] == ["b1", "b2", "b3"]
    assert rank_strategies([]) == []


def test_feedback_value_mapping():
    assert feedback_value("yes") == 1.0
    assert feedback_value("somewhat") == 0.5
    assert feedback_value("no") == 0.0
    assert feedback_value(None) == 0.0
    with pytest.raises(ValueError):
        feedback_value("meh")


def test_invalid_inputs_rejected():
    with pytest.raises(ValueError):
        strategy_score(4)
    with pytest.raises(ValueError):
        strategy_score(-1)
    with pytest.raises(ValueError):
        strategy_score(2, -0.5, 0)
    with pytest.raises(ValueError):
        strategy_score(2, 0.0, -1)


def test_score_converges_to_observed_rate():
    # With lots of data the survey prior washes out: all-"yes" -> ~1.0.
    assert strategy_score(1, 50.0, 50) == pytest.approx(
        (2.0 / 3.0 + 50.0) / 52.0, rel=1e-9
    )
    assert math.isclose(strategy_score(1, 200.0, 200), 1.0, abs_tol=0.01)
