"""Selectors owned by the journal app (see AGENT_PROMPTS.md "shared names").

selectors.wins_count(user) is read by the dashboard (b-track) via try-import.
"""
from .models import SmallWin


def wins_count(user):
    """Number of small wins saved by the user (fills the wins jar)."""
    return SmallWin.objects.filter(user=user).count()
