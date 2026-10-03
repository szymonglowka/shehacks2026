"""Selectors owned by the tracking app.

selectors.latest_checkins(user, days) and selectors.mood_today(user)
are read by the circle app (public mood color) via try-import.
"""
from datetime import timedelta

from django.utils import timezone

from .models import DailyCheckIn


def latest_checkins(user, days=30):
    """Check-ins from the last `days` days, newest first."""
    since = timezone.localdate() - timedelta(days=days)
    return list(
        DailyCheckIn.objects.filter(user=user, date__gte=since).order_by("-date")
    )


def mood_today(user):
    """Today's mood (1-5) or None when no check-in was saved today."""
    checkin = DailyCheckIn.objects.filter(
        user=user, date=timezone.localdate()
    ).first()
    return checkin.mood if checkin is not None else None


def cycle_status_for(user, today=None):
    """SPEC §6.1 status payload for the user's mode (used by /cycle/status)."""
    from .cycle import PeriodInput, cycle_status, postpartum_status
    from .models import Period

    if today is None:
        today = timezone.localdate()
    profile = user.profile
    if profile.mode == "postpartum" and profile.birth_date is not None:
        status = postpartum_status(profile.birth_date, today)
        return {
            "mode": "postpartum",
            "days_since_birth": status.days_since_birth,
            "postpartum_week": status.postpartum_week,
            "stage": status.stage,
        }
    if profile.mode == "postpartum":
        return {"mode": "postpartum", "days_since_birth": None,
                "postpartum_week": None, "stage": None}
    periods = [
        PeriodInput(start_date=p.start_date, end_date=p.end_date)
        for p in Period.objects.filter(user=user).order_by("start_date")
    ]
    status = cycle_status(
        periods, profile.avg_cycle_length, profile.avg_period_length, today
    )
    if status is None:
        return {"mode": "cycle", "cycle_day": None, "phase": None,
                "next_period_date": None, "confidence": "low"}
    return {
        "mode": "cycle",
        "cycle_day": status.cycle_day,
        "phase": status.phase,
        "next_period_date": status.next_period_date.isoformat(),
        "confidence": status.confidence,
    }
