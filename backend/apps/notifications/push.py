"""Web-push delivery via pywebpush (SPEC section 6.5).

Never raises to the caller: missing VAPID keys, network errors and dead
subscriptions are swallowed. Subscriptions answered 404/410 are deleted.
"""
import json
import logging

from django.conf import settings
from pywebpush import WebPushException, webpush

logger = logging.getLogger(__name__)


def _vapid():
    return {
        "private_key": getattr(settings, "VAPID_PRIVATE_KEY", ""),
        "public_key": getattr(settings, "VAPID_PUBLIC_KEY", ""),
        "admin_email": getattr(settings, "VAPID_ADMIN_EMAIL", "admin@example.com"),
    }


def send_push(subscription, title, body, url="/"):
    """Send one push message. Returns True on success, False otherwise."""
    vapid = _vapid()
    if not vapid["private_key"] or not vapid["public_key"]:
        return False
    try:
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
            },
            data=json.dumps({"title": title, "body": body, "url": url}),
            vapid_private_key=vapid["private_key"],
            vapid_claims={"sub": f"mailto:{vapid['admin_email']}"},
        )
    except WebPushException as exc:
        status_code = getattr(getattr(exc, "response", None), "status_code", None)
        if status_code in (404, 410):
            subscription.delete()
        else:
            # Never log push contents at more than debug: bodies are personal.
            logger.debug("webpush failed: %s", status_code)
        return False
    except Exception:  # network errors, malformed subscriptions, ...
        logger.debug("webpush failed unexpectedly", exc_info=True)
        return False
    return True


def send_push_to_user(user, title, body, url="/"):
    """Send to all subscriptions of the user. Returns number of successes."""
    from .models import PushSubscription

    sent = 0
    for subscription in PushSubscription.objects.filter(user=user):
        if send_push(subscription, title, body, url):
            sent += 1
    return sent
