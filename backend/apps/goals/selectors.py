"""Selectors owned by the goals app (see AGENT_PROMPTS.md "shared names").

selectors.today_goals(user) is read by the dashboard (b-track) via try-import.
"""
from .models import Goal


def today_goals(user):
    """Active goals of the user, oldest first."""
    return list(Goal.objects.filter(user=user, is_active=True).order_by("created_at"))
