"""Catalog loaders for the support app.

The fixtures are Django loaddata-style lists
([{"model", "pk", "fields", ...}], same convention as the content and goals
apps), so seed_content (b-content) loads them with zero special-casing --
except each helpline entry also carries a top-level "verify": true marking
(product-safety: numbers stay unverified until a human confirms them; the
operational flag is fields.is_verified).

load_catalog() applies them idempotently via update_or_create by primary key
and is used by migration 0002_seed_catalog.
"""
import json
from pathlib import Path

from django.apps import apps as django_apps

FIXTURE_DIR = Path(__file__).resolve().parent / "fixtures"


def load_file(filename, apps_registry=None):
    """Apply one loaddata-style fixture. Returns (created, updated).

    Pass a migration's ``apps`` registry for historical models; otherwise
    the current models are used (e.g. from seed_content).
    """
    registry = apps_registry or django_apps
    with open(FIXTURE_DIR / filename, encoding="utf-8") as fh:
        entries = json.load(fh)
    created = updated = 0
    for entry in entries:
        model = registry.get_model(entry["model"])
        _, was_created = model.objects.update_or_create(
            pk=entry["pk"], defaults=dict(entry.get("fields", {}))
        )
        if was_created:
            created += 1
        else:
            updated += 1
    return created, updated


def load_catalog(apps_registry=None):
    """Idempotently load strategies + helplines. Returns dict of counts."""
    return {
        "strategies": load_file("coping_strategies.json", apps_registry),
        "helplines": load_file("helplines.json", apps_registry),
    }
