"""User-data export for the tracking app (collected by GET /me/export)."""


def export_user_data(user):
    from .models import DailyCheckIn, EPDSAssessment, Period

    checkins = [
        {
            "date": c.date.isoformat(),
            "mood": c.mood,
            "energy": c.energy,
            "anxiety": c.anxiety,
            "sleep_hours": c.sleep_hours,
            "sleep_quality": c.sleep_quality,
            "pain": c.pain,
            "emotions": c.emotions,
            "bleeding": c.bleeding,
            "symptoms": c.symptoms,
            "red_flags": c.red_flags,
            "note": c.note,
        }
        for c in DailyCheckIn.objects.filter(user=user).order_by("date")
    ]
    periods = [
        {
            "start_date": p.start_date.isoformat(),
            "end_date": p.end_date.isoformat() if p.end_date else None,
        }
        for p in Period.objects.filter(user=user).order_by("start_date")
    ]
    epds = [
        {
            "answers": a.answers,
            "total": a.total,
            "self_harm_score": a.self_harm_score,
            "risk_level": a.risk_level,
            "created_at": a.created_at.isoformat(),
        }
        for a in EPDSAssessment.objects.filter(user=user).order_by("created_at")
    ]
    return {"checkins": checkins, "periods": periods, "epds": epds}
