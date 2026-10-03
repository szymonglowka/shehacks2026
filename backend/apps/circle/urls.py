from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    CareRequestViewSet,
    CircleLinkView,
    PublicCircleView,
    PublicClaimView,
    PublicDoneView,
)

router = SimpleRouter(trailing_slash=False)
router.register("circle/requests", CareRequestViewSet, basename="care-request")

urlpatterns = [
    path("circle/link", CircleLinkView.as_view(), name="circle-link"),
    path(
        "circle/public/<uuid:token>",
        PublicCircleView.as_view(),
        name="circle-public",
    ),
    path(
        "circle/public/<uuid:token>/requests/<int:pk>/claim",
        PublicClaimView.as_view(),
        name="circle-public-claim",
    ),
    path(
        "circle/public/<uuid:token>/requests/<int:pk>/done",
        PublicDoneView.as_view(),
        name="circle-public-done",
    ),
] + router.urls
