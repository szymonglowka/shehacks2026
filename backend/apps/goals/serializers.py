"""Serializers for goals (thin; streak math lives in streaks.py)."""
from django.utils import timezone
from rest_framework import serializers

from apps.common.i18n import get_lang, localized

from .models import Goal, GoalLog, GoalTemplate
from .streaks import goal_stats


class GoalTemplateSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    safety_note = serializers.SerializerMethodField()

    class Meta:
        model = GoalTemplate
        fields = (
            "id",
            "title",
            "description",
            "category",
            "mode",
            "min_week",
            "max_week",
            "delivery_types",
            "frequency",
            "target_count",
            "default_reminder_time",
            "safety_note",
        )

    def _lang(self):
        return get_lang(self.context.get("request"))

    def get_title(self, obj) -> str:
        return localized(obj, "title", self._lang())

    def get_description(self, obj) -> str:
        return localized(obj, "description", self._lang())

    def get_safety_note(self, obj) -> str:
        return localized(obj, "safety_note", self._lang())


class GoalSerializer(serializers.ModelSerializer):
    current_streak = serializers.SerializerMethodField()
    done_today = serializers.SerializerMethodField()
    progress_this_week = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = (
            "id",
            "template",
            "title",
            "description",
            "category",
            "frequency",
            "target_count",
            "reminder_enabled",
            "reminder_time",
            "reminder_weekdays",
            "is_active",
            "created_at",
            "current_streak",
            "done_today",
            "progress_this_week",
        )
        read_only_fields = ("created_at",)

    def _stats(self, obj):
        return goal_stats(
            obj.frequency, obj.target_count, obj.completed_dates(), timezone.localdate()
        )

    def get_current_streak(self, obj) -> int:
        return self._stats(obj)["current_streak"]

    def get_done_today(self, obj) -> bool:
        return self._stats(obj)["done_today"]

    def get_progress_this_week(self, obj) -> dict:
        return self._stats(obj)["progress_this_week"]

    def validate_reminder_weekdays(self, value):
        if value is None:
            return []
        if not isinstance(value, list) or any(
            not isinstance(day, int) or day < 0 or day > 6 for day in value
        ):
            raise serializers.ValidationError("Weekdays must be a list of 0-6.")
        return value


class GoalLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalLog
        fields = ("id", "date", "completed")
