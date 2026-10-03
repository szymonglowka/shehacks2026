from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile

User = get_user_model()

PROFILE_FIELDS = (
    "display_name",
    "language",
    "mode",
    "birth_date",
    "delivery_type",
    "feeding",
    "period_returned",
    "avg_cycle_length",
    "avg_period_length",
    "tone",
    "checkin_reminder_time",
    "timezone",
    "onboarding_completed",
    "worsening_factors",
    "night_mode",
    "last_seen_at",
)
PROFILE_READONLY = ["last_seen_at"]


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = PROFILE_FIELDS
        read_only_fields = PROFILE_READONLY


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "profile")


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    display_name = serializers.CharField(max_length=100, required=False, default="")
    language = serializers.ChoiceField(choices=["pl", "en"], default="pl")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email is already registered.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
        )
        profile = user.profile
        profile.display_name = validated_data.get("display_name", "")
        profile.language = validated_data.get("language", "pl")
        profile.save()
        return user

    def to_response(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }
