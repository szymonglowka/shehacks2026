"""Shared Django settings. Per-env files: dev.py, test.py."""
from datetime import timedelta

import environ
from celery.schedules import crontab

env = environ.Env(
    DEBUG=(bool, False),
)

BASE_DIR = environ.Path(__file__) - 3

SECRET_KEY = env("SECRET_KEY", default="django-insecure-local-dev-only")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "drf_spectacular",
    "corsheaders",
    "apps.common",
    "apps.accounts",
    "apps.tracking",
    "apps.insights",
    "apps.support",
    "apps.circle",
    "apps.journal",
    "apps.goals",
    "apps.notifications",
    "apps.content",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "apps.accounts.middleware.LastSeenMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    "default": env.db("DATABASE_URL", default="postgres://otula:otula@db:5432/otula"),
}

AUTH_USER_MODEL = "accounts.User"

TIME_ZONE = "Europe/Warsaw"
USE_TZ = True
LANGUAGE_CODE = "pl"
USE_I18N = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

FIELD_ENCRYPTION_KEY = env("FIELD_ENCRYPTION_KEY", default="")

# DRF: JWT by default, authenticated by default, JSON only.
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
    "DEFAULT_PARSER_CLASSES": (
        "rest_framework.parsers.JSONParser",
    ),
    "EXCEPTION_HANDLER": "apps.common.exceptions.exception_handler",
    # Throttling only where SPEC §6.8 asks for it: public circle views set PublicThrottle explicitly.
    # A global 30/min limit would break normal app usage (one screen fires several queries).
    "DEFAULT_THROTTLE_CLASSES": (),
    "DEFAULT_THROTTLE_RATES": {
        "public": "30/min",
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
]
_frontend_port = env("FRONTEND_PORT", default="")
if _frontend_port and f"http://localhost:{_frontend_port}" not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(f"http://localhost:{_frontend_port}")

SPECTACULAR_SETTINGS = {
    "TITLE": "Otula API",
    "DESCRIPTION": "Postpartum & cycle wellbeing PWA",
    "VERSION": "1.0.0",
}

# Celery (task modules are implemented by b-goals; names fixed in AGENT_PROMPTS.md)
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://redis:6379/0")
CELERY_RESULT_BACKEND = env("CELERY_BROKER_URL", default="redis://redis:6379/0")
CELERY_BEAT_SCHEDULE = {
    "send-due-goal-reminders": {
        "task": "apps.notifications.tasks.send_due_goal_reminders",
        "schedule": 60.0,
    },
    "send-checkin-reminders": {
        "task": "apps.notifications.tasks.send_checkin_reminders",
        "schedule": 60.0,
    },
    "send-epds-due": {
        "task": "apps.notifications.tasks.send_epds_due",
        "schedule": crontab(hour=10, minute=0),
    },
    "send-gentle-nudges": {
        "task": "apps.notifications.tasks.send_gentle_nudges",
        "schedule": 1800.0,
    },
}

VAPID_PUBLIC_KEY = env("VAPID_PUBLIC_KEY", default="")
VAPID_PRIVATE_KEY = env("VAPID_PRIVATE_KEY", default="")
VAPID_ADMIN_EMAIL = env("VAPID_ADMIN_EMAIL", default="admin@example.com")
DEMO_PASSWORD = env("DEMO_PASSWORD", default="otula-demo-1234")
