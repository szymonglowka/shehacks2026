"""Fixture contract tests for the content app (Django-free, stdlib only).

These guard the editorial deliverable from docs/AGENT_PROMPTS.md (b-content):
16 bilingual articles (400-700 words per body, sources section, partner slug
`jak-wspierac-mame`) and 10 fictional sample specialists.

Runs under plain pytest; no Django settings required.
"""
import json
from pathlib import Path

FIXTURES = Path(__file__).parent / "fixtures"

ARTICLE_FIELDS = {
    "slug", "title_pl", "title_en", "summary_pl", "summary_en",
    "body_pl", "body_en", "category", "mode", "min_week", "max_week",
    "reading_minutes", "cover_emoji", "cover_image",
}
CATEGORIES = {
    "postpartum_recovery", "mental_health", "cycle", "movement",
    "sleep", "nutrition", "relationships", "breastfeeding",
}
MODES = {"postpartum", "cycle", "both"}

REQUIRED_TOPICS = {
    "baby-blues-a-depresja-poporodowa",
    "sen-z-noworodkiem",
    "dno-miednicy-podstawy",
    "powrot-do-siebie-po-cesarskim-cieciu",
    "rozejscie-miesnia-prostego-brzucha",
    "karmienie-piersia-a-nastroj",
    "powrot-miesiaczki-po-porodzie",
    "nastroj-w-rytmie-cyklu",
    "pms-i-pmdd",
    "jak-prosic-o-pomoc",
    "jak-wspierac-mame",
    "lagodny-ruch-po-porodzie",
    "zywienie-po-porodzie",
    "kotwica-5-4-3-2-1",
    "natretne-mysli-po-porodzie",
    "wspolczucie-dla-siebie",
}

SPECIALIST_FIELDS = {
    "name", "specialty", "city", "online", "phone", "website",
    "description_pl", "description_en", "is_sample",
}


def load(name):
    with open(FIXTURES / name, encoding="utf-8") as fh:
        return json.load(fh)


def test_articles_count_and_slugs():
    articles = load("articles.json")
    assert len(articles) == 16, f"expected 16 articles, got {len(articles)}"
    slugs = [a["fields"]["slug"] for a in articles]
    assert len(set(slugs)) == 16, "article slugs must be unique"
    assert set(slugs) == REQUIRED_TOPICS, (
        f"slug mismatch: missing={REQUIRED_TOPICS - set(slugs)}, "
        f"extra={set(slugs) - REQUIRED_TOPICS}"
    )
    # Partner guide linked from the public circle page.
    assert "jak-wspierac-mame" in slugs


def test_articles_fields_and_taxonomy():
    for entry in load("articles.json"):
        assert entry["model"] == "content.article"
        fields = entry["fields"]
        missing = ARTICLE_FIELDS - set(fields)
        assert not missing, f"{fields.get('slug')}: missing {missing}"
        assert fields["category"] in CATEGORIES, fields["slug"]
        assert fields["mode"] in MODES, fields["slug"]
        lo, hi = fields["min_week"], fields["max_week"]
        if lo is not None and hi is not None:
            assert 1 <= lo <= hi <= 12, fields["slug"]
        assert fields["reading_minutes"] >= 1, fields["slug"]
        for key in ("title_pl", "title_en", "summary_pl", "summary_en",
                    "body_pl", "body_en"):
            assert fields[key].strip(), f"{fields['slug']}: empty {key}"


def test_articles_body_length_and_sources():
    for entry in load("articles.json"):
        fields = entry["fields"]
        for lang, marker in (("body_pl", "Źródła"), ("body_en", "Sources")):
            words = len(fields[lang].split())
            assert 400 <= words <= 700, (
                f"{fields['slug']}/{lang}: {words} words, want 400-700"
            )
            assert marker in fields[lang], (
                f"{fields['slug']}/{lang}: missing sources section"
            )


def test_articles_bodies_are_bilingual_pairs():
    for entry in load("articles.json"):
        fields = entry["fields"]
        pl_len, en_len = len(fields["body_pl"]), len(fields["body_en"])
        ratio = min(pl_len, en_len) / max(pl_len, en_len)
        assert ratio > 0.5, (
            f"{fields['slug']}: bodies differ too much (ratio {ratio:.2f})"
        )


def test_specialists_sample_entries():
    specialists = load("specialists.json")
    assert len(specialists) == 10, (
        f"expected 10 specialists, got {len(specialists)}"
    )
    specialties = set()
    for entry in specialists:
        assert entry["model"] == "content.specialist"
        fields = entry["fields"]
        missing = SPECIALIST_FIELDS - set(fields)
        assert not missing, f"{fields.get('name')}: missing {missing}"
        assert fields["is_sample"] is True, (
            f"{fields['name']}: sample entries must have is_sample=true"
        )
        assert fields["name"].strip() and fields["phone"].strip()
        assert fields["description_pl"].strip()
        assert fields["description_en"].strip()
        specialties.add(fields["specialty"])
    # Per SPEC §4.11 the catalogue covers these professions.
    assert {"midwife", "pelvic_physio", "psychologist", "psychiatrist",
            "lactation"} <= specialties, f"got {specialties}"
