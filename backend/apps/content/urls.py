from django.urls import path

from .views import ArticleDetailView, ArticleListView, SpecialistListView

urlpatterns = [
    path("articles", ArticleListView.as_view(), name="article-list"),
    path("articles/<slug:slug>", ArticleDetailView.as_view(), name="article-detail"),
    path("specialists", SpecialistListView.as_view(), name="specialist-list"),
]
