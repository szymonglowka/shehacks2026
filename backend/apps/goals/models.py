"""Goals app: templates, user goals and daily logs (SPEC section 5)."""
from typing import ClassVar

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel

CATEGORY_CHOICES = (
    ("movement", "movement"),
    ("rest", "rest"),
    ("nutrition", "nutrition"),
    ("mind", "mind"),
    ("social", "social"),
    ("recovery", "recovery"),
    ("selfcare", "selfcare"),
)
MODE_CHOICES = (
    ("postpartum", "postpartum"),
    ("cycle", "cycle"),
    ("both", "both"),
)
FREQUENCY_CHOICES = (
    ("daily", "daily"),
    ("weekly", "weekly"),
)


class GoalTemplate(models.Model):
    """Catalog content (SPEC section 5 lists no timestamps for templates)."""

    title_pl = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200)
    description_pl = models.TextField(default="")
    description_en = models.TextField(default="")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default="both")
    min_week = models.PositiveSmallIntegerField(null=True, blank=True)
    max_week = models.PositiveSmallIntegerField(null=True, blank=True)
    delivery_types = models.JSONField(default=list)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default="daily")
    target_count = models.PositiveSmallIntegerField(default=1)
    default_reminder_time = models.TimeField(null=True, blank=True)
    safety_note_pl = models.TextField(default="", blank=True)
    safety_note_en = models.TextField(default="", blank=True)

    def __str__(self):
        return self.title_en or self.title_pl


class Goal(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="goals"
    )
    template = models.ForeignKey(
        GoalTemplate, null=True, blank=True, on_delete=models.SET_NULL
    )
    title = models.CharField(max_length=200)
    description = models.TextField(default="", blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="selfcare")
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default="daily")
    target_count = models.PositiveSmallIntegerField(default=1)
    reminder_enabled = models.BooleanField(default=False)
    reminder_time = models.TimeField(null=True, blank=True)
    # Python weekdays: Monday=0 .. Sunday=6. Empty list = every day.
    reminder_weekdays = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "is_active"))
        ]

    def __str__(self):
        return self.title

    def completed_dates(self):
        """Set of dates with a completed log (for streaks.goal_stats)."""
        return set(
            self.logs.filter(completed=True).values_list("date", flat=True)
        )


class GoalLog(models.Model):
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name="logs")
    date = models.DateField()
    completed = models.BooleanField(default=True)

    class Meta:
        constraints: ClassVar[list[models.UniqueConstraint]] = [
            models.UniqueConstraint(fields=("goal", "date"), name="unique_goal_log_date")
        ]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("goal", "date"))
        ]

    def __str__(self):
        return f"GoalLog({self.goal_id}, {self.date}, {self.completed})"
