"""Celery task tests: freezegun for the +/-1 min window, webpush mocked.

tracking.DailyCheckIn / EPDSAssessment models are not merged yet, so the
check-in, EPDS and nudge tasks must degrade to "nothing due" (covered here);
the pure epds_due rule and the goal-reminder path run for real.
"""
from datetime import date, datetime, time, timedelta
from unittest.mock import patch
from zoneinfo import ZoneInfo

import pytest
from django.utils import timezone
from freezegun import freeze_time

from apps.goals.models import Goal, GoalLog
from apps.notifications.models import Notification
from apps.notifications.tasks import (
    epds_due,
    send_checkin_reminders,
    send_due_goal_reminders,
    send_epds_due,
    send_gentle_nudges,
)

# 2026-09-28 is a Monday. Frozen UTC 20:00 == 22:00 in Europe/Warsaw (CEST).
FROZEN_UTC = "2026-09-28 20:00:00"
WARSAW = ZoneInfo("Europe/Warsaw")


@pytest.fixture
def reminder_goal(user):
    profile = user.profile
    profile.timezone = "Europe/Warsaw"
    profile.save()
    return Goal.objects.create(
        user=user,
        title="Evening walk",
        frequency="daily",
        reminder_enabled=True,
        reminder_time=time(22, 0),
        reminder_weekdays=[0],  # Monday
    )


@freeze_time(FROZEN_UTC)
def test_goal_reminder_fires_in_window(user, reminder_goal):
    with patch("apps.notifications.push.send_push_to_user", return_value=1):
        result = send_due_goal_reminders()
    assert result == {"sent": 1}
    note = Notification.objects.get()
    assert note.kind == "goal_reminder"
    assert note.url == f"/goals?goal={reminder_goal.id}"


@freeze_time(FROZEN_UTC)
def test_goal_reminder_idempotent_same_day(user, reminder_goal):
    with patch("apps.notifications.push.send_push_to_user", return_value=1):
        assert send_due_goal_reminders() == {"sent": 1}
        assert send_due_goal_reminders() == {"sent": 0}


@freeze_time(FROZEN_UTC)
def test_goal_reminder_skips_when_logged(user, reminder_goal):
    GoalLog.objects.create(goal=reminder_goal, date=date(2026, 9, 28), completed=True)
    with patch("apps.notifications.push.send_push_to_user", return_value=1):
        assert send_due_goal_reminders() == {"sent": 0}


@freeze_time("2026-09-28 20:05:00")  # 22:05 Warsaw: outside the +/-1 min window
def test_goal_reminder_outside_window(user, reminder_goal):
    with patch("apps.notifications.push.send_push_to_user", return_value=1):
        assert send_due_goal_reminders() == {"sent": 0}


@freeze_time("2026-09-29 20:00:00")  # Tuesday: weekday mismatch
def test_goal_reminder_wrong_weekday(user, reminder_goal):
    with patch("apps.notifications.push.send_push_to_user", return_value=1):
        assert send_due_goal_reminders() == {"sent": 0}


@freeze_time(FROZEN_UTC)
def test_goal_reminder_disabled_or_no_time(user):
    Goal.objects.create(user=user, title="Off", reminder_enabled=False)
    Goal.objects.create(
        user=user, title="No time", reminder_enabled=True, reminder_time=None
    )
    with patch("apps.notifications.push.send_push_to_user", return_value=1):
        assert send_due_goal_reminders() == {"sent": 0}


def test_epds_due_rule():
    old = datetime(2026, 9, 1, 10, 0, tzinfo=WARSAW)
    assert epds_due(None, date(2026, 9, 28)) is True
    assert epds_due(old, date(2026, 9, 28)) is True  # 27 days ago
    recent = datetime(2026, 9, 20, 10, 0, tzinfo=WARSAW)
    assert epds_due(recent, date(2026, 9, 28)) is False  # 8 days ago


def test_checkin_and_epds_tasks_run_against_tracking_models(user):
    # tracking models are merged now, so the tasks must no longer report "skipped"
    with patch("apps.notifications.push.send_push_to_user", return_value=1):
        assert "skipped" not in send_checkin_reminders()
        assert "skipped" not in send_epds_due()


@freeze_time(FROZEN_UTC)
def test_gentle_nudge_skipped_without_moods(user):
    with patch("apps.notifications.push.send_push_to_user", return_value=1):
        assert send_gentle_nudges() == {"sent": 0}
    assert Notification.objects.count() == 0


@freeze_time(FROZEN_UTC)
def test_gentle_nudge_throttle_48h(user):
    Notification.objects.create(
        user=user,
        kind="gentle_nudge",
        title="T",
        body="B",
        sent_at=timezone.now() - timedelta(hours=2),
    )
    with patch("apps.notifications.push.send_push_to_user") as mocked:
        assert send_gentle_nudges() == {"sent": 0}
        mocked.assert_not_called()
