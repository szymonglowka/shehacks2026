"""Tracking app: daily check-ins, periods, EPDS assessments (SPEC section 5)."""
from typing import ClassVar

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.common.fields import EncryptedTextField
from apps.common.models import TimeStampedModel

BLEEDING_CHOICES = (
    ("none", "none"),
    ("spotting", "spotting"),
    ("light", "light"),
    ("medium", "medium"),
    ("heavy", "heavy"),
)

RISK_LEVEL_CHOICES = (
    ("low", "low"),
    ("moderate", "moderate"),
    ("high", "high"),
    ("urgent", "urgent"),
)

_scale_1_5 = [MinValueValidator(1), MaxValueValidator(5)]


class DailyCheckIn(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="checkins"
    )
    date = models.DateField()
    mood = models.SmallIntegerField(null=True, blank=True, validators=_scale_1_5)
    energy = models.SmallIntegerField(null=True, blank=True, validators=_scale_1_5)
    anxiety = models.SmallIntegerField(null=True, blank=True, validators=_scale_1_5)
    sleep_hours = models.FloatField(
        null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(24)]
    )
    sleep_quality = models.SmallIntegerField(
        null=True, blank=True, validators=_scale_1_5
    )
    pain = models.SmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
    )
    emotions = models.JSONField(default=list, blank=True)
    bleeding = models.CharField(
        max_length=10, choices=BLEEDING_CHOICES, default="none"
    )
    symptoms = models.JSONField(default=list, blank=True)
    red_flags = models.JSONField(default=list, blank=True)
    # Encrypted at rest; never log the contents.
    note = EncryptedTextField(null=True, blank=True)

    class Meta:
        constraints: ClassVar[list[models.UniqueConstraint]] = [
            models.UniqueConstraint(fields=("user", "date"), name="unique_checkin_user_date")
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "date")),
        ]
        ordering = ("date",)

    def __str__(self):
        return f"DailyCheckIn({self.user_id}, {self.date})"


class Period(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="periods"
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "start_date")),
        ]
        ordering = ("start_date",)

    def __str__(self):
        return f"Period({self.user_id}, {self.start_date})"


class EPDSAssessment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="epds_assessments"
    )
    answers = models.JSONField()
    total = models.PositiveSmallIntegerField()
    self_harm_score = models.PositiveSmallIntegerField()
    risk_level = models.CharField(max_length=10, choices=RISK_LEVEL_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "created_at")),
        ]
        ordering = ("-created_at",)

    def __str__(self):
        return f"EPDSAssessment({self.user_id}, {self.total})"
