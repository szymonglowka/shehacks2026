"""Tests for circle.public (pure, no Django needed)."""

try:  # project convention after checkpoint-0 (backend/ on sys.path)
    from apps.circle.public import (
        MOOD_DISPLAY,
        build_public_payload,
        mood_display,
        public_request,
    )
except ImportError:  # before checkpoint-0: namespace packages from repo root
    from backend.apps.circle.public import (
        MOOD_DISPLAY,
        build_public_payload,
        mood_display,
        public_request,
    )


def full_request(**overrides):
    row = {
        "id": 7,
        "title": "Obiad na czwartek",
        "category": "meal",
        "when_label": "czw. wieczorem",
        "when_date": "2026-10-08",
        "note": "SECRET note for mum only",
        "status": "open",
        "claimed_by_name": None,
        "user_id": 42,
        "symptoms": ["fever"],
        "epds_total": 14,
    }
    row.update(overrides)
    return row


def test_public_request_strips_everything_off_allowlist():
    public = public_request(full_request())
    assert public == {
        "id": 7,
        "title": "Obiad na czwartek",
        "category": "meal",
        "when_label": "czw. wieczorem",
        "status": "open",
        "claimed_by_name": None,
    }
    for leaked in ("note", "when_date", "user_id", "symptoms", "epds_total"):
        assert leaked not in public


def test_never_leaks_tracking_data_even_if_joined_in():
    payload = build_public_payload(
        "Marta",
        [full_request(note="encrypted?", symptoms=["x"], epds_total=20)],
    )
    dumped = str(payload)
    assert "encrypted?" not in dumped
    assert "symptoms" not in dumped
    assert "epds_total" not in dumped
    assert payload["mom_name"] == "Marta"


def test_cancelled_requests_stay_hidden():
    payload = build_public_payload(
        "Marta",
        [
            full_request(id=1, status="open"),
            full_request(id=2, status="cancelled"),
            full_request(id=3, status="claimed", claimed_by_name="Tomek"),
            full_request(id=4, status="done", claimed_by_name="Tomek"),
        ],
    )
    assert [r["id"] for r in payload["requests"]] == [1, 3, 4]


def test_mood_only_when_shared_and_no_raw_number_leaks():
    payload = build_public_payload("Marta", [], share_mood=True, mood=2)
    assert payload["mood"] == {"color": "#dfb48f", "label": "low"}
    assert "2" not in str(payload["mood"].values())
    assert "mood" not in build_public_payload("Marta", [], share_mood=False, mood=2)
    assert "mood" not in build_public_payload("Marta", [], share_mood=True)
    assert "mood" not in build_public_payload("Marta", [], share_mood=True, mood=9)


def test_mood_scale_matches_screens():
    assert set(MOOD_DISPLAY) == {1, 2, 3, 4, 5}
    assert mood_display(1) == {"color": "#c98b6b", "label": "very_low"}
    assert mood_display(5) == {"color": "#7fa891", "label": "great"}
    assert mood_display(None) is None


def test_empty_circle_is_valid_payload():
    assert build_public_payload("Marta", []) == {"mom_name": "Marta", "requests": []}
