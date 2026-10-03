from django.contrib import admin

from .models import Goal, GoalLog, GoalTemplate


@admin.register(GoalTemplate)
class GoalTemplateAdmin(admin.ModelAdmin):
    list_display = ("title_en", "category", "mode", "frequency", "target_count")
    list_filter = ("category", "mode", "frequency")


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "frequency", "is_active", "created_at")
    list_filter = ("frequency", "is_active")


@admin.register(GoalLog)
class GoalLogAdmin(admin.ModelAdmin):
    list_display = ("goal", "date", "completed")
