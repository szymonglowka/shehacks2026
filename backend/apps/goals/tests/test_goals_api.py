"""Goals API tests: CRUD, streak fields, log, today, recommended, isolation."""
from datetime import timedelta

import pytest
from django.utils import timezone

from apps.goals.models import Goal, GoalLog, GoalTemplate

TODAY = timezone.localdate()
YESTERDAY = TODAY - timedelta(days=1)


@pytest.fixture
def goal(user):
    return Goal.objects.create(user=user, title="Water", frequency="daily")


def test_create_goal(auth_client):
    response = auth_client.post(
        "/api/v1/goals",
        {"title": "Walk", "frequency": "weekly", "target_count": 3},
        format="json",
    )
    assert response.status_code == 201, response.content
    body = response.json()
    assert body["title"] == "Walk"
    assert body["current_streak"] == 0
    assert body["done_today"] is False
    assert body["progress_this_week"] == {"done": 0, "target": 3, "remaining": 3}
    assert body["is_active"] is True


def test_goal_stats_fields_from_logs(auth_client, user, goal):
    GoalLog.objects.create(goal=goal, date=YESTERDAY, completed=True)
    GoalLog.objects.create(goal=goal, date=TODAY, completed=True)
    body = auth_client.get(f"/api/v1/goals/{goal.pk}").json()
    assert body["current_streak"] == 2
    assert body["done_today"] is True
    assert body["progress_this_week"]["done"] == 2


def test_update_and_delete_goal(auth_client, goal):
    assert auth_client.patch(
        f"/api/v1/goals/{goal.pk}", {"title": "Tea"}, format="json"
    ).status_code == 200
    goal.refresh_from_db()
    assert goal.title == "Tea"
    assert auth_client.delete(f"/api/v1/goals/{goal.pk}").status_code == 204
    assert Goal.objects.count() == 0


def test_log_upsert_and_uncomplete(auth_client, goal):
    url = f"/api/v1/goals/{goal.pk}/log"
    assert (
        auth_client.post(url, {"date": str(TODAY), "completed": True}, format="json").status_code
        == 200
    )
    assert (
        auth_client.post(url, {"date": str(TODAY), "completed": True}, format="json").status_code
        == 200
    )
    assert GoalLog.objects.filter(goal=goal).count() == 1
    auth_client.post(url, {"date": str(TODAY), "completed": False}, format="json")
    assert auth_client.get(f"/api/v1/goals/{goal.pk}").json()["done_today"] is False


def test_log_defaults_to_today(auth_client, goal):
    response = auth_client.post(
        f"/api/v1/goals/{goal.pk}/log", {"completed": True}, format="json"
    )
    assert response.status_code == 200
    assert response.json()["date"] == str(TODAY)


def test_today_lists_only_active(auth_client, user):
    Goal.objects.create(user=user, title="Active")
    Goal.objects.create(user=user, title="Archived", is_active=False)
    body = auth_client.get("/api/v1/goals/today").json()
    assert [g["title"] for g in body] == ["Active"]


@pytest.fixture
def templates():
    walk = GoalTemplate.objects.create(
        title_pl="Spacer",
        title_en="Walk",
        description_pl="",
        description_en="",
        category="movement",
        mode="postpartum",
        min_week=2,
        max_week=12,
        delivery_types=[],
        frequency="daily",
    )
    scar = GoalTemplate.objects.create(
        title_pl="Blizna",
        title_en="Scar",
        description_pl="",
        description_en="",
        category="recovery",
        mode="postpartum",
        min_week=6,
        max_week=52,
        delivery_types=["cesarean"],
        frequency="weekly",
        target_count=3,
    )
    cycle = GoalTemplate.objects.create(
        title_pl="Cykl",
        title_en="Cycle",
        description_pl="",
        description_en="",
        category="mind",
        mode="cycle",
        delivery_types=[],
        frequency="daily",
    )
    return walk, scar, cycle


def test_recommended_filters_and_localizes(auth_client, user, templates):
    walk, _scar, _ = templates
    profile = user.profile
    profile.mode = "postpartum"
    profile.birth_date = TODAY - timedelta(days=30)  # week 5
    profile.delivery_type = "vaginal"
    profile.save()
    body = auth_client.get("/api/v1/goals/recommended").json()
    titles = [t["title"] for t in body]
    assert "Spacer" in titles  # week 5 in 2..12, all delivery types
    assert "Blizna" not in titles  # cesarean-only + week 6+
    assert "Cykl" not in titles  # wrong mode
    # English localization via header.
    body_en = auth_client.get(
        "/api/v1/goals/recommended", HTTP_ACCEPT_LANGUAGE="en"
    ).json()
    assert "Walk" in [t["title"] for t in body_en]
    # Added templates are excluded.
    Goal.objects.create(user=user, title="Mine", template=walk)
    body_after = auth_client.get("/api/v1/goals/recommended").json()
    assert "Spacer" not in [t["title"] for t in body_after]


def test_goals_isolation(auth_client, user, goal):
    from apps.common.factories import UserFactory

    other = UserFactory()
    other_goal = Goal.objects.create(user=other, title="Theirs")
    assert auth_client.get(f"/api/v1/goals/{other_goal.pk}").status_code == 404
    assert auth_client.post(
        f"/api/v1/goals/{other_goal.pk}/log", {"completed": True}, format="json"
    ).status_code == 404
    assert {g["id"] for g in auth_client.get("/api/v1/goals").json()} == {goal.pk}


def test_goals_require_auth(api_client, goal):
    assert api_client.get("/api/v1/goals").status_code == 401
    assert api_client.get("/api/v1/goals/today").status_code == 401
    assert api_client.get("/api/v1/goals/recommended").status_code == 401


def test_today_goals_selector(user):
    from apps.goals.selectors import today_goals

    active = Goal.objects.create(user=user, title="Active")
    Goal.objects.create(user=user, title="Off", is_active=False)
    assert [g.pk for g in today_goals(user)] == [active.pk]


def test_goal_templates_fixture_loads(db):
    from django.core.management import call_command

    call_command("loaddata", "apps/goals/fixtures/goal_templates.json", verbosity=0)
    assert GoalTemplate.objects.count() == 25
    templates = list(GoalTemplate.objects.all())
    assert sum("cesarean" in t.delivery_types for t in templates) >= 2
    assert any(t.mode == "cycle" for t in templates)
    assert any(t.mode == "postpartum" for t in templates)


def test_export_user_data(user, goal):
    from apps.goals.export import export_user_data

    GoalLog.objects.create(goal=goal, date=TODAY, completed=True)
    data = export_user_data(user)
    assert len(data["goals"]) == 1
    assert data["goals"][0]["logs"] == [{"date": str(TODAY), "completed": True}]
    assert timezone.now()  # sanity: tz-aware env works
