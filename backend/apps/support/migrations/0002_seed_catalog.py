"""Seed the support catalog (strategies + helplines) from fixture JSONs.

Idempotent (update_or_create), so re-running migrate or seed_content never
duplicates rows.
"""
from django.db import migrations


def seed_catalog(apps, schema_editor):
    from apps.support.loaders import load_catalog

    load_catalog(apps)


def unseed_catalog(apps, schema_editor):
    CopingStrategy = apps.get_model("support", "CopingStrategy")
    Helpline = apps.get_model("support", "Helpline")
    CopingStrategy.objects.all().delete()
    Helpline.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [("support", "0001_initial")]

    operations = [migrations.RunPython(seed_catalog, unseed_catalog)]
