"""Journal API (SPEC section 7). Every queryset is scoped to request.user.

The visit report aggregates tracking rows (SPEC section 5 names) when the
tracking models exist; otherwise those sections come back empty. Tracking
is owned by b-track -- this view never imports it unconditionally.
"""
from datetime import timedelta

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SmallWin, VisitQuestion
from .selectors import wins_count
from .serializers import SmallWinSerializer, VisitQuestionSerializer
from .summary import (
    CheckInPoint,
    EpdsPoint,
    epds_trend,
    mood_sleep_summary,
    red_flags_seen,
    symptom_frequency,
)

try:
    from apps.tracking.models import DailyCheckIn, EPDSAssessment
except ImportError:
    DailyCheckIn = None
    EPDSAssessment = None

REPORT_WEEKS = (2, 4, 6)


class SmallWinViewSet(viewsets.ModelViewSet):
    serializer_class = SmallWinSerializer

    def get_queryset(self):
        return SmallWin.objects.filter(user=self.request.user).order_by("-date", "-id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RandomWinView(APIView):
    """GET /wins/random: one random win (K6 pick-me-up in a tough day)."""

    def get(self, request):
        win = SmallWin.objects.filter(user=request.user).order_by("?").first()
        if win is None:
            return Response(
                {"detail": "No wins yet."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(SmallWinSerializer(win).data)


class VisitQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = VisitQuestionSerializer

    def get_queryset(self):
        return VisitQuestion.objects.filter(user=self.request.user).order_by(
            "done", "-created_at"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


def _profile_block(user):
    profile = getattr(user, "profile", None)
    block = {
        "display_name": "",
        "mode": None,
        "birth_date": None,
        "delivery_type": None,
        "feeding": None,
        "postpartum_day": None,
        "postpartum_week": None,
    }
    if profile is None:
        return block
    block.update(
        {
            "display_name": profile.display_name,
            "mode": profile.mode,
            "birth_date": profile.birth_date.isoformat() if profile.birth_date else None,
            "delivery_type": profile.delivery_type,
            "feeding": profile.feeding,
        }
    )
    if profile.mode == "postpartum" and profile.birth_date:
        days = (timezone.localdate() - profile.birth_date).days
        if days >= 0:
            block["postpartum_day"] = days
            block["postpartum_week"] = days // 7 + 1
    return block


def _tracking_block(user, since):
    """Aggregate check-ins + EPDS in [since, today] (SPEC section 5 names)."""
    empty = {
        "mood_sleep": {"days": 0, "avg_mood": None, "avg_sleep_hours": None},
        "symptoms": [],
        "red_flags": [],
        "epds": {"history": [], "trend": None},
    }
    if DailyCheckIn is None and EPDSAssessment is None:
        return empty
    points = []
    if DailyCheckIn is not None:
        for row in DailyCheckIn.objects.filter(user=user, date__gte=since).order_by(
            "date"
        ):
            sleep = row.sleep_hours
            points.append(
                CheckInPoint(
                    date=row.date,
                    mood=row.mood,
                    sleep_hours=float(sleep) if sleep is not None else None,
                    symptoms=list(row.symptoms or []),
                    red_flags=list(row.red_flags or []),
                )
            )
    epds_points = []
    history = []
    if EPDSAssessment is not None:
        for row in (
            EPDSAssessment.objects.filter(user=user, created_at__date__gte=since)
            .order_by("created_at")
        ):
            day = row.created_at.date()
            epds_points.append(
                EpdsPoint(date=day, total=row.total, risk_level=row.risk_level)
            )
            history.append(
                {
                    "date": day.isoformat(),
                    "total": row.total,
                    "risk_level": row.risk_level,
                }
            )
    trend = epds_trend(epds_points)
    return {
        "mood_sleep": mood_sleep_summary(points),
        "symptoms": symptom_frequency(points),
        "red_flags": red_flags_seen(points),
        "epds": {
            "history": history,
            "trend": trend,
        },
    }


class VisitReportView(APIView):
    """GET /reports/visit?weeks=2|4|6 (K3 data for the printable report)."""

    def get(self, request):
        try:
            weeks = int(request.query_params.get("weeks", 4))
        except (TypeError, ValueError):
            weeks = None
        if weeks not in REPORT_WEEKS:
            return Response(
                {"detail": "weeks must be one of 2, 4, 6."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        since = timezone.localdate() - timedelta(weeks=weeks)
        body = {
            "profile": _profile_block(request.user),
            "weeks": weeks,
            "since": since.isoformat(),
            "wins_count": wins_count(request.user),
            "questions": [
                {"id": q.id, "text": q.text, "done": q.done}
                for q in VisitQuestion.objects.filter(user=request.user).order_by(
                    "created_at"
                )
            ],
        }
        body.update(_tracking_block(request.user, since))
        return Response(body)
