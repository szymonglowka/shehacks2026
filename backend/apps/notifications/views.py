"""Push + notifications API (SPEC section 7). All querysets scoped to request.user."""
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification, PushSubscription
from .serializers import (
    NotificationSerializer,
    PushSubscriptionSerializer,
    VapidPublicKeySerializer,
)
from .services import notify
from .texts import get_copy


class VapidPublicKeyView(APIView):
    serializer_class = VapidPublicKeySerializer

    def get(self, request):
        return Response({"public_key": settings.VAPID_PUBLIC_KEY})


class PushSubscriptionView(APIView):
    serializer_class = PushSubscriptionSerializer

    def post(self, request):
        endpoint = request.data.get("endpoint")
        keys = request.data.get("keys") or {}
        if not endpoint or not keys.get("p256dh") or not keys.get("auth"):
            return Response(
                {"detail": "endpoint and keys.p256dh/auth are required.",
                 "errors": {"endpoint": ["This field is required."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                "user": request.user,
                "p256dh": keys["p256dh"],
                "auth": keys["auth"],
            },
        )
        return Response({"detail": "Subscribed."}, status=status.HTTP_201_CREATED)

    def delete(self, request):
        endpoint = request.data.get("endpoint")
        if not endpoint:
            return Response(
                {"detail": "endpoint is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        PushSubscription.objects.filter(
            user=request.user, endpoint=endpoint
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PushTestView(APIView):
    serializer_class = NotificationSerializer

    def post(self, request):
        profile = getattr(request.user, "profile", None)
        tone = getattr(profile, "tone", "gentle") or "gentle"
        lang = getattr(profile, "language", "pl") or "pl"
        name = getattr(profile, "display_name", "") or ""
        texts = get_copy("system", tone=tone, lang=lang, name=name)
        notification = notify(
            request.user, "system", texts["title"], texts["body"], "/notifications"
        )
        if notification is None:
            return Response(
                {"detail": "Could not send test notification."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(
            NotificationSerializer(notification).data, status=status.HTTP_201_CREATED
        )


class NotificationPagination(PageNumberPagination):
    page_size = 20


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    pagination_class = NotificationPagination

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationReadView(APIView):
    serializer_class = NotificationSerializer

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(user=request.user, pk=pk)
        except Notification.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        notification.read_at = timezone.now()
        notification.save(update_fields=["read_at"])
        return Response(NotificationSerializer(notification).data)


class NotificationReadAllView(APIView):
    serializer_class = NotificationSerializer

    def post(self, request):
        now = timezone.now()
        updated = (
            Notification.objects.filter(user=request.user, read_at__isnull=True).update(
                read_at=now
            )
        )
        return Response({"detail": f"Marked {updated} as read.", "updated": updated})
