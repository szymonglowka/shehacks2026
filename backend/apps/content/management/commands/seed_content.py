"""Load catalogue fixtures for every app whose models exist (idempotent).

Usage: python manage.py seed_content

Each fixture is applied with update_or_create keyed by primary key, so the
command can run any number of times without creating duplicates. Apps whose
models are not merged yet are skipped with a note (their fixtures load
automatically once the models exist).
"""
import json
from pathlib import Path

from django.apps import apps as django_apps
from django.core.management.base import BaseCommand
from django.db import transaction

# (app_label, fixture_filename). Fixtures are Django loaddata-style lists of
# {"model": ..., "pk": ..., "fields": {...}} and are applied by primary key.
FIXTURES = (
    ("content", "articles.json"),
    ("content", "specialists.json"),
    ("goals", "goal_templates.json"),
    ("support", "coping_strategies.json"),
    ("support", "helplines.json"),
)


def fixture_path(app_label: str, filename: str) -> Path:
    return (
        Path(django_apps.get_app_config(app_label).path) / "fixtures" / filename
    )


def load_loaddata_style(entries: list) -> tuple[int, int]:
    """Apply loaddata-style entries via update_or_create. Returns (created, updated)."""
    created = updated = 0
    for entry in entries:
        model = django_apps.get_model(entry["model"])
        _, was_created = model.objects.update_or_create(
            pk=entry["pk"], defaults=dict(entry.get("fields", {}))
        )
        if was_created:
            created += 1
        else:
            updated += 1
    return created, updated


class Command(BaseCommand):
    help = "Idempotently load catalogue fixtures of all apps that exist."

    def handle(self, *args, **options):
        for app_label, filename in FIXTURES:
            if not django_apps.is_installed(f"apps.{app_label}"):
                self.stdout.write(f"skip {app_label}/{filename}: app not installed")
                continue
            path = fixture_path(app_label, filename)
            if not path.exists():
                self.stdout.write(f"skip {app_label}/{filename}: file missing")
                continue
            try:
                with open(path, encoding="utf-8") as fh:
                    payload = json.load(fh)
                entries = payload if isinstance(payload, list) else None
            except (json.JSONDecodeError, OSError) as exc:
                self.stdout.write(f"skip {app_label}/{filename}: unreadable ({exc})")
                continue
            if entries is None:
                self.stdout.write(
                    f"skip {app_label}/{filename}: not loaddata-style "
                    "(needs the owning app's loader)"
                )
                continue
            try:
                with transaction.atomic():
                    created, kept = load_loaddata_style(entries)
            except LookupError as exc:
                self.stdout.write(f"skip {app_label}/{filename}: {exc}")
                continue
            self.stdout.write(
                f"loaded {app_label}/{filename}: {created} created, {kept} updated"
            )
