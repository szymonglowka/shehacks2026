"""Serializers for notifications."""
from rest_framework import serializers

from .models import Notification


class VapidPublicKeySerializer(serializers.Serializer):
    public_key = serializers.CharField()


class PushSubscriptionSerializer(serializers.Serializer):
    endpoint = serializers.URLField()
    keys = serializers.DictField(child=serializers.CharField())


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "kind",
            "title",
            "body",
            "url",
            "created_at",
            "sent_at",
            "read_at",
            "is_read",
        )
        read_only_fields = fields
