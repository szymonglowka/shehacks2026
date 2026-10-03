"""Circle app: shareable support links and care requests (SPEC section 5, W9)."""
import uuid
from typing import ClassVar

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel

CATEGORY_CHOICES = (
    ("meal", "meal"),
    ("night", "night"),
    ("chores", "chores"),
    ("errands", "errands"),
    ("company", "company"),
    ("siblings", "siblings"),
    ("other", "other"),
)

STATUS_CHOICES = (
    ("open", "open"),
    ("claimed", "claimed"),
    ("done", "done"),
    ("cancelled", "cancelled"),
)


class CircleLink(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="circle_links"
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    share_mood = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("token",)),
            models.Index(fields=("user", "revoked_at")),
        ]

    @property
    def is_active(self):
        return self.revoked_at is None

    def __str__(self):
        return f"CircleLink({self.user_id}, revoked={self.revoked_at is not None})"


class CareRequest(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="care_requests"
    )
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    when_date = models.DateField(null=True, blank=True)
    when_label = models.CharField(max_length=100, default="", blank=True)
    note = models.TextField(default="", blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="open")
    claimed_by_name = models.CharField(max_length=100, default="", blank=True)
    claimed_at = models.DateTimeField(null=True, blank=True)
    done_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "status")),
        ]

    def __str__(self):
        return f"CareRequest({self.user_id}, {self.title}, {self.status})"
