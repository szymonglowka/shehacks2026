"""Auth contract per SPEC section 7: register / login / refresh."""
import pytest

pytestmark = pytest.mark.django_db


def test_register_creates_user_and_returns_tokens(api_client):
    res = api_client.post(
        "/api/v1/auth/register",
        {
            "email": "ania@example.com",
            "password": "secret1234",
            "display_name": "Ania",
            "language": "pl",
        },
        format="json",
    )
    assert res.status_code == 201, res.content
    body = res.json()
    assert set(body) == {"access", "refresh", "user"}
    assert body["user"]["email"] == "ania@example.com"
    assert body["user"]["profile"]["display_name"] == "Ania"
    assert body["user"]["profile"]["language"] == "pl"


def test_register_duplicate_email_rejected(api_client, user):
    res = api_client.post(
        "/api/v1/auth/register",
        {"email": user.email, "password": "secret1234"},
        format="json",
    )
    assert res.status_code == 400
    assert set(res.json()) == {"detail", "errors"}


def test_register_short_password_rejected(api_client):
    res = api_client.post(
        "/api/v1/auth/register",
        {"email": "x@example.com", "password": "short"},
        format="json",
    )
    assert res.status_code == 400


def test_login_returns_token_pair(api_client, user):
    api_client.force_authenticate(user=None)
    res = api_client.post(
        "/api/v1/auth/login",
        {"email": user.email, "password": "password123"},
        format="json",
    )
    assert res.status_code == 200, res.content
    assert set(res.json()) == {"access", "refresh"}


def test_login_wrong_password(api_client, user):
    res = api_client.post(
        "/api/v1/auth/login", {"email": user.email, "password": "nope-nope"}, format="json"
    )
    assert res.status_code == 401
    assert set(res.json()) == {"detail", "errors"}


def test_refresh_rotates_access_token(api_client, user):
    login = api_client.post(
        "/api/v1/auth/login",
        {"email": user.email, "password": "password123"},
        format="json",
    )
    refresh = login.json()["refresh"]
    res = api_client.post("/api/v1/auth/refresh", {"refresh": refresh}, format="json")
    assert res.status_code == 200
    assert "access" in res.json()


def test_me_requires_auth(api_client):
    res = api_client.get("/api/v1/me")
    assert res.status_code == 401
    assert set(res.json()) == {"detail", "errors"}
