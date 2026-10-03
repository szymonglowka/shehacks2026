"""Onboarding options + complete per SPEC sections 5 and 7."""
import pytest

try:
    from apps.support.models import UserCopingPreference

    HAS_PREFS = True
except ImportError:
    HAS_PREFS = False

try:
    from apps.goals.models import Goal

    HAS_GOALS = True
except ImportError:
    HAS_GOALS = False


@pytest.fixture(autouse=True)
def goal_templates(db):
    """Options read templates from the DB once apps.goals is installed; seed them like seed_content does."""
    if HAS_GOALS:
        from django.core.management import call_command

        call_command("loaddata", "goal_templates", verbosity=0)


def test_options_returns_all_sections(auth_client):
    res = auth_client.get("/api/v1/onboarding/options")
    assert res.status_code == 200
    body = res.json()
    assert len(body["coping_strategies"]) >= 10
    assert len(body["worsening_factors"]) == 6
    assert len(body["goal_templates"]) >= 20
    assert body["coping_strategies"][0]["code"]
    assert body["goal_templates"][0]["title_pl"]


def test_options_filters_by_mode_week_and_delivery(auth_client):
    res = auth_client.get(
        "/api/v1/onboarding/options?mode=postpartum&week=4&delivery_type=cesarean"
    )
    assert res.status_code == 200
    templates = res.json()["goal_templates"]
    assert templates
    for t in templates:
        assert t["mode"] in ("postpartum", "both")


def test_complete_updates_profile_and_flag(auth_client, user):
    res = auth_client.post(
        "/api/v1/onboarding/complete",
        {
            "profile": {
                "display_name": "Ania",
                "mode": "postpartum",
                "delivery_type": "cesarean",
                "feeding": "breast",
                "tone": "gentle",
            },
            "worsening_factors": ["lack_of_sleep", "loneliness"],
            "coping_scores": {},
        },
        format="json",
    )
    assert res.status_code == 200, res.content
    user.profile.refresh_from_db()
    assert user.profile.onboarding_completed is True
    assert user.profile.delivery_type == "cesarean"
    assert user.profile.worsening_factors == ["lack_of_sleep", "loneliness"]


def test_complete_rejects_unknown_factor_atomically(auth_client, user):
    res = auth_client.post(
        "/api/v1/onboarding/complete",
        {"profile": {"display_name": "Ania"}, "worsening_factors": ["nope"]},
        format="json",
    )
    assert res.status_code == 400
    user.profile.refresh_from_db()
    assert user.profile.onboarding_completed is False
    assert user.profile.display_name != "Ania"


def test_complete_accepts_scores_contacts_goals_without_models(auth_client, user):
    # support/goals models are not merged yet: payload must be accepted and the
    # profile part applied; per-model assertions live in the xfail tests below.
    res = auth_client.post(
        "/api/v1/onboarding/complete",
        {
            "profile": {"display_name": "Ania"},
            "coping_scores": {"breathing_478": 3},
            "trusted_contact": {"name": "Tomek", "phone": "+48111222333"},
            "goal_template_ids": [1],
            "custom_goals": [{"title": "Spacer"}],
        },
        format="json",
    )
    assert res.status_code == 200, res.content
    user.profile.refresh_from_db()
    assert user.profile.onboarding_completed is True


@pytest.mark.xfail(not HAS_PREFS, reason="support models not merged yet", strict=False)
def test_complete_stores_coping_scores(auth_client, user):
    res = auth_client.post(
        "/api/v1/onboarding/complete",
        {"profile": {}, "coping_scores": {"breathing_478": 3}},
        format="json",
    )
    assert res.status_code == 200
    assert UserCopingPreference.objects.filter(user=user).count() >= 1


@pytest.mark.xfail(not HAS_GOALS, reason="goals models not merged yet", strict=False)
def test_complete_creates_goals(auth_client, user):
    res = auth_client.post(
        "/api/v1/onboarding/complete",
        {"profile": {}, "custom_goals": [{"title": "Spacer"}]},
        format="json",
    )
    assert res.status_code == 200
    assert Goal.objects.filter(user=user, title="Spacer").exists()
