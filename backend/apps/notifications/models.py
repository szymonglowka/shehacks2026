"""Notifications app: push subscriptions + in-app notifications (SPEC section 5)."""
from typing import ClassVar

from django.conf import settings
from django.db import models

KIND_CHOICES = (
    ("goal_reminder", "goal_reminder"),
    ("checkin_reminder", "checkin_reminder"),
    ("epds_due", "epds_due"),
    ("gentle_nudge", "gentle_nudge"),
    ("system", "system"),
)


class PushSubscription(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="push_subscriptions",
    )
    endpoint = models.URLField(max_length=500, unique=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PushSubscription({self.user_id}, {self.endpoint[:40]}...)"


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    title = models.CharField(max_length=200)
    body = models.TextField()
    url = models.CharField(max_length=300, default="/")
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "kind", "created_at")),
        ]

    def __str__(self):
        return f"Notification({self.user_id}, {self.kind})"

    @property
    def is_read(self):
        return self.read_at is not None
