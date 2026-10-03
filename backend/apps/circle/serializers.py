"""Circle serializers (SPEC section 7)."""
from rest_framework import serializers

from .models import CareRequest, CircleLink


class CircleLinkSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = CircleLink
        fields = ("token", "url", "share_mood", "created_at")
        read_only_fields = ("token", "url", "created_at")

    def get_url(self, obj):
        return f"/c/{obj.token}"


class CareRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareRequest
        fields = (
            "id",
            "title",
            "category",
            "when_date",
            "when_label",
            "note",
            "status",
            "claimed_by_name",
            "claimed_at",
            "done_at",
            "created_at",
        )
        read_only_fields = ("id", "claimed_at", "done_at", "created_at")


class ClaimSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Name must not be blank.")
        return value.strip()
