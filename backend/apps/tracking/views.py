"""Tracking API (SPEC section 7). Every queryset is scoped to request.user."""
from datetime import date, timedelta

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.i18n import get_lang

from . import epds as epds_module
from .models import DailyCheckIn, EPDSAssessment, Period
from .risk import RiskContext, RiskResult, evaluate_risk
from .selectors import cycle_status_for
from .serializers import (
    DailyCheckInSerializer,
    EPDSAssessmentSerializer,
    PeriodSerializer,
)

# An EPDS older than this no longer feeds check-in risk (SPEC cadence: 14 d).
EPDS_FRESH_DAYS = 14


def risk_to_dict(result: RiskResult) -> dict:
    return {
        "level": result.level,
        "reasons": list(result.reasons),
        "actions": list(result.actions),
    }


def _postpartum_day(profile, today) -> int | None:
    if profile.mode != "postpartum" or profile.birth_date is None:
        return None
    return (today - profile.birth_date).days


def _recent_moods(user, limit=4) -> tuple:
    moods = list(
        DailyCheckIn.objects.filter(user=user)
        .order_by("-date")
        .values_list("mood", flat=True)[:limit]
    )
    return tuple(m for m in reversed(moods) if m is not None)


def _fresh_epds(user, today):
    latest = EPDSAssessment.objects.filter(user=user).order_by("-created_at").first()
    if latest is None:
        return None
    if (today - timezone.localtime(latest.created_at).date()).days > EPDS_FRESH_DAYS:
        return None
    return latest


def risk_after_checkin(user, checkin: DailyCheckIn) -> RiskResult:
    """Risk for a saved check-in (fresh EPDS included when available)."""
    today = timezone.localdate()
    profile = user.profile
    fresh = _fresh_epds(user, today)
    return evaluate_risk(
        RiskContext(
            red_flags=tuple(checkin.red_flags or []),
            recent_moods=_recent_moods(user),
            mode=profile.mode,
            postpartum_day=_postpartum_day(profile, today),
            anxiety_today=checkin.anxiety,
            epds_total=fresh.total if fresh else None,
            epds_self_harm=fresh.self_harm_score if fresh else None,
        )
    )


def risk_after_epds(user, total: int, self_harm: int) -> RiskResult:
    """Risk for a fresh EPDS (plus today's check-in signals when present)."""
    today = timezone.localdate()
    profile = user.profile
    checkin = DailyCheckIn.objects.filter(user=user, date=today).first()
    return evaluate_risk(
        RiskContext(
            red_flags=tuple(checkin.red_flags or []) if checkin else (),
            recent_moods=_recent_moods(user),
            mode=profile.mode,
            postpartum_day=_postpartum_day(profile, today),
            anxiety_today=checkin.anxiety if checkin else None,
            epds_total=total,
            epds_self_harm=self_harm,
        )
    )


def _parse_date(value: str) -> date | None:
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        return None


class CheckinListView(APIView):
    def get(self, request):
        qs = DailyCheckIn.objects.filter(user=request.user)
        date_from = _parse_date(request.query_params.get("from") or "")
        date_to = _parse_date(request.query_params.get("to") or "")
        if request.query_params.get("from") and date_from is None:
            return Response(
                {"detail": "Invalid date.", "errors": {"from": ["Use YYYY-MM-DD."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if request.query_params.get("to") and date_to is None:
            return Response(
                {"detail": "Invalid date.", "errors": {"to": ["Use YYYY-MM-DD."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if date_from is None:
            date_from = timezone.localdate() - timedelta(days=30)
        qs = qs.filter(date__gte=date_from)
        if date_to is not None:
            qs = qs.filter(date__lte=date_to)
        return Response(DailyCheckInSerializer(qs.order_by("date"), many=True).data)


class CheckinDetailView(APIView):
    def _get_day(self, day: str):
        parsed = _parse_date(day)
        if parsed is None:
            return None, Response(
                {"detail": "Invalid date.", "errors": {"date": ["Use YYYY-MM-DD."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return parsed, None

    def get(self, request, day):
        parsed, error = self._get_day(day)
        if error is not None:
            return error
        try:
            checkin = DailyCheckIn.objects.get(user=request.user, date=parsed)
        except DailyCheckIn.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(DailyCheckInSerializer(checkin).data)

    def put(self, request, day):
        parsed, error = self._get_day(day)
        if error is not None:
            return error
        if parsed > timezone.localdate():
            return Response(
                {"detail": "Cannot check in for a future date.",
                 "errors": {"date": ["Date is in the future."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        checkin, _ = DailyCheckIn.objects.get_or_create(
            user=request.user, date=parsed
        )
        serializer = DailyCheckInSerializer(checkin, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        checkin.refresh_from_db()
        return Response(
            {
                "checkin": DailyCheckInSerializer(checkin).data,
                "risk": risk_to_dict(risk_after_checkin(request.user, checkin)),
            }
        )


class CycleStatusView(APIView):
    def get(self, request):
        return Response(cycle_status_for(request.user))


class PeriodListCreateView(generics.ListCreateAPIView):
    serializer_class = PeriodSerializer

    def get_queryset(self):
        return Period.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PeriodDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PeriodSerializer
    http_method_names = ("patch", "delete", "head", "options")

    def get_queryset(self):
        return Period.objects.filter(user=self.request.user)


class PeriodReturnedView(APIView):
    """SPEC §3: "Wróciła mi miesiączka" — first period switches to cycle mode."""

    def post(self, request):
        serializer = PeriodSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        period = serializer.save(user=request.user)
        profile = request.user.profile
        profile.mode = "cycle"
        profile.period_returned = True
        profile.save(update_fields=["mode", "period_returned", "updated_at"])
        return Response(
            {"mode": profile.mode, "period": PeriodSerializer(period).data},
            status=status.HTTP_201_CREATED,
        )


class EPDSQuestionsView(APIView):
    def get(self, request):
        return Response(epds_module.get_questions(get_lang(request)))


class EPDSListCreateView(APIView):
    def get(self, request):
        assessments = EPDSAssessment.objects.filter(user=request.user)
        return Response(EPDSAssessmentSerializer(assessments, many=True).data)

    def post(self, request):
        answers = request.data.get("answers")
        try:
            result = epds_module.score_answers(answers or [])
        except (ValueError, TypeError):
            return Response(
                {"detail": "Invalid answers.",
                 "errors": {"answers": ["Provide exactly 10 answers, each 0-3."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        assessment = EPDSAssessment.objects.create(
            user=request.user,
            answers=list(answers),
            total=result.total,
            self_harm_score=result.self_harm_score,
            risk_level=result.risk_level,
        )
        risk = risk_after_epds(request.user, result.total, result.self_harm_score)
        return Response(
            {
                "assessment": EPDSAssessmentSerializer(assessment).data,
                "risk": risk_to_dict(risk),
            },
            status=status.HTTP_201_CREATED,
        )


class EPDSDueView(APIView):
    def get(self, request):
        today = timezone.localdate()
        latest = EPDSAssessment.objects.filter(user=request.user).first()
        # NOTE (b-care cross-area fix): created_at is UTC; .date() on it uses
        # the UTC day, but `today` is the user's local day. Convert first so
        # the suite is green at every hour (was red 22:00-00:00 UTC).
        last_at = (
            timezone.localtime(latest.created_at).date() if latest else None
        )
        return Response(
            {
                "due": epds_module.is_due(request.user.profile.mode, last_at, today),
                "last_at": last_at.isoformat() if last_at else None,
            }
        )
