"""Content app: bilingual article catalogue + sample specialists (SPEC section 5)."""
from typing import ClassVar

from django.db import models

CATEGORY_CHOICES = (
    ("postpartum_recovery", "postpartum_recovery"),
    ("mental_health", "mental_health"),
    ("cycle", "cycle"),
    ("movement", "movement"),
    ("sleep", "sleep"),
    ("nutrition", "nutrition"),
    ("relationships", "relationships"),
    ("breastfeeding", "breastfeeding"),
)
MODE_CHOICES = (
    ("postpartum", "postpartum"),
    ("cycle", "cycle"),
    ("both", "both"),
)


class Article(models.Model):
    """Educational article, bilingual markdown body (SPEC section 5)."""

    slug = models.SlugField(max_length=80, unique=True)
    title_pl = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200)
    summary_pl = models.TextField(default="")
    summary_en = models.TextField(default="")
    body_pl = models.TextField(default="")
    body_en = models.TextField(default="")
    category = models.CharField(max_length=22, choices=CATEGORY_CHOICES)
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default="both")
    min_week = models.PositiveSmallIntegerField(null=True, blank=True)
    max_week = models.PositiveSmallIntegerField(null=True, blank=True)
    reading_minutes = models.PositiveSmallIntegerField(default=5)
    cover_emoji = models.CharField(max_length=8, default="", blank=True)
    cover_image = models.CharField(max_length=120, default="", blank=True)

    class Meta:
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("mode", "category")),
        ]

    def __str__(self):
        return self.slug


class Specialist(models.Model):
    """Support professional. Seed rows are fictional and flagged (SPEC section 5)."""

    name = models.CharField(max_length=200)
    specialty = models.CharField(max_length=40)
    city = models.CharField(max_length=100, default="", blank=True)
    online = models.BooleanField(default=False)
    phone = models.CharField(max_length=40, default="", blank=True)
    website = models.URLField(default="", blank=True)
    description_pl = models.TextField(default="", blank=True)
    description_en = models.TextField(default="", blank=True)
    is_sample = models.BooleanField(default=True)

    class Meta:
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("specialty", "city")),
        ]

    def __str__(self):
        return self.name
