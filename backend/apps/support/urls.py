from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    ContactMessageView,
    HelplineListView,
    PreferencesView,
    SessionCreateView,
    SessionUpdateView,
    ToolkitView,
    TrustedContactViewSet,
)

router = SimpleRouter(trailing_slash=False)
router.register("support/contacts", TrustedContactViewSet, basename="contact")

urlpatterns = [
    path("support/toolkit", ToolkitView.as_view(), name="toolkit"),
    path("support/sessions", SessionCreateView.as_view(), name="session-create"),
    path(
        "support/sessions/<int:pk>",
        SessionUpdateView.as_view(),
        name="session-update",
    ),
    path("support/preferences", PreferencesView.as_view(), name="preferences"),
    path(
        "support/contacts/<int:pk>/message",
        ContactMessageView.as_view(),
        name="contact-message",
    ),
    path("support/helplines", HelplineListView.as_view(), name="helpline-list"),
] + router.urls
