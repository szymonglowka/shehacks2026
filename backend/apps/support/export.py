"""User-data export for the support app (collected by GET /me/export)."""


def export_user_data(user):
    from .models import SupportSession, TrustedContact, UserCopingPreference

    return {
        "coping_preferences": [
            {
                "strategy": pref.strategy.code,
                "survey_score": pref.survey_score,
                "used_count": pref.used_count,
                "helped_score_sum": pref.helped_score_sum,
            }
            for pref in UserCopingPreference.objects.filter(user=user)
            .select_related("strategy")
            .order_by("strategy__code")
        ],
        "support_sessions": [
            {
                "started_at": session.started_at.isoformat(),
                "ended_at": session.ended_at.isoformat() if session.ended_at else None,
                "intensity": session.intensity,
                "trigger": session.trigger,
                "strategy": session.strategy.code if session.strategy else None,
                "helped": session.helped,
                "mood_after": session.mood_after,
            }
            for session in SupportSession.objects.filter(user=user)
            .select_related("strategy")
            .order_by("started_at")
        ],
        "trusted_contacts": [
            {
                "name": contact.name,
                "relation": contact.relation,
                "phone": contact.phone,
                "preferred_channel": contact.preferred_channel,
                "default_message": contact.default_message,
            }
            for contact in TrustedContact.objects.filter(user=user).order_by("id")
        ],
    }
