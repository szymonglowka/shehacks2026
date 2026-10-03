"""User-data export for the goals app (collected by GET /me/export)."""


def export_user_data(user):
    from .models import Goal

    goals = []
    for goal in Goal.objects.filter(user=user).prefetch_related("logs").order_by(
        "created_at"
    ):
        goals.append(
            {
                "title": goal.title,
                "description": goal.description,
                "category": goal.category,
                "frequency": goal.frequency,
                "target_count": goal.target_count,
                "reminder_enabled": goal.reminder_enabled,
                "reminder_time": (
                    goal.reminder_time.isoformat() if goal.reminder_time else None
                ),
                "reminder_weekdays": goal.reminder_weekdays,
                "is_active": goal.is_active,
                "template_id": goal.template_id,
                "logs": [
                    {"date": log.date.isoformat(), "completed": log.completed}
                    for log in goal.logs.all()
                ],
            }
        )
    return {"goals": goals}
