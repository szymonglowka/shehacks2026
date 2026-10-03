"""Seed idempotency tests: both commands run twice without duplicates."""
from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.utils import timezone

from apps.content.models import Article, Specialist
from apps.goals.models import Goal, GoalLog, GoalTemplate


@pytest.mark.django_db
def test_seed_content_twice_no_duplicates():
    call_command("seed_content")
    call_command("seed_content")
    assert Article.objects.count() == 16
    assert Specialist.objects.count() == 10
    assert GoalTemplate.objects.count() == 25
    article = Article.objects.get(slug="jak-wspierac-mame")
    assert "Biorę to" in article.body_pl


@pytest.mark.django_db
def test_seed_demo_twice_no_duplicates():
    call_command("seed_demo")
    call_command("seed_demo")
    User = get_user_model()
    assert User.objects.filter(email="demo@otula.app").count() == 1
    assert User.objects.filter(email="demo-cycle@otula.app").count() == 1
    assert User.objects.filter(email__startswith="demo-night-").count() == 12
    marta = User.objects.get(email="demo@otula.app")
    assert marta.profile.delivery_type == "cesarean"
    assert marta.profile.feeding == "breast"
    assert marta.profile.birth_date == timezone.localdate() - timedelta(days=39)
    assert marta.check_password("otula-demo-1234")
    assert Goal.objects.filter(user=marta).count() == 5
    first_logs = GoalLog.objects.filter(goal__user=marta).count()
    assert first_logs > 0
    call_command("seed_demo")
    assert Goal.objects.filter(user=marta).count() == 5
    assert GoalLog.objects.filter(goal__user=marta).count() == first_logs


@pytest.mark.django_db
def test_seed_demo_marta_story():
    from apps.circle.models import CareRequest
    from apps.journal.models import SmallWin, VisitQuestion
    from apps.support.models import SupportSession, TrustedContact, UserCopingPreference
    from apps.tracking.models import DailyCheckIn, EPDSAssessment, Period

    call_command("seed_demo")
    User = get_user_model()
    marta = User.objects.get(email="demo@otula.app")
    today = timezone.localdate()

    checkins = DailyCheckIn.objects.filter(user=marta)
    assert checkins.count() == 40
    assert checkins.filter(date=today).count() == 1
    assert checkins.exclude(symptoms=[]).count() > 20
    assert checkins.exclude(red_flags=[]).count() == 0
    dip = checkins.filter(date__gte=today - timedelta(days=32),
                          date__lte=today - timedelta(days=18))
    assert sum(c.mood for c in dip) / dip.count() < 2.6

    totals = list(
        EPDSAssessment.objects.filter(user=marta).order_by("created_at")
        .values_list("total", flat=True)
    )
    assert totals == [14, 11, 8]

    sessions = SupportSession.objects.filter(user=marta)
    assert sessions.count() == 6
    assert {s.strategy.code for s in sessions.select_related("strategy")} == {
        "short_walk", "micro_rest", "breathing_478",
    }
    walk = UserCopingPreference.objects.get(
        user=marta, strategy__code="short_walk")
    assert walk.used_count == 4
    assert walk.helped_score_sum == 3.5
    top = max(
        UserCopingPreference.objects.filter(user=marta).select_related("strategy"),
        key=lambda p: (p.survey_score / 3 * 2 + p.helped_score_sum) / (2 + p.used_count),
    )
    assert top.strategy.code == "short_walk"

    tomek = TrustedContact.objects.get(user=marta, name="Tomek")
    assert tomek.preferred_channel == "whatsapp"
    assert tomek.phone == "+48 600 000 000"

    requests = CareRequest.objects.filter(user=marta)
    assert requests.count() == 4
    assert requests.filter(status="claimed", claimed_by_name="Tomek").count() == 1
    assert requests.filter(status="done").count() == 1

    assert SmallWin.objects.filter(user=marta).count() == 9
    assert VisitQuestion.objects.filter(user=marta).count() == 5

    kasia = User.objects.get(email="demo-cycle@otula.app")
    assert Period.objects.filter(user=kasia).count() == 4

    # Idempotent across all story rows.
    snapshot = (
        checkins.count(),
        sessions.count(),
        UserCopingPreference.objects.filter(user=marta).count(),
        requests.count(),
    )
    call_command("seed_demo")
    assert DailyCheckIn.objects.filter(user=marta).count() == snapshot[0]
    assert SupportSession.objects.filter(user=marta).count() == snapshot[1]
    assert UserCopingPreference.objects.filter(user=marta).count() == snapshot[2]
    assert CareRequest.objects.filter(user=marta).count() == snapshot[3]


@pytest.mark.django_db
def test_seed_demo_no_today_flag():
    from apps.tracking.models import DailyCheckIn

    call_command("seed_demo")
    User = get_user_model()
    marta = User.objects.get(email="demo@otula.app")
    today = timezone.localdate()
    assert DailyCheckIn.objects.filter(user=marta, date=today).count() == 1
    call_command("seed_demo", no_today=True)
    assert DailyCheckIn.objects.filter(user=marta).count() == 39
    assert DailyCheckIn.objects.filter(user=marta, date=today).count() == 0
    call_command("seed_demo")
    assert DailyCheckIn.objects.filter(user=marta, date=today).count() == 1
