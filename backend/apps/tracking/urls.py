from django.urls import path

from .views import (
    CheckinDetailView,
    CheckinListView,
    CycleStatusView,
    EPDSDueView,
    EPDSListCreateView,
    EPDSQuestionsView,
    PeriodDetailView,
    PeriodListCreateView,
    PeriodReturnedView,
)

urlpatterns = [
    path("checkins", CheckinListView.as_view(), name="checkin-list"),
    path("checkins/<str:day>", CheckinDetailView.as_view(), name="checkin-detail"),
    path("cycle/status", CycleStatusView.as_view(), name="cycle-status"),
    path("periods", PeriodListCreateView.as_view(), name="period-list"),
    path("periods/<int:pk>", PeriodDetailView.as_view(), name="period-detail"),
    path(
        "profile/period-returned",
        PeriodReturnedView.as_view(),
        name="period-returned",
    ),
    path("epds/questions", EPDSQuestionsView.as_view(), name="epds-questions"),
    path("epds", EPDSListCreateView.as_view(), name="epds"),
    path("epds/due", EPDSDueView.as_view(), name="epds-due"),
]
