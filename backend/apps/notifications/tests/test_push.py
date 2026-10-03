"""push.py + services.notify tests with mocked webpush."""
from unittest.mock import MagicMock, patch

import pytest
from django.test import override_settings
from pywebpush import WebPushException

from apps.notifications.models import Notification, PushSubscription
from apps.notifications.push import send_push, send_push_to_user
from apps.notifications.services import notify

VAPID = {
    "VAPID_PUBLIC_KEY": "public-test-key",
    "VAPID_PRIVATE_KEY": "dGVzdC1wcml2YXRlLWtleQ",
    "VAPID_ADMIN_EMAIL": "test@example.com",
}


@pytest.fixture
def subscription(user):
    return PushSubscription.objects.create(
        user=user, endpoint="https://push.example.com/x", p256dh="p", auth="a"
    )


def _exc(status_code):
    response = MagicMock()
    response.status_code = status_code
    return WebPushException("gone", response=response)


@override_settings(**VAPID)
def test_send_push_success(subscription):
    with patch("apps.notifications.push.webpush", return_value=None):
        assert send_push(subscription, "T", "B", "/") is True


@override_settings(**VAPID)
def test_send_push_expired_deletes_subscription(subscription):
    with patch("apps.notifications.push.webpush", side_effect=_exc(410)):
        assert send_push(subscription, "T", "B", "/") is False
    assert PushSubscription.objects.count() == 0


@override_settings(**VAPID)
def test_send_push_error_keeps_subscription(subscription):
    with patch("apps.notifications.push.webpush", side_effect=_exc(500)):
        assert send_push(subscription, "T", "B", "/") is False
    assert PushSubscription.objects.count() == 1


def test_send_push_without_vapid_keys_skips(subscription):
    with patch("apps.notifications.push.webpush") as mocked:
        assert send_push(subscription, "T", "B", "/") is False
        mocked.assert_not_called()


@override_settings(**VAPID)
def test_send_push_to_user_counts_successes(user, subscription):
    PushSubscription.objects.create(
        user=user, endpoint="https://push.example.com/y", p256dh="p", auth="a"
    )
    with patch("apps.notifications.push.webpush", return_value=None):
        assert send_push_to_user(user, "T", "B") == 2


@override_settings(**VAPID)
def test_notify_creates_and_pushes(user):
    with patch(
        "apps.notifications.push.send_push_to_user", return_value=1
    ) as mocked:
        note = notify(user, "system", "T", "B", "/notifications")
    assert note is not None
    assert Notification.objects.get().pk == note.pk
    assert note.sent_at is not None
    mocked.assert_called_once_with(user, "T", "B", "/notifications")


def test_notify_never_raises(user):
    with patch(
        "apps.notifications.push.send_push_to_user",
        side_effect=RuntimeError("boom"),
    ):
        note = notify(user, "system", "T", "B")
    assert note is not None
