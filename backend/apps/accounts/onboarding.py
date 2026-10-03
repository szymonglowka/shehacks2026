"""Onboarding helpers per SPEC section 7.

Reads coping strategies and goal templates from the owning apps' models when
they exist (b-care / b-goals), otherwise falls back to their fixture files so
the endpoints work before those merges land.
"""
import json
from pathlib import Path

APPS_DIR = Path(__file__).resolve().parent.parent

WORSENING_FACTORS = [
    {"code": "lack_of_sleep", "label_pl": "Brak snu", "label_en": "Lack of sleep"},
    {"code": "loneliness", "label_pl": "Samotność", "label_en": "Loneliness"},
    {"code": "pain", "label_pl": "Ból", "label_en": "Pain"},
    {"code": "pressure", "label_pl": "Presja otoczenia", "label_en": "Pressure from others"},
    {"code": "screens", "label_pl": "Za dużo ekranu", "label_en": "Too much screen time"},
    {"code": "hunger", "label_pl": "Głód / nieregularne jedzenie", "label_en": "Hunger / irregular meals"},
]
WORSENING_FACTOR_CODES = {f["code"] for f in WORSENING_FACTORS}


def _load_json(relative):
    with open(APPS_DIR / relative, encoding="utf-8") as f:
        return json.load(f)


def get_coping_strategies():
    """Return [{code, name_pl/en, description_pl/en, category, duration_min, icon}]."""
    try:
        from apps.support.models import CopingStrategy
    except ImportError:
        CopingStrategy = None
    if CopingStrategy is not None:
        return [
            {
                "code": s.code,
                "name_pl": s.name_pl,
                "name_en": s.name_en,
                "description_pl": s.description_pl,
                "description_en": s.description_en,
                "category": s.category,
                "duration_min": s.duration_min,
                "icon": s.icon,
            }
            for s in CopingStrategy.objects.order_by("code")
        ]
    data = _load_json("support/fixtures/coping_strategies.json")
    return data["strategies"]


def _template_matches(fields, mode, week, delivery_type):
    if mode and fields.get("mode") not in (mode, "both"):
        return False
    if week is not None:
        min_week = fields.get("min_week")
        max_week = fields.get("max_week")
        if min_week is not None and week < min_week:
            return False
        if max_week is not None and week > max_week:
            return False
    allowed = fields.get("delivery_types") or []
    return not (
        allowed and delivery_type and delivery_type != "undisclosed" and delivery_type not in allowed
    )


def get_goal_templates(mode=None, week=None, delivery_type=None):
    """Return goal templates filtered by mode/week/delivery_type (SPEC section 5 names)."""
    try:
        from apps.goals.models import GoalTemplate
    except ImportError:
        GoalTemplate = None
    if GoalTemplate is not None:
        qs = GoalTemplate.objects.all()
        if mode:
            qs = qs.filter(mode__in=[mode, "both"])
        templates = [
            {
                "id": t.pk,
                "title_pl": t.title_pl,
                "title_en": t.title_en,
                "description_pl": t.description_pl,
                "description_en": t.description_en,
                "category": t.category,
                "mode": t.mode,
                "min_week": t.min_week,
                "max_week": t.max_week,
                "delivery_types": t.delivery_types,
                "frequency": t.frequency,
                "target_count": t.target_count,
                "safety_note_pl": t.safety_note_pl,
                "safety_note_en": t.safety_note_en,
            }
            for t in qs
        ]
    else:
        raw = _load_json("goals/fixtures/goal_templates.json")
        templates = [
            {"id": item["pk"], **item["fields"]} for item in raw if item.get("model") == "goals.goaltemplate"
        ]
    return [t for t in templates if _template_matches(t, mode, week, delivery_type)]
