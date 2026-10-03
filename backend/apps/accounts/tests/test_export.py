"""GET /me/export collects every app's export_user_data when present."""


def test_export_contains_account_data(auth_client, user):
    res = auth_client.get("/api/v1/me/export")
    assert res.status_code == 200
    body = res.json()
    assert body["user"]["email"] == user.email
    assert body["data"]["accounts"]["email"] == user.email
    assert body["data"]["accounts"]["profile"]["language"] == "pl"


def test_export_skips_apps_without_export_module(auth_client):
    # tracking/support/goals/... have no export.py yet: must not crash.
    res = auth_client.get("/api/v1/me/export")
    assert res.status_code == 200
    assert isinstance(res.json()["data"], dict)


def test_export_requires_auth(api_client):
    assert api_client.get("/api/v1/me/export").status_code == 401
