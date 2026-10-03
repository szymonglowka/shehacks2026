"""Tracking admin."""
from django.contrib import admin

from .models import DailyCheckIn, EPDSAssessment, Period


@admin.register(DailyCheckIn)
class DailyCheckInAdmin(admin.ModelAdmin):
    list_display = ("user", "date", "mood", "sleep_hours")
    list_filter = ("date",)
    # Never display the decrypted note in the admin list.
    exclude = ("note",)


@admin.register(Period)
class PeriodAdmin(admin.ModelAdmin):
    list_display = ("user", "start_date", "end_date")


@admin.register(EPDSAssessment)
class EPDSAssessmentAdmin(admin.ModelAdmin):
    list_display = ("user", "total", "risk_level", "created_at")
