"""Tracking serializers (SPEC section 7)."""
from rest_framework import serializers

from .models import DailyCheckIn, EPDSAssessment, Period


class DailyCheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyCheckIn
        fields = (
            "date", "mood", "energy", "anxiety", "sleep_hours",
            "sleep_quality", "pain", "emotions", "bleeding", "symptoms",
            "red_flags", "note", "created_at", "updated_at",
        )
        read_only_fields = ("date", "created_at", "updated_at")


class PeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Period
        fields = ("id", "start_date", "end_date")

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start is not None and end is not None and end < start:
            raise serializers.ValidationError(
                {"end_date": ["End date cannot be before start date."]}
            )
        return attrs


class EPDSAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EPDSAssessment
        fields = (
            "id", "answers", "total", "self_harm_score", "risk_level", "created_at",
        )
        read_only_fields = ("id", "total", "self_harm_score", "risk_level", "created_at")
