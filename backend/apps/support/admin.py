from django.contrib import admin

from .models import (
    CopingStrategy,
    Helpline,
    SupportSession,
    TrustedContact,
    UserCopingPreference,
)


@admin.register(CopingStrategy)
class CopingStrategyAdmin(admin.ModelAdmin):
    list_display = ("code", "category", "duration_min")
    list_filter = ("category",)


@admin.register(UserCopingPreference)
class UserCopingPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "strategy", "survey_score", "used_count")


@admin.register(SupportSession)
class SupportSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "intensity", "trigger", "helped", "started_at")
    list_filter = ("trigger", "helped")


@admin.register(TrustedContact)
class TrustedContactAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "preferred_channel")


@admin.register(Helpline)
class HelplineAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "is_emergency", "order")
