from .base import *

DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
CELERY_TASK_ALWAYS_EAGER = True
# Public throttle would 429 focused tests; contract is covered by b-care tests.
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []
FIELD_ENCRYPTION_KEY = "2mHiBJLvN0dqOjNjvKmjtxmDHww4bHBM2ff1j2Y85ck="
