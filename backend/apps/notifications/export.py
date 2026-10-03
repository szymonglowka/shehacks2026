"""User-data export for the notifications app (collected by GET /me/export)."""


def export_user_data(user):
    from .models import Notification

    return {
        "notifications": [
            {
                "kind": note.kind,
                "title": note.title,
                "body": note.body,
                "url": note.url,
                "created_at": note.created_at.isoformat(),
                "read_at": note.read_at.isoformat() if note.read_at else None,
            }
            for note in Notification.objects.filter(user=user).order_by("created_at")
        ]
    }
