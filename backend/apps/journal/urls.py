from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    RandomWinView,
    SmallWinViewSet,
    VisitQuestionViewSet,
    VisitReportView,
)

router = SimpleRouter(trailing_slash=False)
router.register("wins", SmallWinViewSet, basename="win")
router.register("visit-questions", VisitQuestionViewSet, basename="visit-question")

urlpatterns = [
    path("wins/random", RandomWinView.as_view(), name="win-random"),
    path("reports/visit", VisitReportView.as_view(), name="visit-report"),
] + router.urls
