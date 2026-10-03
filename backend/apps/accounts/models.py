"""accounts app: custom User (email login) + Profile per SPEC section 5."""
from typing import ClassVar

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models

from apps.common.models import TimeStampedModel


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    def __str__(self):
        return self.email


class Profile(TimeStampedModel):
    LANGUAGE_CHOICES = (("pl", "pl"), ("en", "en"))
    MODE_CHOICES = (("postpartum", "postpartum"), ("cycle", "cycle"))
    DELIVERY_CHOICES = (
        ("vaginal", "vaginal"),
        ("cesarean", "cesarean"),
        ("undisclosed", "undisclosed"),
    )
    FEEDING_CHOICES = (
        ("breast", "breast"),
        ("mixed", "mixed"),
        ("formula", "formula"),
        ("na", "na"),
    )
    TONE_CHOICES = (("gentle", "gentle"), ("motivating", "motivating"))
    NIGHT_MODE_CHOICES = (("auto", "auto"), ("off", "off"))

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    display_name = models.CharField(max_length=100, default="")
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default="pl")
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default="postpartum")
    birth_date = models.DateField(null=True, blank=True)
    delivery_type = models.CharField(
        max_length=12, choices=DELIVERY_CHOICES, default="undisclosed"
    )
    feeding = models.CharField(max_length=10, choices=FEEDING_CHOICES, default="na")
    period_returned = models.BooleanField(default=False)
    avg_cycle_length = models.PositiveSmallIntegerField(default=28)
    avg_period_length = models.PositiveSmallIntegerField(default=5)
    tone = models.CharField(max_length=12, choices=TONE_CHOICES, default="gentle")
    checkin_reminder_time = models.TimeField(null=True, blank=True)
    timezone = models.CharField(max_length=64, default="Europe/Warsaw")
    onboarding_completed = models.BooleanField(default=False)
    worsening_factors = models.JSONField(default=list)
    night_mode = models.CharField(
        max_length=4, choices=NIGHT_MODE_CHOICES, default="auto"
    )
    last_seen_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Profile({self.user.email})"
