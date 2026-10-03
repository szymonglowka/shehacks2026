"""Bilingual helpers. DB content lives in *_pl/*_en columns; language comes from
the Accept-Language header with fallback to the user's profile."""

SUPPORTED = ("pl", "en")


def get_lang(request):
    header = (request.META.get("HTTP_ACCEPT_LANGUAGE") or "")[:2].lower()
    if header in SUPPORTED:
        return header
    user = getattr(request, "user", None)
    profile = getattr(user, "profile", None)
    if profile is not None and getattr(profile, "language", None) in SUPPORTED:
        return profile.language
    return "pl"


def localized(obj, field, lang):
    """Return obj.<field>_<lang>, falling back to the other language."""
    if lang not in SUPPORTED:
        lang = "pl"
    value = getattr(obj, f"{field}_{lang}", None)
    if value:
        return value
    other = "en" if lang == "pl" else "pl"
    return getattr(obj, f"{field}_{other}", None)
