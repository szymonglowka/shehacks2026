from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    ExportView,
    MeView,
    OnboardingCompleteView,
    OnboardingOptionsView,
    RegisterView,
)

urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="register"),
    path("auth/login", TokenObtainPairView.as_view(), name="login"),
    path("auth/refresh", TokenRefreshView.as_view(), name="refresh"),
    path("me", MeView.as_view(), name="me"),
    path("me/export", ExportView.as_view(), name="export"),
    path("onboarding/options", OnboardingOptionsView.as_view(), name="onboarding-options"),
    path("onboarding/complete", OnboardingCompleteView.as_view(), name="onboarding-complete"),
]
