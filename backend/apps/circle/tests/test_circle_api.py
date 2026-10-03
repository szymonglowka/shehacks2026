"""Circle API tests: link lifecycle, requests, public page, claim/done, privacy, throttling."""
import json

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.circle.models import CareRequest, CircleLink
from apps.common.factories import UserFactory
from apps.notifications.models import Notification


@pytest.fixture
def other_user(db):
    return UserFactory()


@pytest.fixture
def link(user):
    return CircleLink.objects.create(user=user, share_mood=False)


@pytest.fixture
def care_request(user):
    return CareRequest.objects.create(
        user=user, title="Obiad na czwartek", category="meal", when_label="czw.",
        note="SECRET mum note",
    )


def public_url(link, suffix=""):
    return f"/api/v1/circle/public/{link.token}{suffix}"


def test_link_lifecycle(auth_client):
    assert auth_client.get("/api/v1/circle/link").status_code == 404
    created = auth_client.post("/api/v1/circle/link", {}, format="json")
    assert created.status_code == 201
    assert created.json()["url"].startswith("/c/")
    assert auth_client.get("/api/v1/circle/link").status_code == 200
    patched = auth_client.patch(
        "/api/v1/circle/link", {"share_mood": True}, format="json"
    )
    assert patched.json()["share_mood"] is True
    assert auth_client.delete("/api/v1/circle/link").status_code == 204
    assert auth_client.get("/api/v1/circle/link").status_code == 404


def test_new_link_revokes_old(auth_client, api_client):
    first = auth_client.post("/api/v1/circle/link", {}, format="json").json()
    auth_client.post("/api/v1/circle/link", {}, format="json")
    assert api_client.get(f"/api/v1/circle/public/{first['token']}").status_code == 404


def test_requests_crud_and_isolation(auth_client, user, other_user):
    created = auth_client.post(
        "/api/v1/circle/requests",
        {"title": "Spacer", "category": "company"},
        format="json",
    )
    assert created.status_code == 201
    assert auth_client.get("/api/v1/circle/requests").json()[0]["title"] == "Spacer"
    other = APIClient()
    other.force_authenticate(user=other_user)
    assert other.get("/api/v1/circle/requests").json() == []
    assert other.get(f"/api/v1/circle/requests/{created.json()['id']}").status_code == 404


def test_public_page_hides_notes_and_mood_by_default(api_client, link, care_request, user):
    user.profile.display_name = "Marta"
    user.profile.save()
    body = api_client.get(public_url(link)).json()
    assert body["mom_name"] == "Marta"
    assert len(body["requests"]) == 1
    dumped = json.dumps(body)
    assert "SECRET mum note" not in dumped
    assert "note" not in body["requests"][0]
    assert "mood" not in body


def test_public_page_statuses_and_mood(api_client, link, user):
    CareRequest.objects.create(user=user, title="A", status="open")
    CareRequest.objects.create(user=user, title="B", status="claimed", claimed_by_name="T")
    CareRequest.objects.create(user=user, title="C", status="done")
    CareRequest.objects.create(user=user, title="D", status="cancelled")
    link.share_mood = True
    link.save()
    body = api_client.get(public_url(link)).json()
    assert [r["title"] for r in body["requests"]] == ["A", "B", "C"]
    # No mood data available (tracking selectors absent) -> key omitted.
    assert "mood" not in body


def test_public_revoked_is_404(api_client, link):
    link.revoked_at = timezone.now()
    link.save()
    assert api_client.get(public_url(link)).status_code == 404


def test_claim_and_done_notify_mum(api_client, link, care_request, user):
    claimed = api_client.post(
        public_url(link, f"/requests/{care_request.id}/claim"),
        {"name": "  Tomek "},
        format="json",
    )
    assert claimed.status_code == 200
    care_request.refresh_from_db()
    assert care_request.status == "claimed"
    assert care_request.claimed_by_name == "Tomek"
    assert Notification.objects.filter(user=user).count() == 1
    assert "Tomek" in Notification.objects.filter(user=user).first().title
    # Second claim is rejected.
    assert (
        api_client.post(
            public_url(link, f"/requests/{care_request.id}/claim"),
            {"name": "X"},
            format="json",
        ).status_code
        == 400
    )
    done = api_client.post(
        public_url(link, f"/requests/{care_request.id}/done"), {}, format="json"
    )
    assert done.status_code == 200
    assert Notification.objects.filter(user=user).count() == 2


def test_claim_blank_name_rejected(api_client, link, care_request):
    response = api_client.post(
        public_url(link, f"/requests/{care_request.id}/claim"), {"name": "  "}, format="json"
    )
    assert response.status_code == 400


def test_claim_unknown_request_404(api_client, link):
    assert (
        api_client.post(
            public_url(link, "/requests/9999/claim"), {"name": "X"}, format="json"
        ).status_code
        == 404
    )


def test_public_throttle(api_client, link):
    """The 30/min public throttle from SPEC section 6.8 is enforced.

    The public views declare the throttle explicitly (test settings disable
    the global default). A dedicated REMOTE_ADDR keeps this test's bucket
    isolated from other anonymous requests in the suite.
    """
    statuses = [
        api_client.get(public_url(link), REMOTE_ADDR="10.99.0.1").status_code
        for _ in range(35)
    ]
    assert statuses[:30] == [200] * 30
    assert 429 in statuses[30:]


def test_circle_export(user, link, care_request):
    from apps.circle.export import export_user_data

    data = export_user_data(user)
    assert "token" not in json.dumps(data)  # secret-equivalent stays out
    assert data["care_requests"][0]["note"] == "SECRET mum note"  # mum's own export
    assert data["circle_links"][0]["share_mood"] is False
