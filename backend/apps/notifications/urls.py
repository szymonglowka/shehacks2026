from django.urls import path

from .views import (
    NotificationListView,
    NotificationReadAllView,
    NotificationReadView,
    PushSubscriptionView,
    PushTestView,
    VapidPublicKeyView,
)

urlpatterns = [
    path("push/vapid-public-key", VapidPublicKeyView.as_view(), name="vapid-key"),
    path("push/subscriptions", PushSubscriptionView.as_view(), name="push-subscription"),
    path("push/test", PushTestView.as_view(), name="push-test"),
    path("notifications", NotificationListView.as_view(), name="notification-list"),
    path(
        "notifications/read-all",
        NotificationReadAllView.as_view(),
        name="notification-read-all",
    ),
    path(
        "notifications/<int:pk>/read",
        NotificationReadView.as_view(),
        name="notification-read",
    ),
]
