"""Circle API (SPEC sections 6.8, 7). Mum endpoints need auth; /circle/public/* are open."""
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CareRequest, CircleLink
from .public import build_public_payload
from .serializers import (
    CareRequestSerializer,
    CircleLinkSerializer,
    ClaimSerializer,
)

try:
    from apps.notifications.services import notify
except ImportError:  # notifications app not merged yet
    notify = None

try:
    from apps.tracking.selectors import mood_today
except ImportError:  # tracking selectors not merged yet
    mood_today = None


def _get_link_or_404(token):
    try:
        return CircleLink.objects.select_related("user__profile").get(
            token=token, revoked_at__isnull=True
        )
    except (CircleLink.DoesNotExist, ValueError, ValidationError):
        return None


def _active_link(user):
    return (
        CircleLink.objects.filter(user=user, revoked_at__isnull=True)
        .order_by("-created_at")
        .first()
    )


def _today_mood(user):
    if mood_today is None:
        return None
    try:
        return mood_today(user)
    except Exception:
        return None


def _public_payload(link):
    requests = (
        CareRequest.objects.filter(
            user=link.user, status__in=("open", "claimed", "done")
        )
        .order_by("created_at")
        .values("id", "title", "category", "when_label", "status", "claimed_by_name")
    )
    profile = getattr(link.user, "profile", None)
    return build_public_payload(
        mom_name=getattr(profile, "display_name", "") or "",
        requests=list(requests),
        share_mood=link.share_mood,
        mood=_today_mood(link.user),
    )


class CircleLinkView(APIView):
    """GET/POST/PATCH/DELETE /circle/link (mum only)."""

    def get(self, request):
        link = _active_link(request.user)
        if link is None:
            return Response(
                {"detail": "No active link."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(CircleLinkSerializer(link).data)

    def post(self, request):
        now = timezone.now()
        CircleLink.objects.filter(user=request.user, revoked_at__isnull=True).update(
            revoked_at=now
        )
        link = CircleLink.objects.create(user=request.user)
        return Response(CircleLinkSerializer(link).data, status=status.HTTP_201_CREATED)

    def patch(self, request):
        link = _active_link(request.user)
        if link is None:
            return Response(
                {"detail": "No active link."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = CircleLinkSerializer(link, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request):
        link = _active_link(request.user)
        if link is None:
            return Response(
                {"detail": "No active link."}, status=status.HTTP_404_NOT_FOUND
            )
        link.revoked_at = timezone.now()
        link.save(update_fields=["revoked_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class CareRequestViewSet(viewsets.ModelViewSet):
    serializer_class = CareRequestSerializer

    def get_queryset(self):
        return CareRequest.objects.filter(user=self.request.user).order_by(
            "-created_at"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PublicCircleView(APIView):
    """GET /circle/public/{token} (AllowAny; revoked token -> 404)."""

    permission_classes = (permissions.AllowAny,)

    def get(self, request, token):
        link = _get_link_or_404(token)
        if link is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(_public_payload(link))


class PublicClaimView(APIView):
    """POST /circle/public/{token}/requests/{id}/claim {name} (AllowAny)."""

    permission_classes = (permissions.AllowAny,)

    def post(self, request, token, pk):
        link = _get_link_or_404(token)
        if link is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            care = CareRequest.objects.get(user=link.user, pk=pk)
        except CareRequest.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if care.status != "open":
            return Response(
                {"detail": "Already claimed."}, status=status.HTTP_400_BAD_REQUEST
            )
        serializer = ClaimSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        care.status = "claimed"
        care.claimed_by_name = serializer.validated_data["name"]
        care.claimed_at = timezone.now()
        care.save()
        if notify is not None:
            notify(
                link.user,
                "system",
                f"{care.claimed_by_name} wziął/wzięła: {care.title}",
                f"{care.claimed_by_name} wziął/wzięła: {care.title}",
                url="/support",
            )
        return Response(_public_payload(link))


class PublicDoneView(APIView):
    """POST /circle/public/{token}/requests/{id}/done (AllowAny)."""

    permission_classes = (permissions.AllowAny,)

    def post(self, request, token, pk):
        link = _get_link_or_404(token)
        if link is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            care = CareRequest.objects.get(user=link.user, pk=pk)
        except CareRequest.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if care.status not in ("open", "claimed"):
            return Response(
                {"detail": "Already finished."}, status=status.HTTP_400_BAD_REQUEST
            )
        care.status = "done"
        care.done_at = timezone.now()
        care.save()
        if notify is not None:
            notify(
                link.user,
                "system",
                f"Gotowe: {care.title}",
                f"Gotowe: {care.title}",
                url="/support",
            )
        return Response(_public_payload(link))
