"""Unit tests for tracking/cycle.py (SPEC §6.1)."""
from datetime import date, timedelta

import cycle


def d(iso):
    return date.fromisoformat(iso)


class TestPostpartum:
    def test_day_zero_is_week1_early(self):
        s = cycle.postpartum_status(d("2026-09-01"), d("2026-09-01"))
        assert (s.days_since_birth, s.postpartum_week, s.stage) == (0, 1, "early")

    def test_week_boundaries(self):
        b = d("2026-09-01")
        assert cycle.postpartum_status(b, b + timedelta(days=6)).postpartum_week == 1
        assert cycle.postpartum_status(b, b + timedelta(days=7)).postpartum_week == 2
        assert cycle.postpartum_status(b, b + timedelta(days=39)).postpartum_week == 6

    def test_stage_edges(self):
        b = d("2026-09-01")
        assert cycle.postpartum_status(b, b + timedelta(days=14)).stage == "early"
        assert cycle.postpartum_status(b, b + timedelta(days=15)).stage == "recovery"
        assert cycle.postpartum_status(b, b + timedelta(days=42)).stage == "recovery"
        assert cycle.postpartum_status(b, b + timedelta(days=43)).stage == "beyond"

    def test_future_birth_clamped(self):
        s = cycle.postpartum_status(d("2026-10-10"), d("2026-10-01"))
        assert (s.days_since_birth, s.postpartum_week, s.stage) == (0, 1, "early")


class TestCycle:
    def _periods(self):
        return [
            cycle.PeriodInput(d("2026-07-01"), d("2026-07-05")),
            cycle.PeriodInput(d("2026-07-29"), d("2026-08-02")),
            cycle.PeriodInput(d("2026-08-26"), d("2026-08-30")),
        ]

    def test_no_periods_returns_none(self):
        assert cycle.cycle_status([], 28, 5, d("2026-09-01")) is None

    def test_single_period_uses_profile_avg_low_confidence(self):
        s = cycle.cycle_status(
            [cycle.PeriodInput(d("2026-08-20"), d("2026-08-24"))],
            28, 5, d("2026-08-22"),
        )
        assert s.cycle_day == 3
        assert s.phase == "menstrual"
        assert s.next_period_date == d("2026-09-17")
        assert s.confidence == "low"
        assert s.avg_cycle_used == 28

    def test_observed_average_and_phases(self):
        # gaps 28, 28 -> avg 28; ovulation day 14
        ps = self._periods()
        s = cycle.cycle_status(ps, 30, 5, d("2026-08-26"))
        assert (s.cycle_day, s.phase) == (1, "menstrual")
        assert s.confidence == "medium"
        assert s.avg_cycle_used == 28.0
        assert s.next_period_date == d("2026-09-23")
        assert cycle.cycle_status(ps, 30, 5, d("2026-09-01")).phase == "follicular"
        assert cycle.cycle_status(ps, 30, 5, d("2026-09-08")).phase == "ovulation"
        assert cycle.cycle_status(ps, 30, 5, d("2026-09-09")).phase == "ovulation"
        assert cycle.cycle_status(ps, 30, 5, d("2026-09-10")).phase == "luteal"
        assert cycle.cycle_status(ps, 30, 5, d("2026-09-12")).phase == "luteal"

    def test_confidence_high_with_four_periods(self):
        ps = self._periods() + [cycle.PeriodInput(d("2026-09-23"), d("2026-09-27"))]
        s = cycle.cycle_status(ps, 28, 5, d("2026-09-24"))
        assert s.confidence == "high"

    def test_open_period_falls_back_to_profile_length(self):
        s = cycle.cycle_status(
            [cycle.PeriodInput(d("2026-08-20"), None)], 28, 6, d("2026-08-27")
        )
        assert s.period_length_used == 6
        assert s.phase == "follicular"  # day 8, ovulation day 14

    def test_overdue_day_stays_luteal(self):
        ps = self._periods()
        s = cycle.cycle_status(ps, 30, 5, d("2026-09-30"))  # day 36 > 28
        assert s.cycle_day == 36
        assert s.phase == "luteal"

    def test_unsorted_input_and_ignored_order(self):
        ps = list(reversed(self._periods()))
        s = cycle.cycle_status(ps, 30, 5, d("2026-08-26"))
        assert (s.cycle_day, s.avg_cycle_used) == (1, 28.0)
