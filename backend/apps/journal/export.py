"""User-data export for the journal app (collected by GET /me/export)."""


def export_user_data(user):
    from .models import SmallWin, VisitQuestion

    return {
        "small_wins": [
            {"date": win.date.isoformat(), "text": win.text}
            for win in SmallWin.objects.filter(user=user).order_by("date")
        ],
        "visit_questions": [
            {
                "text": question.text,
                "done": question.done,
                "created_at": question.created_at.isoformat(),
            }
            for question in VisitQuestion.objects.filter(user=user).order_by(
                "created_at"
            )
        ],
    }
