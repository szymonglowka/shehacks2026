from django.contrib import admin

from .models import CareRequest, CircleLink


@admin.register(CircleLink)
class CircleLinkAdmin(admin.ModelAdmin):
    list_display = ("user", "share_mood", "created_at", "revoked_at")


@admin.register(CareRequest)
class CareRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "category", "status", "claimed_by_name")
    list_filter = ("category", "status")
