"""Bayesian ranking of coping strategies (SPEC section 5, W1 adaptive toolkit).

Ranking formula (SPEC section 5, ``UserCopingPreference``)::

    score = (survey_score / 3 * 2 + helped_score_sum) / (2 + used_count)

i.e. a Bayesian average with the onboarding-survey answer as the prior
(worth 2 observations). Feedback mapping: yes = 1, somewhat = 0.5, no = 0.

Strategies with ``survey_score == 0`` and ``used_count == 0`` sort last,
so "not for me, never tried" never outranks anything with real signal.

This module is Django-free on purpose: it works on plain values /
dataclasses so it can be unit-tested without a database.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Literal

Helped = Literal["yes", "somewhat", "no"]

#: Feedback label -> numeric value added to ``helped_score_sum``.
FEEDBACK_VALUES: dict[str, float] = {
    "yes": 1.0,
    "somewhat": 0.5,
    "no": 0.0,
}

#: Weight of the survey prior, expressed in pseudo-observations.
PRIOR_WEIGHT = 2.0


def feedback_value(helped: Helped | None) -> float:
    """Numeric value of one feedback answer (None = no feedback given)."""
    if helped is None:
        return 0.0
    try:
        return FEEDBACK_VALUES[helped]
    except KeyError:
        raise ValueError(f"unknown feedback: {helped!r}") from None


def validate_survey_score(survey_score: int) -> int:
    if survey_score not in (0, 1, 2, 3):
        raise ValueError(f"survey_score must be 0-3, got {survey_score!r}")
    return survey_score


def strategy_score(
    survey_score: int,
    helped_score_sum: float = 0.0,
    used_count: int = 0,
) -> float:
    """Bayesian score for one strategy (higher = rank higher)."""
    validate_survey_score(survey_score)
    if used_count < 0:
        raise ValueError(f"used_count must be >= 0, got {used_count!r}")
    if helped_score_sum < 0:
        raise ValueError(f"helped_score_sum must be >= 0, got {helped_score_sum!r}")
    prior = survey_score / 3 * PRIOR_WEIGHT
    return (prior + helped_score_sum) / (PRIOR_WEIGHT + used_count)


def apply_feedback(
    survey_score: int,
    helped_score_sum: float,
    used_count: int,
    helped: Helped | None,
) -> tuple[float, int]:
    """Return ``(new_helped_score_sum, new_used_count)`` after one session.

    A session without feedback (``helped=None``) still counts as a use --
    trying something that gave no signal is weak negative evidence via the
    growing denominator.
    """
    validate_survey_score(survey_score)
    if helped is None:
        return helped_score_sum, used_count + 1
    return helped_score_sum + feedback_value(helped), used_count + 1


@dataclass
class RankedStrategy:
    code: str
    survey_score: int
    helped_score_sum: float = 0.0
    used_count: int = 0
    score: float = field(init=False)

    def __post_init__(self) -> None:
        self.score = strategy_score(
            self.survey_score, self.helped_score_sum, self.used_count
        )

    @property
    def is_untried_rejected(self) -> bool:
        """True for survey 0 + never used: these always sort last."""
        return self.survey_score == 0 and self.used_count == 0


def rank_strategies(
    strategies: Iterable[RankedStrategy],
) -> list[RankedStrategy]:
    """Sort best-first; untried-and-rejected strategies go last (by code)."""
    items = list(strategies)
    return sorted(
        items,
        key=lambda s: (s.is_untried_rejected, -s.score, s.code),
    )
