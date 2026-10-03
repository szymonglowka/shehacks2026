"""Journal serializers (SPEC section 7)."""
from rest_framework import serializers

from .models import SmallWin, VisitQuestion


class SmallWinSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmallWin
        fields = ("id", "date", "text", "created_at")
        read_only_fields = ("id", "created_at")


class VisitQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitQuestion
        fields = ("id", "text", "done", "created_at")
        read_only_fields = ("id", "created_at")
