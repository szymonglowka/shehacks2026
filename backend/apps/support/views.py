"""Support API (SPEC section 7). Every queryset is scoped to request.user."""
import json
from functools import lru_cache
from pathlib import Path

from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.circle.messages import build_contact_message

from .models import (
    CopingStrategy,
    Helpline,
    SupportSession,
    TrustedContact,
    UserCopingPreference,
)
from .ranking import apply_feedback, feedback_value
from .selectors import ranked_preferences
from .serializers import (
    CopingScoresSerializer,
    HelplineSerializer,
    SupportSessionCreateSerializer,
    SupportSessionSerializer,
    SupportSessionUpdateSerializer,
    ToolkitStrategySerializer,
    TrustedContactSerializer,
    session_evidence_counts,
)

TEMPLATES_PATH = (
    Path(__file__).resolve().parent.parent / "circle" / "fixtures" / "message_templates.json"
)


@lru_cache(maxsize=1)
def _message_templates():
    try:
        return json.loads(TEMPLATES_PATH.read_text())["templates"]
    except (OSError, ValueError, KeyError):
        return []


class ToolkitView(APIView):
    """GET /support/toolkit: strategies ranked with score + evidence."""

    def get(self, request):
        evidence = session_evidence_counts(request.user)
        items = []
        for strategy, pref, score in ranked_preferences(request.user):
            counts = evidence.get(
                strategy.id, {"used": 0, "helped_yes": 0, "helped_somewhat": 0}
            )
            strategy.score = score
            strategy.used_count = pref.used_count if pref else 0
            strategy.helped_score_sum = pref.helped_score_sum if pref else 0.0
            strategy.evidence = {
                "used": counts["used"],
                "helped_yes": counts["helped_yes"],
                "helped_somewhat": counts["helped_somewhat"],
            }
            items.append(strategy)
        serializer = ToolkitStrategySerializer(
            items, many=True, context={"request": request}
        )
        return Response(serializer.data)


class SessionCreateView(APIView):
    """POST /support/sessions {intensity, trigger} -> {session, risk?}."""

    def post(self, request):
        serializer = SupportSessionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = SupportSession.objects.create(
            user=request.user,
            intensity=serializer.validated_data["intensity"],
            trigger=serializer.validated_data["trigger"],
        )
        body = {"session": SupportSessionSerializer(session).data}
        if session.intensity == 5:
            # Tough-day flow at max intensity: same shape as tracking risk results.
            body["risk"] = {
                "level": "urgent",
                "reasons": ["intensity_5"],
                "actions": ["show_crisis"],
            }
        return Response(body, status=status.HTTP_201_CREATED)


def _unapply_feedback(user, strategy, helped):
    """Remove one session's contribution (repeat PATCH must not double-count)."""
    if strategy is None:
        return
    try:
        pref = UserCopingPreference.objects.get(user=user, strategy=strategy)
    except UserCopingPreference.DoesNotExist:
        return
    if helped is not None:
        pref.helped_score_sum = max(
            0.0, pref.helped_score_sum - feedback_value(helped)
        )
    pref.used_count = max(0, pref.used_count - 1)
    pref.save()


def _apply_feedback_to_pref(user, strategy, helped):
    pref, _ = UserCopingPreference.objects.get_or_create(
        user=user, strategy=strategy
    )
    pref.helped_score_sum, pref.used_count = apply_feedback(
        pref.survey_score, pref.helped_score_sum, pref.used_count, helped
    )
    pref.save()


class SessionUpdateView(APIView):
    """PATCH /support/sessions/{id} {strategy, helped, mood_after}."""

    def patch(self, request, pk):
        try:
            session = SupportSession.objects.get(user=request.user, pk=pk)
        except SupportSession.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = SupportSessionUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        previously_finished = session.ended_at is not None
        old_strategy, old_helped = session.strategy, session.helped
        if "strategy" in data:
            session.strategy = data["strategy"]
        if "helped" in data:
            session.helped = data["helped"]
        if "mood_after" in data:
            session.mood_after = data["mood_after"]
        if session.ended_at is None:
            session.ended_at = timezone.now()
        session.save()
        # Feedback updates the Bayesian ranking counters (SPEC section 5).
        # A repeat PATCH first removes the previous contribution.
        if previously_finished and old_strategy is not None:
            _unapply_feedback(request.user, old_strategy, old_helped)
        if session.strategy is not None:
            _apply_feedback_to_pref(request.user, session.strategy, session.helped)
        return Response(SupportSessionSerializer(session).data)


class PreferencesView(APIView):
    """PUT /support/preferences {coping_scores: {code: 0-3}} (retake survey)."""

    def put(self, request):
        serializer = CopingScoresSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        strategies = {
            s.code: s for s in CopingStrategy.objects.all()
        }
        for code, score in serializer.validated_data["coping_scores"].items():
            UserCopingPreference.objects.update_or_create(
                user=request.user,
                strategy=strategies[code],
                defaults={"survey_score": score},
            )
        return Response({"coping_scores": serializer.validated_data["coping_scores"]})


class TrustedContactViewSet(viewsets.ModelViewSet):
    serializer_class = TrustedContactSerializer

    def get_queryset(self):
        return TrustedContact.objects.filter(user=self.request.user).order_by("id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ContactMessageView(APIView):
    """GET /support/contacts/{id}/message -> {text, sms_url, whatsapp_url}."""

    def get(self, request, pk):
        try:
            contact = TrustedContact.objects.get(user=request.user, pk=pk)
        except TrustedContact.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        profile = getattr(request.user, "profile", None)
        tone = getattr(profile, "tone", None) or "gentle"
        if tone not in ("gentle", "motivating"):
            tone = "gentle"
        from apps.circle.messages import sms_url, whatsapp_url
        from apps.common.i18n import get_lang

        message = build_contact_message(
            _message_templates(),
            contact.phone,
            tone=tone,
            lang=get_lang(request),
            template_id=request.query_params.get("template"),
            task=request.query_params.get("task"),
        )
        if contact.default_message:
            # A custom message replaces the template text (URLs stay valid).
            message["text"] = contact.default_message
            message["sms_url"] = sms_url(contact.phone, message["text"])
            message["whatsapp_url"] = whatsapp_url(contact.phone, message["text"])
        return Response(message)


class HelplineListView(generics.ListAPIView):
    """GET /support/helplines (public, no login needed for /help)."""

    permission_classes = (permissions.AllowAny,)
    serializer_class = HelplineSerializer
    queryset = Helpline.objects.all()
