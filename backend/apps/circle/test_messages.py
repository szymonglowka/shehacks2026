"""Tests for circle.messages (pure, no Django needed)."""

import json
from pathlib import Path

try:  # project convention after checkpoint-0 (backend/ on sys.path)
    from apps.circle.messages import (
        build_contact_message,
        normalize_phone_for_whatsapp,
        pick_template,
        render_text,
    )
except ImportError:  # before checkpoint-0: namespace packages from repo root
    from backend.apps.circle.messages import (
        build_contact_message,
        normalize_phone_for_whatsapp,
        pick_template,
        render_text,
    )

FIXTURE = json.loads(
    (Path(__file__).parent / "fixtures" / "message_templates.json").read_text()
)["templates"]


def test_picks_tone_and_lang():
    t = pick_template(FIXTURE, tone="motivating", lang="en")
    assert t["tone"] == "motivating"
    assert "favour" in t["text"] or "20 minutes" in t["text"] or "Teamwork" in t["text"]


def test_fallbacks_to_gentle_pl():
    t = pick_template(FIXTURE, tone="nope", lang="de")
    assert t["tone"] == "gentle"
    assert t["text"]  # non-empty Polish fallback


def test_explicit_template_id_wins_over_tone():
    t = pick_template(FIXTURE, tone="motivating", template_id="just_there")
    assert t["id"] == "just_there"
    assert t["tone"] == "gentle"


def test_unknown_template_id_falls_back_to_first():
    t = pick_template(FIXTURE, template_id="does-not-exist")
    assert t["id"] == FIXTURE[0]["id"]


def test_renders_task_placeholder():
    text = render_text("Could you take {task}?", task="the night feed")
    assert text == "Could you take the night feed?"
    assert "…" in render_text("Could you take {task}?", task=None)


def test_text_without_placeholder_untouched():
    assert render_text("Just checking in.", task="x") == "Just checking in."


def test_whatsapp_normalization():
    assert normalize_phone_for_whatsapp("+48 123 456 789") == "48123456789"
    assert normalize_phone_for_whatsapp("123456789") == "48123456789"
    assert normalize_phone_for_whatsapp("+1-202-555-0100") == "12025550100"


def test_build_contact_message_urls():
    msg = build_contact_message(
        FIXTURE, "+48 123 456 789", tone="gentle", lang="pl", task="obiad"
    )
    assert "obiad" in msg["text"]
    assert msg["sms_url"].startswith("sms:+48 123 456 789?&body=")
    assert msg["whatsapp_url"].startswith("https://wa.me/48123456789?text=")
    # Round-trip: the encoded body decodes back to the text.
    from urllib.parse import unquote

    assert unquote(msg["whatsapp_url"].split("text=", 1)[1]) == msg["text"]
    assert unquote(msg["sms_url"].split("body=", 1)[1]) == msg["text"]


def test_message_never_empty():
    for tone in ("gentle", "motivating"):
        for lang in ("pl", "en"):
            msg = build_contact_message(FIXTURE, "123456789", tone=tone, lang=lang)
            assert msg["text"].strip()
