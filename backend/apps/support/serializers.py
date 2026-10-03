"""Support serializers (SPEC section 7). Bilingual fields resolve via Accept-Language."""
from django.db.models import Count, Q
from rest_framework import serializers

from apps.common.i18n import get_lang, localized

from .models import (
    CopingStrategy,
    Helpline,
    SupportSession,
    TrustedContact,
    UserCopingPreference,
)


class ToolkitStrategySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    steps = serializers.SerializerMethodField()
    score = serializers.FloatField(read_only=True)
    used_count = serializers.IntegerField(read_only=True)
    helped_score_sum = serializers.FloatField(read_only=True)
    evidence = serializers.DictField(read_only=True)

    class Meta:
        model = CopingStrategy
        fields = (
            "code",
            "name",
            "description",
            "steps",
            "category",
            "duration_min",
            "icon",
            "score",
            "used_count",
            "helped_score_sum",
            "evidence",
        )

    def _lang(self):
        return get_lang(self.context.get("request"))

    def get_name(self, obj):
        return localized(obj, "name", self._lang())

    def get_description(self, obj):
        return localized(obj, "description", self._lang())

    def get_steps(self, obj):
        return localized(obj, "steps", self._lang())


class SupportSessionSerializer(serializers.ModelSerializer):
    strategy = serializers.CharField(
        source="strategy.code", allow_null=True, default=None
    )

    class Meta:
        model = SupportSession
        fields = (
            "id",
            "started_at",
            "ended_at",
            "intensity",
            "trigger",
            "strategy",
            "helped",
            "mood_after",
        )
        read_only_fields = ("id", "started_at", "ended_at")


class SupportSessionCreateSerializer(serializers.Serializer):
    intensity = serializers.IntegerField(min_value=1, max_value=5)
    trigger = serializers.ChoiceField(
        choices=("manual", "low_mood", "epds", "checkin_risk"), default="manual"
    )


class SupportSessionUpdateSerializer(serializers.Serializer):
    strategy = serializers.CharField(required=False, allow_null=True)
    helped = serializers.ChoiceField(
        choices=("yes", "somewhat", "no"), required=False, allow_null=True
    )
    mood_after = serializers.IntegerField(
        min_value=1, max_value=5, required=False, allow_null=True
    )

    def validate_strategy(self, value):
        if value is None:
            return None
        try:
            return CopingStrategy.objects.get(code=value)
        except CopingStrategy.DoesNotExist:
            raise serializers.ValidationError("Unknown strategy code.") from None


class CopingScoresSerializer(serializers.Serializer):
    coping_scores = serializers.DictField(child=serializers.IntegerField())

    def validate_coping_scores(self, value):
        codes = set(value)
        known = set(CopingStrategy.objects.values_list("code", flat=True))
        unknown = codes - known
        if unknown:
            raise serializers.ValidationError(
                f"Unknown strategy codes: {sorted(unknown)}"
            )
        for code, score in value.items():
            if score not in (0, 1, 2, 3):
                raise serializers.ValidationError(
                    f"Score for {code} must be 0-3."
                )
        return value


class TrustedContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrustedContact
        fields = (
            "id",
            "name",
            "relation",
            "phone",
            "preferred_channel",
            "default_message",
        )


class HelplineSerializer(serializers.ModelSerializer):
    hours = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = Helpline
        fields = ("id", "name", "phone", "hours", "description", "is_emergency", "order")

    def _lang(self):
        return get_lang(self.context.get("request"))

    def get_hours(self, obj):
        return localized(obj, "hours", self._lang())

    def get_description(self, obj):
        return localized(obj, "description", self._lang())


def session_evidence_counts(user):
    """{(strategy_id): {helped_yes, helped_somewhat, used}} from sessions."""
    rows = (
        SupportSession.objects.filter(user=user, strategy__isnull=False)
        .values("strategy_id")
        .annotate(
            used=Count("id"),
            helped_yes=Count("id", filter=Q(helped="yes")),
            helped_somewhat=Count("id", filter=Q(helped="somewhat")),
        )
    )
    return {row["strategy_id"]: row for row in rows}
