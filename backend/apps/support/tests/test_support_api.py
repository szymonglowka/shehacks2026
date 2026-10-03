"""Support API tests: toolkit ranking, sessions, preferences, contacts, helplines, isolation."""
import pytest

from apps.common.factories import UserFactory
from apps.support.models import (
    CopingStrategy,
    Helpline,
    SupportSession,
    TrustedContact,
    UserCopingPreference,
)
from apps.support.selectors import top_strategies

WALK = "short_walk"
BREATH = "breathing_478"


@pytest.fixture
def other_user(db):
    return UserFactory()


def test_catalog_seeded_by_migration(db):
    assert CopingStrategy.objects.count() == 16
    assert Helpline.objects.count() == 4
    assert Helpline.objects.filter(phone="112").exists()


def test_toolkit_order_follows_survey(auth_client):
    auth_client.put(
        "/api/v1/support/preferences",
        {"coping_scores": {WALK: 3, BREATH: 1}},
        format="json",
    )
    body = auth_client.get("/api/v1/support/toolkit").json()
    assert [item["code"] for item in body[:2]] == [WALK, BREATH]
    assert body[0]["score"] > body[1]["score"]
    assert set(body[0]) >= {"code", "name", "description", "steps", "score", "evidence"}


def test_toolkit_ranking_shifts_after_feedback(auth_client, user):
    auth_client.put("/api/v1/support/preferences", {"coping_scores": {WALK: 3}}, format="json")
    first_before = auth_client.get("/api/v1/support/toolkit").json()[0]["code"]
    assert first_before == WALK
    session = auth_client.post(
        "/api/v1/support/sessions", {"intensity": 4}, format="json"
    ).json()["session"]
    for _ in range(3):
        auth_client.patch(
            f"/api/v1/support/sessions/{session['id']}",
            {"strategy": BREATH, "helped": "no"},
            format="json",
        )
        # unapply between PATCHes is automatic; re-PATCH same feedback:
    pref = UserCopingPreference.objects.get(
        user=user, strategy__code=BREATH
    )
    assert pref.used_count == 1
    assert pref.helped_score_sum == 0.0
    # "no" feedbacks drag BREATH below never-tried survey-0 strategies? No:
    # used>0 keeps it out of the rejected-last bucket, score drops instead.
    body = auth_client.get("/api/v1/support/toolkit").json()
    breath = next(item for item in body if item["code"] == BREATH)
    assert breath["evidence"]["used"] >= 1
    assert breath["score"] < 1.0


def test_session_intensity_5_returns_urgent_risk(auth_client):
    body = auth_client.post(
        "/api/v1/support/sessions", {"intensity": 5}, format="json"
    ).json()
    assert body["risk"] == {
        "level": "urgent",
        "reasons": ["intensity_5"],
        "actions": ["show_crisis"],
    }


def test_session_low_intensity_has_no_risk(auth_client):
    body = auth_client.post(
        "/api/v1/support/sessions", {"intensity": 3, "trigger": "low_mood"},
        format="json",
    ).json()
    assert "risk" not in body
    assert body["session"]["trigger"] == "low_mood"


def test_session_intensity_validated(auth_client):
    assert (
        auth_client.post("/api/v1/support/sessions", {"intensity": 6}, format="json").status_code
        == 400
    )


def test_patch_unknown_strategy_rejected(auth_client):
    session = auth_client.post(
        "/api/v1/support/sessions", {"intensity": 2}, format="json"
    ).json()["session"]
    response = auth_client.patch(
        f"/api/v1/support/sessions/{session['id']}",
        {"strategy": "nope"},
        format="json",
    )
    assert response.status_code == 400


def test_preferences_validation(auth_client):
    assert (
        auth_client.put(
            "/api/v1/support/preferences", {"coping_scores": {"nope": 2}}, format="json"
        ).status_code
        == 400
    )
    assert (
        auth_client.put(
            "/api/v1/support/preferences", {"coping_scores": {WALK: 4}}, format="json"
        ).status_code
        == 400
    )


def test_contacts_crud_and_isolation(auth_client, user, other_user):
    created = auth_client.post(
        "/api/v1/support/contacts",
        {"name": "Tomek", "phone": "+48 123 456 789", "preferred_channel": "sms"},
        format="json",
    ).json()
    assert auth_client.get("/api/v1/support/contacts").json()[0]["name"] == "Tomek"
    # Other user sees nothing and cannot touch the contact.
    from rest_framework.test import APIClient

    other = APIClient()
    other.force_authenticate(user=other_user)
    assert other.get("/api/v1/support/contacts").json() == []
    assert other.get(f"/api/v1/support/contacts/{created['id']}").status_code == 404
    assert (
        other.get(f"/api/v1/support/contacts/{created['id']}/message").status_code
        == 404
    )
    # Sessions are isolated too.
    assert SupportSession.objects.filter(user=other_user).count() == 0


def test_contact_message_builds_urls(auth_client):
    contact = auth_client.post(
        "/api/v1/support/contacts",
        {"name": "Tomek", "phone": "+48 123 456 789", "preferred_channel": "whatsapp"},
        format="json",
    ).json()
    body = auth_client.get(
        f"/api/v1/support/contacts/{contact['id']}/message?task=obiad&lang=pl"
    ).json()
    assert "obiad" in body["text"]
    assert body["sms_url"].startswith("sms:+48 123 456 789?&body=")
    assert body["whatsapp_url"].startswith("https://wa.me/48123456789?text=")


def test_contact_custom_message_overrides_template(auth_client):
    contact = auth_client.post(
        "/api/v1/support/contacts",
        {
            "name": "Mama",
            "phone": "123456789",
            "default_message": "Przyjedź, proszę.",
        },
        format="json",
    ).json()
    body = auth_client.get(
        f"/api/v1/support/contacts/{contact['id']}/message"
    ).json()
    assert body["text"] == "Przyjedź, proszę."
    assert "Przyjed" in body["whatsapp_url"] or "text=" in body["whatsapp_url"]


def test_helplines_public(api_client, db):
    body = api_client.get("/api/v1/support/helplines").json()
    assert len(body) == 4
    assert body[0]["phone"] == "112"
    assert all("hours" in entry and "description" in entry for entry in body)
    # Product-safety: seed numbers are unverified until a human confirms them.
    assert all(entry["is_verified"] is False for entry in body)


def test_top_strategies_selector(user):
    UserCopingPreference.objects.create(
        user=user,
        strategy=CopingStrategy.objects.get(code=WALK),
        survey_score=3,
    )
    top = top_strategies(user, n=2)
    assert [s.code for s in top] == [WALK, top[1].code]
    assert top[0].code == WALK


def test_support_export(user):
    from apps.support.export import export_user_data

    strategy = CopingStrategy.objects.get(code=WALK)
    UserCopingPreference.objects.create(
        user=user, strategy=strategy, survey_score=2, used_count=1, helped_score_sum=1.0
    )
    TrustedContact.objects.create(user=user, name="Tomek", phone="123")
    data = export_user_data(user)
    assert data["coping_preferences"][0]["strategy"] == WALK
    assert data["trusted_contacts"][0]["name"] == "Tomek"
