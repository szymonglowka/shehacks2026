"""Notification copy: every kind x tone x language (SPEC §6.5).

Django-free: plain dicts + a tiny renderer, so Celery tasks and tests use it
without Django. ``notify()`` (after checkpoint-0) receives the rendered
``title``/``body`` — this module only builds them.

Tone rules (SCREENS §0): warm, concrete, feminine form, "Ty" capitalised,
never judging, never diagnosing. ``{name}`` is replaced with display_name.
"""

from __future__ import annotations

KINDS = ("goal_reminder", "checkin_reminder", "epds_due", "gentle_nudge", "system")
TONES = ("gentle", "motivating")
LANGS = ("pl", "en")

NOTIFICATION_COPY: dict[str, dict[str, dict[str, dict[str, str]]]] = {
    "goal_reminder": {
        "gentle": {
            "pl": {
                "title": "Twoje cele czekają spokojnie",
                "body": "{name}, przypominam tylko o tym, co sama ustawiłaś. Jeden mały krok dziś wystarczy.",
            },
            "en": {
                "title": "Your goals are waiting patiently",
                "body": "{name}, just a reminder about what You set Yourself. One small step today is enough.",
            },
        },
        "motivating": {
            "pl": {
                "title": "Czas na Twój cel",
                "body": "{name}, dasz radę — jeden mały krok dziś i Twoja seria rośnie.",
            },
            "en": {
                "title": "Time for your goal",
                "body": "{name}, You've got this — one small step today keeps your streak growing.",
            },
        },
    },
    "checkin_reminder": {
        "gentle": {
            "pl": {
                "title": "Jak Ci dziś?",
                "body": "Minuta dla Ciebie: zapisz, jak się dziś czujesz. Bez oceniania.",
            },
            "en": {
                "title": "How are you today?",
                "body": "One minute for yourself: note how you feel today. No judging.",
            },
        },
        "motivating": {
            "pl": {
                "title": "Zapisz dzisiejszy check-in",
                "body": "30 sekund i gotowe. Twoje notatki układają się w historię, do której warto wracać.",
            },
            "en": {
                "title": "Log today's check-in",
                "body": "30 seconds and done. Your notes are building a story worth coming back to.",
            },
        },
    },
    "epds_due": {
        "gentle": {
            "pl": {
                "title": "Czas na krótką ankietę",
                "body": "Minęły 2 tygodnie. Wypełnij EPDS, kiedy będziesz gotowa — to przesiew, nie diagnoza.",
            },
            "en": {
                "title": "Time for a short questionnaire",
                "body": "It's been 2 weeks. Fill in the EPDS when You're ready — it's a screening, not a diagnosis.",
            },
        },
        "motivating": {
            "pl": {
                "title": "Sprawdź, jak się masz",
                "body": "2 minuty, 10 pytań. Twoje odpowiedzi pomagają zauważyć, kiedy warto porozmawiać ze specjalistą.",
            },
            "en": {
                "title": "Check in with yourself",
                "body": "2 minutes, 10 questions. Your answers help notice when it's worth talking to a specialist.",
            },
        },
    },
    "gentle_nudge": {
        "gentle": {
            "pl": {
                "title": "Nie musisz dziś niczego naprawiać",
                "body": "Ostatnie dni były cięższe. Może coś, co kiedyś Ci pomogło? Jestem tu też jutro.",
            },
            "en": {
                "title": "You don't have to fix anything today",
                "body": "The last few days were harder. Maybe something that helped You before? I'm here tomorrow too.",
            },
        },
        "motivating": {
            "pl": {
                "title": "Mały krok dziś?",
                "body": "{name}, wybierz jedną drobnostkę z Twojej listy. Nawet szklanka wody się liczy.",
            },
            "en": {
                "title": "One small step today?",
                "body": "{name}, pick one tiny thing from your list. Even a glass of water counts.",
            },
        },
    },
    "system": {
        "gentle": {
            "pl": {
                "title": "Drobna wiadomość od Otuli",
                "body": "{name}, zajrzyj do aplikacji, kiedy będziesz miała chwilę.",
            },
            "en": {
                "title": "A short note from Otula",
                "body": "{name}, take a look at the app when You have a moment.",
            },
        },
        "motivating": {
            "pl": {
                "title": "Zajrzyj do Otuli",
                "body": "{name}, Twoje cele i notatki czekają. Mały krok dziś?",
            },
            "en": {
                "title": "Take a look at Otula",
                "body": "{name}, your goals and notes are waiting. One small step today?",
            },
        },
    },
}


def get_copy(
    kind: str, tone: str = "gentle", lang: str = "pl", name: str = ""
) -> dict[str, str]:
    """Render ``{"title", "body"}`` for a kind/tone/lang, substituting ``{name}``.

    Unknown kind raises ``ValueError`` (fail fast in task code). Unknown tone
    falls back to ``gentle``; unknown/unsupported language falls back to ``pl``.
    """
    if kind not in NOTIFICATION_COPY:
        raise ValueError(f"unknown notification kind: {kind!r}")
    tones = NOTIFICATION_COPY[kind]
    texts = tones.get(tone, tones["gentle"])
    entry = texts.get(lang, texts["pl"])
    return {
        "title": entry["title"].replace("{name}", name).replace("  ", " ").strip(" ,"),
        "body": entry["body"].replace("{name}", name).replace("  ", " ").strip(" ,"),
    }
