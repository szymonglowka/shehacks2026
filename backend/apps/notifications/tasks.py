"""Scheduled reminders (SPEC section 6.5; beat schedule lives in settings).

All tasks are idempotent (one notification per user/kind/day, 48 h throttle
for nudges), timezone-aware per user, and resilient: per-user failures are
logged and skipped, and tracking models that are not merged yet are treated
as "nothing due" instead of errors. Cross-app reads use the owning app's
models directly until its selectors exist.  # TODO selector
"""
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from celery import shared_task
from django.apps import apps
from django.utils import timezone

from apps.notifications.services import notify
from apps.notifications.texts import get_copy

logger = logging.getLogger(__name__)

GOALS_URL = "/goals"
CHECKIN_URL = "/today"
EPDS_URL = "/epds"
NUDGE_URL = "/support"
NOTIFICATIONS_URL = "/notifications"

EPDS_DUE_DAYS = 14
NUDGE_THROTTLE_HOURS = 48


def _user_now(tzname):
    try:
        tz = ZoneInfo(tzname or "Europe/Warsaw")
    except (ZoneInfoNotFoundError, ValueError):
        tz = ZoneInfo("Europe/Warsaw")
    return timezone.now().astimezone(tz)


def _in_window(now_time, target_time, minutes=1):
    """True when two times-of-day differ by at most ``minutes`` (SPEC: +/-1 min)."""
    if target_time is None:
        return False
    now_min = now_time.hour * 60 + now_time.minute
    target_min = target_time.hour * 60 + target_time.minute
    return abs(now_min - target_min) <= minutes


def _notified_since(user, kind, since, url=None):
    from apps.notifications.models import Notification

    query = Notification.objects.filter(
        user=user, kind=kind, created_at__gte=since
    )
    if url is not None:
        query = query.filter(url=url)
    return query.exists()


def _notified_today(user, kind, today, url=None):
    start = datetime(today.year, today.month, today.day, tzinfo=today.tzinfo)
    return _notified_since(user, kind, start, url)


def _render(user, kind):
    profile = getattr(user, "profile", None)
    tone = getattr(profile, "tone", "gentle") or "gentle"
    lang = getattr(profile, "language", "pl") or "pl"
    name = getattr(profile, "display_name", "") or ""
    return get_copy(kind, tone=tone, lang=lang, name=name)


def _iter_profiles():
    from apps.accounts.models import Profile

    return Profile.objects.select_related("user").all()


def epds_due(last_at, today):
    """Pure due rule (SPEC 6.3): no EPDS yet, or last one >= 14 days ago.

    ``last_at`` is a timezone-aware datetime or None; ``today`` a date.
    """
    if last_at is None:
        return True
    return (today - last_at.date()).days >= EPDS_DUE_DAYS


@shared_task(name="apps.notifications.tasks.send_due_goal_reminders")
def send_due_goal_reminders():
    from apps.goals.models import Goal

    sent = 0
    for profile in _iter_profiles():
        user = profile.user
        try:
            now = _user_now(profile.timezone)
            goals = Goal.objects.filter(
                user=user, is_active=True, reminder_enabled=True
            ).prefetch_related("logs")
            for goal in goals:
                if not _in_window(now.timetz(), goal.reminder_time):
                    continue
                if goal.reminder_weekdays and now.weekday() not in goal.reminder_weekdays:
                    continue
                if goal.logs.filter(date=now.date(), completed=True).exists():
                    continue
                url = f"{GOALS_URL}?goal={goal.id}"
                if _notified_today(user, "goal_reminder", now, url):
                    continue
                texts = _render(user, "goal_reminder")
                notify(user, "goal_reminder", texts["title"], texts["body"], url)
                sent += 1
        except Exception:
            logger.exception("send_due_goal_reminders failed for user %s", user.pk)
    return {"sent": sent}


@shared_task(name="apps.notifications.tasks.send_checkin_reminders")
def send_checkin_reminders():
    try:
        DailyCheckIn = apps.get_model("tracking", "DailyCheckIn")
    except LookupError:
        return {"sent": 0, "skipped": "tracking.DailyCheckIn missing"}
    sent = 0
    for profile in _iter_profiles():
        user = profile.user
        try:
            if not profile.checkin_reminder_time:
                continue
            now = _user_now(profile.timezone)
            if not _in_window(now.timetz(), profile.checkin_reminder_time):
                continue
            if DailyCheckIn.objects.filter(user=user, date=now.date()).exists():
                continue
            if _notified_today(user, "checkin_reminder", now, CHECKIN_URL):
                continue
            texts = _render(user, "checkin_reminder")
            notify(user, "checkin_reminder", texts["title"], texts["body"], CHECKIN_URL)
            sent += 1
        except Exception:
            logger.exception("send_checkin_reminders failed for user %s", user.pk)
    return {"sent": sent}


@shared_task(name="apps.notifications.tasks.send_epds_due")
def send_epds_due():
    try:
        EPDSAssessment = apps.get_model("tracking", "EPDSAssessment")
    except LookupError:
        return {"sent": 0, "skipped": "tracking.EPDSAssessment missing"}
    sent = 0
    for profile in _iter_profiles():
        user = profile.user
        try:
            if profile.mode != "postpartum":
                continue
            now = _user_now(profile.timezone)
            if now.hour != 10:
                continue
            last = (
                EPDSAssessment.objects.filter(user=user)
                .order_by("-created_at")
                .first()
            )
            last_at = last.created_at.astimezone(now.tzinfo) if last else None
            if not epds_due(last_at, now.date()):
                continue
            if _notified_today(user, "epds_due", now, EPDS_URL):
                continue
            texts = _render(user, "epds_due")
            notify(user, "epds_due", texts["title"], texts["body"], EPDS_URL)
            sent += 1
        except Exception:
            logger.exception("send_epds_due failed for user %s", user.pk)
    return {"sent": sent}


def _r5_holds(user):
    """True when the last-4-check-ins rule R5 holds (SPEC 6.2)."""
    try:
        from apps.tracking.risk import RiskContext, evaluate_risk
    except ImportError:
        return False
    try:
        DailyCheckIn = apps.get_model("tracking", "DailyCheckIn")
    except LookupError:
        return False
    moods = list(
        DailyCheckIn.objects.filter(user=user)
        .order_by("-date")
        .values_list("mood", flat=True)[:4]
    )
    if len(moods) < 4:
        return False
    moods = tuple(reversed(moods))  # oldest -> newest
    result = evaluate_risk(RiskContext(recent_moods=moods))
    return "R5" in result.reasons


@shared_task(name="apps.notifications.tasks.send_gentle_nudges")
def send_gentle_nudges():
    sent = 0
    for profile in _iter_profiles():
        user = profile.user
        try:
            cutoff = timezone.now() - timedelta(hours=NUDGE_THROTTLE_HOURS)
            if _notified_since(user, "gentle_nudge", cutoff):
                continue
            if not _r5_holds(user):
                continue
            texts = _render(user, "gentle_nudge")
            notify(user, "gentle_nudge", texts["title"], texts["body"], NUDGE_URL)
            sent += 1
        except Exception:
            logger.exception("send_gentle_nudges failed for user %s", user.pk)
    return {"sent": sent}
