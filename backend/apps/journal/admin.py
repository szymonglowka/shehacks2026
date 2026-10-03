from django.contrib import admin

from .models import SmallWin, VisitQuestion


@admin.register(SmallWin)
class SmallWinAdmin(admin.ModelAdmin):
    list_display = ("user", "date", "created_at")


@admin.register(VisitQuestion)
class VisitQuestionAdmin(admin.ModelAdmin):
    list_display = ("user", "done", "created_at")
    list_filter = ("done",)
