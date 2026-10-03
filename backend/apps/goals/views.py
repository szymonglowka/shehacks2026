"""Goals API (SPEC section 7). Every queryset is scoped to request.user."""
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Goal, GoalLog, GoalTemplate
from .selectors import today_goals
from .serializers import GoalLogSerializer, GoalSerializer, GoalTemplateSerializer


class GoalListCreateView(generics.ListCreateAPIView):
    serializer_class = GoalSerializer

    def get_queryset(self):
        return (
            Goal.objects.filter(user=self.request.user)
            .prefetch_related("logs")
            .order_by("-is_active", "created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GoalSerializer

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user).prefetch_related("logs")


class GoalLogView(APIView):
    serializer_class = GoalLogSerializer

    def post(self, request, pk):
        try:
            goal = Goal.objects.get(user=request.user, pk=pk)
        except Goal.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        log_date = request.data.get("date") or timezone.localdate().isoformat()
        completed = request.data.get("completed", True)
        serializer = GoalLogSerializer(
            data={"date": log_date, "completed": completed}
        )
        serializer.is_valid(raise_exception=True)
        log, _ = GoalLog.objects.update_or_create(
            goal=goal,
            date=serializer.validated_data["date"],
            defaults={"completed": serializer.validated_data["completed"]},
        )
        return Response(GoalLogSerializer(log).data, status=status.HTTP_200_OK)


class TodayGoalsView(APIView):
    serializer_class = GoalSerializer

    def get(self, request):
        goals = Goal.objects.filter(user=request.user, is_active=True).prefetch_related(
            "logs"
        )
        # Reuse the shared selector ordering (oldest first).
        wanted = {goal.pk for goal in today_goals(request.user)}
        ordered = sorted(
            [goal for goal in goals if goal.pk in wanted],
            key=lambda goal: goal.created_at,
        )
        return Response(GoalSerializer(ordered, many=True).data)


def _postpartum_week(profile):
    if profile.mode != "postpartum" or not profile.birth_date:
        return None
    days = (timezone.localdate() - profile.birth_date).days
    if days < 0:
        return None
    return days // 7 + 1


class RecommendedGoalsView(APIView):
    serializer_class = GoalTemplateSerializer

    def get(self, request):
        profile = getattr(request.user, "profile", None)
        templates = GoalTemplate.objects.all()
        if profile is not None:
            templates = templates.filter(mode__in=[profile.mode, "both"])
            week = _postpartum_week(profile)
            if week is not None:
                templates = templates.exclude(min_week__gt=week).exclude(
                    max_week__lt=week
                )
            # delivery_types == [] means "all"; otherwise must contain the type.
            wanted = []
            for template in templates.order_by("id"):
                if template.delivery_types and (
                    profile.delivery_type not in template.delivery_types
                ):
                    continue
                wanted.append(template.pk)
            templates = GoalTemplate.objects.filter(pk__in=wanted).order_by("id")
            added = set(
                Goal.objects.filter(user=request.user, template__isnull=False).values_list(
                    "template_id", flat=True
                )
            )
            templates = [t for t in templates if t.pk not in added]
        serializer = GoalTemplateSerializer(
            templates, many=True, context={"request": request}
        )
        return Response(serializer.data)
