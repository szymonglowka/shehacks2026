"""User-data export for the content app (collected by GET /me/export)."""


def export_user_data(user):
    # The catalogue (articles, specialists) is shared content, not user data.
    return {}
