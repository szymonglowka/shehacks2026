"""Unit tests for notifications.copy (pure, no Django/DB). Run: pytest backend/apps/notifications/test_copy.py."""

import pytest

try:  # project convention after checkpoint-0 (backend/ on sys.path)
    from apps.notifications.copy import KINDS, LANGS, NOTIFICATION_COPY, TONES, get_copy
except ImportError:  # before checkpoint-0: namespace packages from repo root
    from backend.apps.notifications.copy import (
        KINDS,
        LANGS,
        NOTIFICATION_COPY,
        TONES,
        get_copy,
    )

# Never diagnosing, never judging: banned substrings (case-insensitive).
BANNED = ("depresj", "depress", "chorob", "disorder", "diagnozuję", "zaburzen")


def test_every_kind_has_every_tone_and_language():
    assert set(NOTIFICATION_COPY) == set(KINDS)
    for kind in KINDS:
        assert set(NOTIFICATION_COPY[kind]) == set(TONES), kind
        for tone in TONES:
            assert set(NOTIFICATION_COPY[kind][tone]) == set(LANGS), (kind, tone)
            for lang in LANGS:
                entry = NOTIFICATION_COPY[kind][tone][lang]
                assert entry["title"].strip(), (kind, tone, lang)
                assert entry["body"].strip(), (kind, tone, lang)


def test_no_diagnosing_or_judging_wording():
    for kind in KINDS:
        for tone in TONES:
            for lang in LANGS:
                text = (
                    NOTIFICATION_COPY[kind][tone][lang]["title"]
                    + " "
                    + NOTIFICATION_COPY[kind][tone][lang]["body"]
                ).lower()
                for banned in BANNED:
                    assert banned not in text, (kind, tone, lang, banned)


def test_get_copy_substitutes_name():
    rendered = get_copy("goal_reminder", "motivating", "pl", name="Marta")
    assert "Marta" in rendered["body"]
    assert "{name}" not in rendered["title"] + rendered["body"]


def test_get_copy_empty_name_leaves_no_placeholder():
    for kind in KINDS:
        rendered = get_copy(kind)
        assert "{name}" not in rendered["title"] + rendered["body"], kind


def test_get_copy_unknown_kind_raises():
    with pytest.raises(ValueError):
        get_copy("no_such_kind")


def test_get_copy_falls_back_to_gentle_and_polish():
    assert get_copy("goal_reminder", tone="nope") == get_copy("goal_reminder", tone="gentle")
    assert get_copy("goal_reminder", lang="fr") == get_copy("goal_reminder", lang="pl")
