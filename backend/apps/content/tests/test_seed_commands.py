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
