"""Generate a fresh VAPID key pair for Web Push (keys live in .env, never in git).

Usage: python manage.py generate_vapid
"""
from base64 import urlsafe_b64encode

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Print a fresh VAPID key pair (URL-safe base64) for .env."

    def handle(self, *args, **options):
        from py_vapid import Vapid

        vapid = Vapid()
        vapid.generate_keys()
        numbers = vapid.private_key.private_numbers()
        private_raw = numbers.private_value.to_bytes(32, "big")
        public_numbers = vapid.public_key.public_numbers()
        public_raw = (
            b"\x04"
            + public_numbers.x.to_bytes(32, "big")
            + public_numbers.y.to_bytes(32, "big")
        )
        private = urlsafe_b64encode(private_raw).decode().rstrip("=")
        public = urlsafe_b64encode(public_raw).decode().rstrip("=")
        self.stdout.write(f"VAPID_PUBLIC_KEY={public}")
        self.stdout.write(f"VAPID_PRIVATE_KEY={private}")
