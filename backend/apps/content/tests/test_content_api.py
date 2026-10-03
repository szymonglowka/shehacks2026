"""Content API tests: articles, specialists, selector, isolation (SPEC section 7)."""
from datetime import timedelta

import pytest
from django.core.management import call_command
from django.utils import timezone

from apps.content.export import export_user_data
from apps.content.models import Article, Specialist
from apps.content.selectors import article_of_the_day


@pytest.fixture
def catalogue(db):
    call_command("seed_content")
    return True


def test_articles_require_auth(api_client, catalogue):
    assert api_client.get("/api/v1/articles").status_code == 401


def test_article_list_paginated_and_localized(auth_client, catalogue):
    body = auth_client.get("/api/v1/articles").json()
    assert body["count"] == 16
    assert len(body["results"]) == 16
    first = body["results"][0]
    assert first["slug"] == "baby-blues-a-depresja-poporodowa"
    assert "Poporodowa" in first["title"] or "poporodowa" in first["title"]
    assert "Źródła" in first["body"]
    assert first["cover_image"].endswith(".jpg")


def test_article_list_english(auth_client, catalogue):
    body = auth_client.get("/api/v1/articles", HTTP_ACCEPT_LANGUAGE="en").json()
    first = body["results"][0]
    assert "postpartum depression" in first["title"].lower()
    assert "Sources" in first["body"]


def test_article_filters(auth_client, catalogue):
    sleep = auth_client.get("/api/v1/articles?category=sleep").json()
    assert sleep["count"] >= 1
    assert {item["category"] for item in sleep["results"]} == {"sleep"}
    cycle = auth_client.get("/api/v1/articles?mode=cycle").json()
    assert cycle["count"] >= 1
    assert {item["mode"] for item in cycle["results"]} == {"cycle"}


def test_article_detail_and_404(auth_client, catalogue):
    body = auth_client.get("/api/v1/articles/jak-wspierac-mame").json()
    assert body["slug"] == "jak-wspierac-mame"
    assert "Biorę to" in body["body"]
    assert auth_client.get("/api/v1/articles/no-such-slug").status_code == 404


def test_specialist_filters(auth_client, catalogue):
    body = auth_client.get("/api/v1/specialists").json()
    assert body["count"] == 10
    assert all(item["is_sample"] is True for item in body["results"])
    psy = auth_client.get("/api/v1/specialists?specialty=psychologist").json()
    assert psy["count"] >= 1
    assert {item["specialty"] for item in psy["results"]} == {"psychologist"}
    waw = auth_client.get("/api/v1/specialists?city=Warszawa").json()
    assert waw["count"] >= 1
    assert {item["city"] for item in waw["results"]} == {"Warszawa"}
    online = auth_client.get("/api/v1/specialists?online=true").json()
    assert online["count"] >= 1
    assert all(item["online"] for item in online["results"])
    offline = auth_client.get("/api/v1/specialists?online=false").json()
    assert all(not item["online"] for item in offline["results"])


def test_catalogue_read_only_and_shared(auth_client, user, catalogue):
    assert auth_client.post("/api/v1/articles", {}, format="json").status_code == 405
    mine = auth_client.get("/api/v1/articles").json()
    assert "email" not in str(mine).lower() or "@" not in str(mine)
    assert mine["count"] == Article.objects.count() == 16
    assert Specialist.objects.count() == 10


def test_article_of_the_day_postpartum(auth_client, user, catalogue):
    profile = user.profile
    profile.mode = "postpartum"
    profile.birth_date = timezone.localdate() - timedelta(days=39)
    profile.save()
    first = article_of_the_day(user, "pl")
    second = article_of_the_day(user, "pl")
    assert first is not None and first == second
    assert first["slug"] in set(Article.objects.values_list("slug", flat=True))
    assert first["title"]
    assert first["summary"]


def test_article_of_the_day_cycle_and_empty(auth_client, user, catalogue):
    profile = user.profile
    profile.mode = "cycle"
    profile.birth_date = None
    profile.save()
    card = article_of_the_day(user, "en")
    assert card is not None
    assert Article.objects.get(slug=card["slug"]).mode != "postpartum"
    Article.objects.all().delete()
    assert article_of_the_day(user, "pl") is None


def test_export_returns_no_user_data(user):
    assert export_user_data(user) == {}
