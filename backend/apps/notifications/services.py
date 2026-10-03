"""notify(): the single entry point for user notifications (shared names).

Creates the in-app Notification row and fans out to web push. Never raises
to the caller — delivery problems must not break the feature that notifies.
Other apps call it defensively::

    try:
        from apps.notifications.services import notify
    except ImportError:
        notify = None
"""
import logging

from django.utils import timezone

logger = logging.getLogger(__name__)


def notify(user, kind: str, title: str, body: str, url: str = "/"):
    """Create a Notification and push it to all subscriptions. Never raises."""
    from .models import Notification
    from .push import send_push_to_user

    try:
        notification = Notification.objects.create(
            user=user,
            kind=kind,
            title=title,
            body=body,
            url=url,
            sent_at=timezone.now(),
        )
    except Exception:
        logger.exception("notify: could not create Notification")
        return None
    try:
        send_push_to_user(user, title, body, url)
    except Exception:
        logger.exception("notify: push fan-out failed")
    return notification
