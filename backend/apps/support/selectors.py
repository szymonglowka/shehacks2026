"""Selectors owned by the support app (see AGENT_PROMPTS.md "shared names").

selectors.top_strategies(user, n) is read by the dashboard (b-track) via
try-import. Ranking math lives in ranking.py (pure); this module only maps
ORM rows onto it.
"""
from .models import CopingStrategy, UserCopingPreference
from .ranking import RankedStrategy, rank_strategies


def _all_strategy_rows():
    return list(CopingStrategy.objects.all().order_by("id"))


def ranked_preferences(user):
    """(strategy, preference-or-None, score) for every strategy, best first."""
    prefs = {
        pref.strategy_id: pref
        for pref in UserCopingPreference.objects.filter(user=user).select_related(
            "strategy"
        )
    }
    strategies = _all_strategy_rows()
    ranked = rank_strategies(
        [
            RankedStrategy(
                code=s.code,
                survey_score=prefs[s.id].survey_score if s.id in prefs else 0,
                helped_score_sum=prefs[s.id].helped_score_sum if s.id in prefs else 0.0,
                used_count=prefs[s.id].used_count if s.id in prefs else 0,
            )
            for s in strategies
        ]
    )
    by_code = {s.code: s for s in strategies}
    return [
        (by_code[item.code], prefs.get(by_code[item.code].id), item.score)
        for item in ranked
    ]


def top_strategies(user, n=2):
    """Top-n CopingStrategy objects for the user (dashboard widget)."""
    return [strategy for strategy, _pref, _score in ranked_preferences(user)[:n]]
