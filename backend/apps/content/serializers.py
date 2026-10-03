"""Serializers for content (thin; picking lives in picking.py)."""
from rest_framework import serializers

from apps.common.i18n import get_lang, localized

from .models import Article, Specialist


class ArticleSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    body = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = (
            "slug",
            "title",
            "summary",
            "body",
            "category",
            "mode",
            "min_week",
            "max_week",
            "reading_minutes",
            "cover_emoji",
            "cover_image",
        )

    def _lang(self):
        return get_lang(self.context.get("request"))

    def get_title(self, obj) -> str:
        return localized(obj, "title", self._lang())

    def get_summary(self, obj) -> str:
        return localized(obj, "summary", self._lang())

    def get_body(self, obj) -> str:
        return localized(obj, "body", self._lang())


class SpecialistSerializer(serializers.ModelSerializer):
    description = serializers.SerializerMethodField()

    class Meta:
        model = Specialist
        fields = (
            "id",
            "name",
            "specialty",
            "city",
            "online",
            "phone",
            "website",
            "description",
            "is_sample",
        )

    def _lang(self):
        return get_lang(self.context.get("request"))

    def get_description(self, obj) -> str:
        return localized(obj, "description", self._lang())
