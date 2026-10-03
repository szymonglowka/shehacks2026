from django.urls import path

from .views import DashboardView, ForecastView, InsightsView, NightView

urlpatterns = [
    path("insights", InsightsView.as_view(), name="insights"),
    path("forecast/tomorrow", ForecastView.as_view(), name="forecast-tomorrow"),
    path("night/now", NightView.as_view(), name="night-now"),
    path("dashboard", DashboardView.as_view(), name="dashboard"),
]
