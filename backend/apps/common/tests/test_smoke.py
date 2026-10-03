"""Checkpoint-0 smoke tests: platform boots, health is public, User auto-gets Profile."""


def test_health_ok(api_client):
    res = api_client.get("/api/v1/health/")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_user_creation_creates_profile(user):
    assert user.profile is not None
    assert user.profile.language == "pl"
    assert user.profile.onboarding_completed is False


def test_error_envelope_shape():
    from rest_framework.exceptions import NotFound, ValidationError

    from apps.common.exceptions import exception_handler

    res = exception_handler(NotFound("Not found."), context={})
    assert res.status_code == 404
    assert set(res.data) == {"detail", "errors"}

    res = exception_handler(ValidationError({"email": ["Taken."]}), context={})
    assert res.status_code == 400
    assert res.data == {"detail": "Validation error.", "errors": {"email": ["Taken."]}}
