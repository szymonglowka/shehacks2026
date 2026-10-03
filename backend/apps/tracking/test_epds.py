"""Unit tests for tracking/epds.py (SPEC §6.3)."""
from datetime import date, timedelta

import pytest

from . import epds
from .epds import is_due, score_answers


def test_ten_questions_with_citation():
    import inspect
    src = inspect.getsource(epds)
    assert "Cox" in src and "1987" in src
    assert len(epds.QUESTIONS) == 10
    assert [q.number for q in epds.QUESTIONS] == list(range(1, 11))
    for q in epds.QUESTIONS:
        assert len(q.options_pl) == 4 and len(q.options_en) == 4
        assert q.text_pl and q.text_en


def test_reverse_items_are_3_and_5_to_10():
    assert epds.REVERSED_NUMBERS == (3, 5, 6, 7, 8, 9, 10)


def test_all_best_answers_score_zero():
    # normal items: first option = 0; reversed: last option = 0
    answers = [0, 0, 3, 0, 3, 3, 3, 3, 3, 3]
    r = score_answers(answers)
    assert (r.total, r.self_harm_score, r.risk_level) == (0, 0, "low")


def test_all_worst_answers_score_thirty_urgent():
    answers = [3, 3, 0, 3, 0, 0, 0, 0, 0, 0]
    r = score_answers(answers)
    assert (r.total, r.self_harm_score, r.risk_level) == (30, 3, "urgent")


def test_reverse_scoring_spot_check():
    # Q3 reversed: option 0 -> 3; Q4 normal: option 0 -> 0
    r = score_answers([0, 0, 0, 0, 3, 3, 3, 3, 3, 3])
    assert r.total == 3  # only Q3 contributes


def test_bands():
    # build totals with Q1+Q2+Q4 normal items (options 0-3 = score) and
    # reversed items parked at score 0 (option 3), Q10 at 0.
    def total_of(q1, q2, q4):
        return score_answers([q1, q2, 3, q4, 3, 3, 3, 3, 3, 3]).total
    assert total_of(3, 3, 3) == 9
    # 3+3+2+3+1 = 12, Q10 parked at 0 -> moderate
    r = score_answers([3, 3, 1, 3, 2, 3, 3, 3, 3, 3])
    assert (r.total, r.risk_level) == (12, "moderate")
    # 3+3+2+3+2 = 13 -> high
    r = score_answers([3, 3, 1, 3, 1, 3, 3, 3, 3, 3])
    assert (r.total, r.risk_level) == (13, "high")


def test_self_harm_drives_urgent_regardless_of_total():
    # Q10 option 2 ("Rzadko") -> score 1, everything else 0
    r = score_answers([0, 0, 3, 0, 3, 3, 3, 3, 3, 2])
    assert (r.total, r.self_harm_score, r.risk_level) == (1, 1, "urgent")


def test_validation():
    with pytest.raises(ValueError):
        score_answers([0] * 9)
    with pytest.raises(ValueError):
        score_answers([0] * 11)
    with pytest.raises(ValueError):
        score_answers([0] * 9 + [4])


def test_localized_shapes():
    pl = epds.get_questions("pl")
    en = epds.get_questions("en")
    assert len(pl) == len(en) == 10
    assert pl[0]["text"] != en[0]["text"]
    assert all(set(q) == {"number", "text", "options"} for q in pl + en)
    assert all(len(q["options"]) == 4 for q in pl + en)


class TestDue:
    today = date(2026, 10, 3)

    def test_postpartum_never_filled_is_due(self):
        assert is_due("postpartum", None, self.today) is True

    def test_postpartum_14_days_is_due_13_is_not(self):
        assert is_due("postpartum", self.today - timedelta(days=14), self.today) is True
        assert is_due("postpartum", self.today - timedelta(days=13), self.today) is False
        assert is_due("postpartum", self.today, self.today) is False

    def test_cycle_mode_never_due(self):
        assert is_due("cycle", None, self.today) is False
        assert is_due("cycle", self.today - timedelta(days=60), self.today) is False
