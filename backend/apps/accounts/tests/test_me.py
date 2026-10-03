"""GET/PATCH/DELETE /me, cascade delete, isolation, last_seen middleware."""
from datetime import timedelta

from freezegun import freeze_time

from apps.accounts.models import Profile, User
from apps.common.factories import UserFactory


def test_get_me_returns_own_profile(auth_client, user):
    res = auth_client.get("/api/v1/me")
    assert res.status_code == 200
    body = res.json()
    assert body["email"] == user.email
    assert body["profile"]["language"] == "pl"
    assert body["profile"]["onboarding_completed"] is False


def test_patch_me_updates_profile(auth_client, user):
    res = auth_client.patch(
        "/api/v1/me",
        {"profile": {"display_name": "Ania", "mode": "cycle", "tone": "motivating", "night_mode": "off"}},
        format="json",
    )
    assert res.status_code == 200
    user.profile.refresh_from_db()
    assert user.profile.display_name == "Ania"
    assert user.profile.mode == "cycle"
    assert res.json()["profile"]["tone"] == "motivating"


def test_patch_me_rejects_bad_choice(auth_client):
    res = auth_client.patch("/api/v1/me", {"profile": {"mode": "nope"}}, format="json")
    assert res.status_code == 400
    assert set(res.json()) == {"detail", "errors"}


def test_delete_me_removes_user_and_profile(auth_client, user):
    uid = user.id
    res = auth_client.delete("/api/v1/me")
    assert res.status_code == 204
    assert not User.objects.filter(id=uid).exists()
    assert not Profile.objects.filter(user_id=uid).exists()


def test_users_only_see_themselves(api_client, db):
    alice = UserFactory(email="alice@example.com")
    bob = UserFactory(email="bob@example.com")
    api_client.force_authenticate(user=alice)
    assert api_client.get("/api/v1/me").json()["email"] == "alice@example.com"
    api_client.force_authenticate(user=bob)
    assert api_client.get("/api/v1/me").json()["email"] == "bob@example.com"


def test_last_seen_at_updated_at_most_every_5_minutes(api_client, user):
    api_client.force_authenticate(user=user)
    with freeze_time("2026-10-03 10:00:00"):
        api_client.get("/api/v1/me")
        user.profile.refresh_from_db()
        first = user.profile.last_seen_at
        assert first is not None
    with freeze_time("2026-10-03 10:03:00"):
        api_client.get("/api/v1/me")
        user.profile.refresh_from_db()
        assert user.profile.last_seen_at == first
    with freeze_time("2026-10-03 10:06:01"):
        api_client.get("/api/v1/me")
        user.profile.refresh_from_db()
        assert user.profile.last_seen_at > first
        assert user.profile.last_seen_at - first >= timedelta(minutes=6)
