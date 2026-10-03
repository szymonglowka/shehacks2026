"""Pure builder for the public circle page payload (SPEC section 6.8, K2).

Django-free: the future ``GET /circle/public/{token}`` view resolves the
``CircleLink`` by token (revoked -> 404), loads the mum's open/claimed
``CareRequest`` rows and optional mood colour, and calls
:func:`build_public_payload`.

Privacy is structural, not by convention: requests are re-built key by key
from an allowlist, so model fields like ``note`` -- and anything joined in
from tracking (symptoms, EPDS, check-ins) -- can never leak, even if the
caller passes them in.
"""

from __future__ import annotations

from typing import Any, Mapping

#: The only CareRequest fields the public page may expose (SPEC section 6.8).
PUBLIC_REQUEST_KEYS = (
    "id",
    "title",
    "category",
    "when_label",
    "status",
    "claimed_by_name",
)

#: Request statuses visible on the public page (cancelled stays hidden).
PUBLIC_STATUSES = ("open", "claimed", "done")


def public_request(data: Mapping[str, Any]) -> dict:
    """Project one request onto the public allowlist."""
    return {key: data.get(key) for key in PUBLIC_REQUEST_KEYS}


#: Mood value (1-5) -> (color, label key) per SCREENS section 4.
#: The frontend translates the label key; the number itself never leaks.
MOOD_DISPLAY = {
    1: ("#c98b6b", "very_low"),
    2: ("#dfb48f", "low"),
    3: ("#e8d9b5", "ok"),
    4: ("#bcd3c2", "good"),
    5: ("#7fa891", "great"),
}


def mood_display(mood: int | None) -> dict | None:
    """``{color, label}`` for today's mood, or None when unknown / not shared."""
    if mood not in MOOD_DISPLAY:
        return None
    color, label = MOOD_DISPLAY[mood]
    return {"color": color, "label": label}


def build_public_payload(
    mom_name: str,
    requests: list[Mapping[str, Any]],
    share_mood: bool = False,
    mood: int | None = None,
) -> dict:
    """Return ``{mom_name, mood?, requests:[...]}`` for strangers.

    ``mood`` (today's 1-5 value) is exposed only as ``{color, label}`` and
    only when the mum opted in via ``CircleLink.share_mood``; otherwise it
    is dropped even if provided.
    """
    visible = [
        public_request(r) for r in requests if r.get("status") in PUBLIC_STATUSES
    ]
    payload: dict[str, Any] = {"mom_name": mom_name, "requests": visible}
    if share_mood:
        display = mood_display(mood)
        if display is not None:
            payload["mood"] = display
    return payload
