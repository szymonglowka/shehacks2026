"""Refresh the 12 demo "night" accounts so the Night Shift counter shows a number right now.

/night/now counts other users seen in the last 60 minutes whose local time is 22:00–6:00.
seed_demo stamps them with last night's time, so before a daytime pitch run:

    make demo-night

It sets last_seen_at to the last few minutes and moves the accounts to a timezone where it
is currently night. Demo data only; say so when presenting.
"""
import random
from datetime import timedelta
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

CANDIDATE_ZONES = [
    "Europe/Warsaw",
    "Pacific/Auckland",
    "Australia/Sydney",
    "Asia/Tokyo",
    "America/Los_Angeles",
    "America/New_York",
]


def night_zone(now):
    for name in CANDIDATE_ZONES:
        hour = now.astimezone(ZoneInfo(name)).hour
        if hour >= 22 or hour < 6:
            return name
    return CANDIDATE_ZONES[1]


class Command(BaseCommand):
    help = "Mark demo night users as awake now (for the Night Shift counter)."

    def handle(self, *args, **options):
        now = timezone.now()
        zone = night_zone(now)
        users = get_user_model().objects.filter(email__startswith="demo-night-")
        rng = random.Random(42)
        for user in users:
            profile = user.profile
            profile.timezone = zone
            profile.last_seen_at = now - timedelta(minutes=rng.randint(0, 40))
            profile.save(update_fields=["timezone", "last_seen_at"])
        self.stdout.write(f"demo_night: {users.count()} users awake in {zone}")
