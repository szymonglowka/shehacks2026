"""Local export hook collected by GET /me/export."""


def export_user_data(user):
    profile = user.profile
    return {
        "email": user.email,
        "date_joined": user.date_joined.isoformat(),
        "profile": {
            "display_name": profile.display_name,
            "language": profile.language,
            "mode": profile.mode,
            "birth_date": str(profile.birth_date) if profile.birth_date else None,
            "delivery_type": profile.delivery_type,
            "feeding": profile.feeding,
            "period_returned": profile.period_returned,
            "avg_cycle_length": profile.avg_cycle_length,
            "avg_period_length": profile.avg_period_length,
            "tone": profile.tone,
            "timezone": profile.timezone,
            "onboarding_completed": profile.onboarding_completed,
            "worsening_factors": profile.worsening_factors,
            "night_mode": profile.night_mode,
        },
    }
