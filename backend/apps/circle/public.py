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


def build_public_payload(
    mom_name: str,
    requests: list[Mapping[str, Any]],
    share_mood: bool = False,
    mood_color: str | None = None,
) -> dict:
    """Return ``{mom_name, mood_color?, requests:[...]}`` for strangers.

    ``mood_color`` is included only when the mum opted in via
    ``CircleLink.share_mood``; otherwise it is dropped even if provided.
    """
    visible = [
        public_request(r) for r in requests if r.get("status") in PUBLIC_STATUSES
    ]
    payload: dict[str, Any] = {"mom_name": mom_name, "requests": visible}
    if share_mood and mood_color:
        payload["mood_color"] = mood_color
    return payload
