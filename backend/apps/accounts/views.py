"""Auth, /me, export, onboarding endpoints per SPEC section 7."""
import importlib

from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .onboarding import (
    WORSENING_FACTOR_CODES,
    WORSENING_FACTORS,
    get_coping_strategies,
    get_goal_templates,
)
from .serializers import (
    PROFILE_FIELDS,
    ProfileSerializer,
    RegisterSerializer,
    UserSerializer,
)

EXPORT_APPS = [
    "accounts",
    "tracking",
    "insights",
    "support",
    "circle",
    "journal",
    "goals",
    "notifications",
    "content",
]


class RegisterView(generics.CreateAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(serializer.to_response(user), status=status.HTTP_201_CREATED)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        profile_data = request.data.get("profile", request.data)
        allowed = {k: v for k, v in profile_data.items() if k in PROFILE_FIELDS}
        serializer = ProfileSerializer(request.user.profile, data=allowed, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    def delete(self, request):
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExportView(APIView):
    def get(self, request):
        data = {}
        for app in EXPORT_APPS:
            try:
                mod = importlib.import_module(f"apps.{app}.export")
            except ImportError:
                continue
            fn = getattr(mod, "export_user_data", None)
            if fn is not None:
                data[app] = fn(request.user)
        return Response({"user": UserSerializer(request.user).data, "data": data})


class OnboardingOptionsView(APIView):
    def get(self, request):
        mode = request.query_params.get("mode") or None
        week = request.query_params.get("week")
        week = int(week) if week is not None and str(week).isdigit() else None
        delivery_type = request.query_params.get("delivery_type") or None
        return Response(
            {
                "coping_strategies": get_coping_strategies(),
                "worsening_factors": WORSENING_FACTORS,
                "goal_templates": get_goal_templates(
                    mode=mode, week=week, delivery_type=delivery_type
                ),
            }
        )


class OnboardingCompleteView(APIView):
    @transaction.atomic
    def post(self, request):
        payload = request.data
        profile = request.user.profile

        factors = payload.get("worsening_factors", None)
        if factors is not None:
            unknown = [f for f in factors if f not in WORSENING_FACTOR_CODES]
            if unknown:
                return Response(
                    {"detail": "Unknown worsening factors.", "errors": {"worsening_factors": unknown}},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        profile_data = payload.get("profile", {})
        allowed = {k: v for k, v in profile_data.items() if k in PROFILE_FIELDS}
        serializer = ProfileSerializer(profile, data=allowed, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        if factors is not None:
            profile.worsening_factors = list(factors)
            profile.save(update_fields=["worsening_factors", "updated_at"])

        self._apply_coping_scores(request.user, payload.get("coping_scores", {}))
        self._apply_trusted_contact(request.user, payload.get("trusted_contact"))
        self._apply_goals(request.user, payload.get("goal_template_ids", []), payload.get("custom_goals", []))

        profile.onboarding_completed = True
        profile.save(update_fields=["onboarding_completed", "updated_at"])
        return Response({"user": UserSerializer(request.user).data})

    def _apply_coping_scores(self, user, scores):
        if not scores:
            return
        try:
            from apps.support.models import (
                CopingStrategy,
                UserCopingPreference,
            )
        except ImportError:
            return  # TODO selector: support models not merged yet; scores accepted, stored later
        for code, score in scores.items():
            if not isinstance(score, int) or score not in (0, 1, 2, 3):
                continue
            strategy = CopingStrategy.objects.filter(code=code).first()
            if strategy is None:
                continue
            UserCopingPreference.objects.update_or_create(
                user=user,
                strategy=strategy,
                defaults={"survey_score": score},
            )

    def _apply_trusted_contact(self, user, contact):
        if not contact:
            return
        try:
            from apps.support.models import TrustedContact
        except ImportError:
            return
        TrustedContact.objects.create(
            user=user,
            name=contact.get("name", ""),
            relation=contact.get("relation", ""),
            phone=contact.get("phone", ""),
            preferred_channel=contact.get("preferred_channel", "sms"),
            default_message=contact.get("default_message", ""),
        )

    def _apply_goals(self, user, template_ids, custom_goals):
        if not template_ids and not custom_goals:
            return
        try:
            from apps.goals.models import Goal, GoalTemplate
        except ImportError:
            return
        for template in GoalTemplate.objects.filter(pk__in=template_ids):
            Goal.objects.get_or_create(
                user=user,
                template=template,
                defaults={
                    "title": template.title_pl,
                    "category": template.category,
                    "frequency": template.frequency,
                    "target_count": template.target_count,
                },
            )
        for item in custom_goals:
            if not item.get("title"):
                continue
            Goal.objects.create(
                user=user,
                template=None,
                title=item["title"][:200],
                description=item.get("description", ""),
                category=item.get("category", "selfcare"),
                frequency=item.get("frequency", "daily"),
                target_count=item.get("target_count", 1),
            )
