"""Pure helpers for "ask for support" messages (SPEC W3, K2).

Django-free: the templates live in
``backend/apps/circle/fixtures/message_templates.json`` and the future
``GET /support/contacts/{id}/message`` view will load that file and call
:func:`build_contact_message`. No sending happens backend-side -- the
frontend opens the returned ``sms:`` / ``https://wa.me/`` URLs.
"""

from __future__ import annotations

import re
import urllib.parse

DEFAULT_TONE = "gentle"
DEFAULT_LANG = "pl"


def pick_template(
    templates: list[dict],
    tone: str = DEFAULT_TONE,
    lang: str = DEFAULT_LANG,
    template_id: str | None = None,
) -> dict:
    """Pick one template, falling back to gentle/PL when needed.

    An explicit ``template_id`` wins over ``tone``; without it the first
    template of the requested tone is used.
    """
    if template_id is not None:
        by_id = [t for t in templates if t.get("id") == template_id]
        candidates = by_id or list(templates)
    else:
        candidates = list(templates)
    toned = [t for t in candidates if t.get("tone") == tone]
    template = (toned or candidates)[0]
    if lang not in ("pl", "en"):
        lang = DEFAULT_LANG
    return {
        "id": template["id"],
        "tone": template.get("tone", DEFAULT_TONE),
        "text": template.get(lang) or template.get(DEFAULT_LANG, ""),
    }


def render_text(template_text: str, task: str | None = None) -> str:
    """Substitute the ``{task}`` placeholder (or drop the clause)."""
    if "{task}" not in template_text:
        return template_text
    return template_text.replace("{task}", task or "…")


def normalize_phone_for_whatsapp(phone: str) -> str:
    """Digits only; bare 9-digit Polish numbers get the 48 prefix."""
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 9:
        digits = "48" + digits
    return digits


def sms_url(phone: str, text: str) -> str:
    return f"sms:{phone}?&body={urllib.parse.quote(text)}"


def whatsapp_url(phone: str, text: str) -> str:
    return f"https://wa.me/{normalize_phone_for_whatsapp(phone)}?text={urllib.parse.quote(text)}"


def build_contact_message(
    templates: list[dict],
    phone: str,
    tone: str = DEFAULT_TONE,
    lang: str = DEFAULT_LANG,
    template_id: str | None = None,
    task: str | None = None,
) -> dict:
    """Return ``{text, sms_url, whatsapp_url}`` for a trusted contact."""
    template = pick_template(templates, tone=tone, lang=lang, template_id=template_id)
    text = render_text(template["text"], task=task)
    return {
        "template_id": template["id"],
        "tone": template["tone"],
        "text": text,
        "sms_url": sms_url(phone, text),
        "whatsapp_url": whatsapp_url(phone, text),
    }
