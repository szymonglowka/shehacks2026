"""Auto-includes every backend app's urls.py under /api/v1/ (one loop)."""
import importlib

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

APP_NAMES = [
    "common",
    "accounts",
    "tracking",
    "insights",
    "support",
    "circle",
    "journal",
    "goals",
    "notifications",
    "content",
]


def health(request):
    return JsonResponse({"status": "ok"})


api_patterns = []
for _app in APP_NAMES:
    _mod = importlib.import_module(f"apps.{_app}.urls")
    if getattr(_mod, "urlpatterns", None):
        api_patterns.append(path("", include(f"apps.{_app}.urls")))

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", health, name="health"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    path("api/v1/", include(api_patterns)),
]
