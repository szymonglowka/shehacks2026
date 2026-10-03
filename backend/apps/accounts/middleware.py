from datetime import timedelta

from django.db.models import Q
from django.utils import timezone


class LastSeenMiddleware:
    """Bumps Profile.last_seen_at at most every 5 minutes (SPEC section 5)."""

    WINDOW = timedelta(minutes=5)

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        user = getattr(request, "user", None)
        # user.pk is None after account deletion (Model.delete nulls it).
        if user is not None and user.is_authenticated and user.pk is not None:
            from .models import Profile

            cutoff = timezone.now() - self.WINDOW
            Profile.objects.filter(user_id=user.pk).filter(
                Q(last_seen_at__isnull=True) | Q(last_seen_at__lt=cutoff)
            ).update(last_seen_at=timezone.now())
        return response
