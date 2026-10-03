from django.urls import path

from .views import (
    GoalDetailView,
    GoalListCreateView,
    GoalLogView,
    RecommendedGoalsView,
    TodayGoalsView,
)

urlpatterns = [
    path("goals", GoalListCreateView.as_view(), name="goal-list"),
    path("goals/today", TodayGoalsView.as_view(), name="goal-today"),
    path("goals/recommended", RecommendedGoalsView.as_view(), name="goal-recommended"),
    path("goals/<int:pk>", GoalDetailView.as_view(), name="goal-detail"),
    path("goals/<int:pk>/log", GoalLogView.as_view(), name="goal-log"),
]
