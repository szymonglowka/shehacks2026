from django.contrib import admin

from .models import Article, Specialist


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("slug", "category", "mode", "min_week", "max_week")
    list_filter = ("category", "mode")
    search_fields = ("slug", "title_pl", "title_en")


@admin.register(Specialist)
class SpecialistAdmin(admin.ModelAdmin):
    list_display = ("name", "specialty", "city", "online", "is_sample")
    list_filter = ("specialty", "online", "is_sample")
    search_fields = ("name", "city")
