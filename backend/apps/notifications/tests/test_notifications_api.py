"""Push + notifications API tests (web push calls are mocked)."""
from unittest.mock import patch

from apps.notifications.models import Notification, PushSubscription

SUBSCRIPTION = {
    "endpoint": "https://push.example.com/abc123",
    "keys": {"p256dh": "p256dh-key", "auth": "auth-key"},
}


def test_vapid_public_key(auth_client):
    response = auth_client.get("/api/v1/push/vapid-public-key")
    assert response.status_code == 200
    assert "public_key" in response.json()


def test_subscribe_validation(auth_client):
    assert auth_client.post("/api/v1/push/subscriptions", {}, format="json").status_code == 400
    response = auth_client.post("/api/v1/push/subscriptions", SUBSCRIPTION, format="json")
    assert response.status_code == 201
    # Same endpoint re-subscribed: no duplicate.
    auth_client.post("/api/v1/push/subscriptions", SUBSCRIPTION, format="json")
    assert PushSubscription.objects.count() == 1


def test_unsubscribe(auth_client, user):
    PushSubscription.objects.create(user=user, endpoint=SUBSCRIPTION["endpoint"], p256dh="x", auth="y")
    response = auth_client.delete(
        "/api/v1/push/subscriptions", {"endpoint": SUBSCRIPTION["endpoint"]}, format="json"
    )
    assert response.status_code == 204
    assert PushSubscription.objects.count() == 0


def test_push_test_sends_system_notification(auth_client, user):
    with patch("apps.notifications.push.send_push_to_user", return_value=1):
        response = auth_client.post("/api/v1/push/test")
    assert response.status_code == 201, response.content
    assert Notification.objects.filter(user=user, kind="system").count() == 1


def test_notifications_list_paginated_and_read(auth_client, user):
    for index in range(3):
        Notification.objects.create(
            user=user, kind="system", title=f"T{index}", body="B", url="/"
        )
    body = auth_client.get("/api/v1/notifications").json()
    assert body["count"] == 3
    assert len(body["results"]) == 3
    first = body["results"][0]
    assert first["is_read"] is False
    read = auth_client.post(f"/api/v1/notifications/{first['id']}/read")
    assert read.status_code == 200
    assert read.json()["is_read"] is True
    read_all = auth_client.post("/api/v1/notifications/read-all")
    assert read_all.json()["updated"] == 2
    assert Notification.objects.filter(read_at__isnull=True).count() == 0


def test_notifications_isolation(auth_client, user):
    from apps.common.factories import UserFactory

    other = UserFactory()
    note = Notification.objects.create(user=other, kind="system", title="T", body="B")
    assert auth_client.get("/api/v1/notifications").json()["count"] == 0
    assert auth_client.post(f"/api/v1/notifications/{note.pk}/read").status_code == 404


def test_notifications_require_auth(api_client):
    assert api_client.get("/api/v1/notifications").status_code == 401
    assert api_client.post("/api/v1/push/test").status_code == 401


def test_export_user_data(user):
    from apps.notifications.export import export_user_data

    Notification.objects.create(user=user, kind="system", title="T", body="B", url="/")
    data = export_user_data(user)
    assert len(data["notifications"]) == 1
    assert data["notifications"][0]["kind"] == "system"
