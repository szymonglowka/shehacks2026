"""Selectors owned by the content app (see AGENT_PROMPTS.md "shared names").

selectors.article_of_the_day(user, lang) is read by the dashboard (b-track)
via try-import. The ranking rule itself lives in picking.py (Django-free).
"""
from django.utils import timezone

from apps.common.i18n import localized

from .models import Article
from .picking import ArticleCandidate, pick_article_of_the_day


def postpartum_week(user) -> int | None:
    """1-indexed postpartum week, or None outside postpartum mode."""
    profile = getattr(user, "profile", None)
    if profile is None or profile.mode != "postpartum" or not profile.birth_date:
        return None
    days = (timezone.localdate() - profile.birth_date).days
    if days < 0:
        return None
    return days // 7 + 1


def article_of_the_day(user, lang: str = "pl") -> dict | None:
    """Localized article card for the dashboard (None when catalogue empty)."""
    profile = getattr(user, "profile", None)
    mode = getattr(profile, "mode", "postpartum")
    if mode not in ("postpartum", "cycle"):
        mode = "postpartum"
    candidates = [
        ArticleCandidate(
            slug=article.slug,
            mode=article.mode,
            min_week=article.min_week,
            max_week=article.max_week,
        )
        for article in Article.objects.all()
    ]
    slug = pick_article_of_the_day(
        candidates,
        mode=mode,
        postpartum_week=postpartum_week(user),
        day=timezone.localdate(),
    )
    if slug is None:
        return None
    article = Article.objects.get(slug=slug)
    return {
        "slug": article.slug,
        "title": localized(article, "title", lang),
        "summary": localized(article, "summary", lang),
        "category": article.category,
        "mode": article.mode,
        "reading_minutes": article.reading_minutes,
        "cover_emoji": article.cover_emoji,
        "cover_image": article.cover_image,
    }
