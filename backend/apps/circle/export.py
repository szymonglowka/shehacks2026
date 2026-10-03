"""User-data export for the circle app (collected by GET /me/export)."""


def export_user_data(user):
    from .models import CareRequest, CircleLink

    return {
        "circle_links": [
            {
                "share_mood": link.share_mood,
                "created_at": link.created_at.isoformat(),
                "revoked_at": link.revoked_at.isoformat() if link.revoked_at else None,
            }
            for link in CircleLink.objects.filter(user=user).order_by("created_at")
        ],
        "care_requests": [
            {
                "title": req.title,
                "category": req.category,
                "when_date": req.when_date.isoformat() if req.when_date else None,
                "when_label": req.when_label,
                "note": req.note,
                "status": req.status,
                "claimed_by_name": req.claimed_by_name,
                "claimed_at": req.claimed_at.isoformat() if req.claimed_at else None,
                "done_at": req.done_at.isoformat() if req.done_at else None,
            }
            for req in CareRequest.objects.filter(user=user).order_by("created_at")
        ],
    }
