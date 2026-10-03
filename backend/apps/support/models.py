"""Support app: coping-strategy catalog, user preferences, sessions, contacts, helplines (SPEC section 5)."""
from typing import ClassVar

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel

CATEGORY_CHOICES = (
    ("breathing", "breathing"),
    ("movement", "movement"),
    ("social", "social"),
    ("sensory", "sensory"),
    ("rest", "rest"),
    ("creative", "creative"),
    ("mindfulness", "mindfulness"),
    ("practical", "practical"),
)

HELPED_CHOICES = (
    ("yes", "yes"),
    ("somewhat", "somewhat"),
    ("no", "no"),
)

TRIGGER_CHOICES = (
    ("manual", "manual"),
    ("low_mood", "low_mood"),
    ("epds", "epds"),
    ("checkin_risk", "checkin_risk"),
)

CHANNEL_CHOICES = (
    ("sms", "sms"),
    ("whatsapp", "whatsapp"),
)


class CopingStrategy(models.Model):
    """Seeded catalog (~16 rows, SPEC section 5)."""

    code = models.CharField(max_length=50, unique=True)
    name_pl = models.CharField(max_length=200)
    name_en = models.CharField(max_length=200)
    description_pl = models.TextField(default="")
    description_en = models.TextField(default="")
    steps_pl = models.JSONField(default=list)
    steps_en = models.JSONField(default=list)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    duration_min = models.PositiveSmallIntegerField(default=5)
    icon = models.CharField(max_length=50, default="")

    def __str__(self):
        return self.code


class UserCopingPreference(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="coping_preferences"
    )
    strategy = models.ForeignKey(
        CopingStrategy, on_delete=models.CASCADE, related_name="user_preferences"
    )
    survey_score = models.PositiveSmallIntegerField(default=0)
    used_count = models.PositiveIntegerField(default=0)
    helped_score_sum = models.FloatField(default=0.0)

    class Meta:
        constraints: ClassVar[list[models.UniqueConstraint]] = [
            models.UniqueConstraint(
                fields=("user", "strategy"), name="unique_user_coping_preference"
            )
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "strategy"))
        ]

    def __str__(self):
        return f"Preference({self.user_id}, {self.strategy.code})"


class SupportSession(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="support_sessions"
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    intensity = models.PositiveSmallIntegerField()
    trigger = models.CharField(max_length=20, choices=TRIGGER_CHOICES, default="manual")
    strategy = models.ForeignKey(
        CopingStrategy, null=True, blank=True, on_delete=models.SET_NULL
    )
    helped = models.CharField(max_length=10, choices=HELPED_CHOICES, null=True, blank=True)
    mood_after = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "started_at"))
        ]

    def __str__(self):
        return f"SupportSession({self.user_id}, intensity={self.intensity})"


class TrustedContact(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="trusted_contacts"
    )
    name = models.CharField(max_length=100)
    relation = models.CharField(max_length=100, default="", blank=True)
    phone = models.CharField(max_length=30)
    preferred_channel = models.CharField(
        max_length=10, choices=CHANNEL_CHOICES, default="sms"
    )
    default_message = models.TextField(default="", blank=True)

    def __str__(self):
        return f"{self.name} ({self.user_id})"


class Helpline(models.Model):
    """Seeded public catalog (SPEC section 5). Numbers are unverified until a human confirms them."""

    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30)
    hours_pl = models.CharField(max_length=100, default="")
    hours_en = models.CharField(max_length=100, default="")
    description_pl = models.TextField(default="")
    description_en = models.TextField(default="")
    is_emergency = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("order", "id")

    def __str__(self):
        return f"{self.name} ({self.phone})"
