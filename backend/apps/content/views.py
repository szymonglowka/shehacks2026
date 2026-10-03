"""Content API (SPEC section 7): article catalogue + sample specialists."""
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Article, Specialist
from .serializers import ArticleSerializer, SpecialistSerializer


class ContentPagination(PageNumberPagination):
    page_size = 20


class ArticleListView(generics.ListAPIView):
    serializer_class = ArticleSerializer
    pagination_class = ContentPagination

    def get_queryset(self):
        queryset = Article.objects.all().order_by("id")
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)
        mode = self.request.query_params.get("mode")
        if mode:
            queryset = queryset.filter(mode=mode)
        return queryset


class ArticleDetailView(APIView):
    def get(self, request, slug):
        try:
            article = Article.objects.get(slug=slug)
        except Article.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ArticleSerializer(article, context={"request": request}).data)


class SpecialistListView(generics.ListAPIView):
    serializer_class = SpecialistSerializer
    pagination_class = ContentPagination

    def get_queryset(self):
        queryset = Specialist.objects.all().order_by("id")
        params = self.request.query_params
        if params.get("specialty"):
            queryset = queryset.filter(specialty=params.get("specialty"))
        if params.get("city"):
            queryset = queryset.filter(city=params.get("city"))
        if params.get("online") in ("true", "1"):
            queryset = queryset.filter(online=True)
        elif params.get("online") in ("false", "0"):
            queryset = queryset.filter(online=False)
        return queryset
