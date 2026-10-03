"""Tracking API tests: check-ins, cycle, periods, EPDS, export, isolation."""
from datetime import timedelta

import pytest
from django.db import connection
from django.utils import timezone

from apps.tracking.models import DailyCheckIn, EPDSAssessment, Period
from apps.tracking.selectors import latest_checkins, mood_today

TODAY = timezone.localdate()


@pytest.fixture
def postpartum(user):
    profile = user.profile
    profile.mode = "postpartum"
    profile.birth_date = TODAY - timedelta(days=30)
    profile.save()
    return user


def test_checkin_upsert_returns_checkin_and_risk(auth_client):
    response = auth_client.put(
        f"/api/v1/checkins/{TODAY}",
        {"mood": 4, "sleep_hours": 7.0, "note": "good day"},
        format="json",
    )
    assert response.status_code == 200, response.content
    body = response.json()
    assert body["checkin"]["mood"] == 4
    assert body["checkin"]["sleep_hours"] == 7.0
    assert body["risk"]["level"] == "none"


def test_checkin_upsert_updates_same_row(auth_client, user):
    url = f"/api/v1/checkins/{TODAY}"
    auth_client.put(url, {"mood": 2}, format="json")
    body = auth_client.put(url, {"mood": 5, "anxiety": 4}, format="json").json()
    assert DailyCheckIn.objects.filter(user=user).count() == 1
    assert body["checkin"]["mood"] == 5
    # R8: anxiety >= 4 -> info.
    assert body["risk"]["level"] == "info"
    assert body["risk"]["reasons"] == ["R8"]


def test_checkin_risk_r5_from_history(auth_client, user, postpartum):
    for i, mood in enumerate([2, 1, 2, 4]):
        DailyCheckIn.objects.create(
            user=user, date=TODAY - timedelta(days=3 - i), mood=mood
        )
    body = auth_client.put(
        f"/api/v1/checkins/{TODAY}", {"mood": 2}, format="json"
    ).json()
    assert body["risk"]["level"] == "moderate"
    assert body["risk"]["reasons"] == ["R5", "R7"]  # day 30 > 14


def test_checkin_risk_uses_fresh_epds(auth_client, user):
    EPDSAssessment.objects.create(
        user=user, answers=[3] * 10, total=15,
        self_harm_score=0, risk_level="high",
    )
    body = auth_client.put(
        f"/api/v1/checkins/{TODAY}", {"mood": 4}, format="json"
    ).json()
    assert body["risk"]["level"] == "high"
    assert "R3" in body["risk"]["reasons"]


def test_checkin_risk_ignores_stale_epds(auth_client, user):
    old = EPDSAssessment.objects.create(
        user=user, answers=[3] * 10, total=15,
        self_harm_score=0, risk_level="high",
    )
    EPDSAssessment.objects.filter(pk=old.pk).update(
        created_at=timezone.now() - timedelta(days=30)
    )
    body = auth_client.put(
        f"/api/v1/checkins/{TODAY}", {"mood": 4}, format="json"
    ).json()
    assert body["risk"]["level"] == "none"


def test_checkin_red_flag_is_urgent(auth_client):
    body = auth_client.put(
        f"/api/v1/checkins/{TODAY}",
        {"mood": 3, "red_flags": ["fever"]},
        format="json",
    ).json()
    assert body["risk"]["level"] == "urgent"
    assert body["risk"]["actions"] == ["contact_doctor_now", "show_emergency"]


def test_checkin_future_date_rejected(auth_client):
    response = auth_client.put(
        f"/api/v1/checkins/{TODAY + timedelta(days=1)}", {"mood": 3}, format="json"
    )
    assert response.status_code == 400


def test_checkin_bad_date_format(auth_client):
    assert auth_client.put("/api/v1/checkins/not-a-date", {}, format="json").status_code == 400
    assert auth_client.get("/api/v1/checkins/not-a-date").status_code == 400


def test_checkin_get_missing_is_404(auth_client):
    assert auth_client.get(f"/api/v1/checkins/{TODAY}").status_code == 404


def test_checkin_list_filters(auth_client, user):
    DailyCheckIn.objects.create(user=user, date=TODAY - timedelta(days=10), mood=2)
    DailyCheckIn.objects.create(user=user, date=TODAY - timedelta(days=2), mood=4)
    DailyCheckIn.objects.create(user=user, date=TODAY, mood=5)
    body = auth_client.get(
        "/api/v1/checkins",
        {"from": str(TODAY - timedelta(days=5))},
    ).json()
    assert [c["mood"] for c in body] == [4, 5]
    body = auth_client.get(
        "/api/v1/checkins",
        {"from": str(TODAY - timedelta(days=5)), "to": str(TODAY - timedelta(days=2))},
    ).json()
    assert [c["mood"] for c in body] == [4]
    assert auth_client.get("/api/v1/checkins", {"from": "bogus"}).status_code == 400


def test_checkin_validation(auth_client):
    response = auth_client.put(
        f"/api/v1/checkins/{TODAY}", {"mood": 9}, format="json"
    )
    assert response.status_code == 400


def test_checkin_user_isolation(auth_client, user):
    from apps.common.factories import UserFactory

    other = UserFactory()
    other_mood = DailyCheckIn.objects.create(
        user=other, date=TODAY, mood=1
    )
    Period.objects.create(user=other, start_date=TODAY)
    EPDSAssessment.objects.create(
        user=other, answers=[0] * 10, total=21,
        self_harm_score=3, risk_level="urgent",
    )
    # Same date for auth_client's user: separate row, no leak.
    auth_client.put(f"/api/v1/checkins/{TODAY}", {"mood": 5}, format="json")
    assert auth_client.get("/api/v1/checkins").json()[0]["mood"] == 5
    assert DailyCheckIn.objects.get(pk=other_mood.pk).mood == 1
    assert auth_client.get("/api/v1/periods").json() == []
    assert auth_client.get("/api/v1/epds").json() == []


def test_note_encrypted_at_rest(auth_client, user):
    auth_client.put(f"/api/v1/checkins/{TODAY}", {"note": "secret words"}, format="json")
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT note FROM tracking_dailycheckin WHERE user_id = %s", [user.pk]
        )
        raw = cursor.fetchone()[0]
    assert raw != "secret words"
    assert DailyCheckIn.objects.get(user=user).note == "secret words"


def test_cycle_status_postpartum(auth_client, postpartum):
    body = auth_client.get("/api/v1/cycle/status").json()
    assert body == {
        "mode": "postpartum",
        "days_since_birth": 30,
        "postpartum_week": 5,
        "stage": "recovery",
    }


def test_cycle_status_cycle_mode(auth_client, user):
    profile = user.profile
    profile.mode = "cycle"
    profile.save()
    Period.objects.create(user=user, start_date=TODAY - timedelta(days=27))
    Period.objects.create(
        user=user,
        start_date=TODAY,
        end_date=TODAY + timedelta(days=4),
    )
    body = auth_client.get("/api/v1/cycle/status").json()
    assert body["mode"] == "cycle"
    assert body["cycle_day"] == 1
    assert body["phase"] == "menstrual"


def test_cycle_status_cycle_no_periods(auth_client, user):
    user.profile.mode = "cycle"
    user.profile.save()
    body = auth_client.get("/api/v1/cycle/status").json()
    assert body["cycle_day"] is None
    assert body["confidence"] == "low"


def test_periods_crud(auth_client, user):
    created = auth_client.post(
        "/api/v1/periods", {"start_date": str(TODAY - timedelta(days=3))}, format="json"
    )
    assert created.status_code == 201, created.content
    pid = created.json()["id"]
    patched = auth_client.patch(
        f"/api/v1/periods/{pid}", {"end_date": str(TODAY)}, format="json"
    )
    assert patched.status_code == 200
    assert patched.json()["end_date"] == str(TODAY)
    bad = auth_client.post(
        "/api/v1/periods",
        {"start_date": str(TODAY), "end_date": str(TODAY - timedelta(days=1))},
        format="json",
    )
    assert bad.status_code == 400
    assert auth_client.delete(f"/api/v1/periods/{pid}").status_code == 204
    assert Period.objects.filter(user=user).count() == 0


def test_period_returned_switches_mode(auth_client, user):
    response = auth_client.post(
        "/api/v1/profile/period-returned",
        {"start_date": str(TODAY)},
        format="json",
    )
    assert response.status_code == 201, response.content
    assert response.json()["mode"] == "cycle"
    user.profile.refresh_from_db()
    assert user.profile.mode == "cycle"
    assert user.profile.period_returned is True
    assert Period.objects.filter(user=user).count() == 1


def test_epds_questions_bilingual(auth_client):
    pl = auth_client.get("/api/v1/epds/questions").json()
    en = auth_client.get("/api/v1/epds/questions", HTTP_ACCEPT_LANGUAGE="en").json()
    assert len(pl) == len(en) == 10
    assert pl[0]["text"] != en[0]["text"]
    assert len(pl[0]["options"]) == 4


def test_epds_submit_scores_and_risk(auth_client):
    # Worst answers incl. Q10 -> urgent.
    answers = [3, 3, 0, 3, 0, 0, 0, 0, 0, 0]
    response = auth_client.post("/api/v1/epds", {"answers": answers}, format="json")
    assert response.status_code == 201, response.content
    body = response.json()
    assert body["assessment"]["total"] == 30
    assert body["assessment"]["risk_level"] == "urgent"
    assert body["risk"]["level"] == "urgent"
    assert body["risk"]["reasons"] == ["R1", "R3"]


def test_epds_submit_moderate(auth_client):
    answers = [3, 3, 1, 3, 2, 3, 3, 3, 3, 3]  # total 12
    body = auth_client.post("/api/v1/epds", {"answers": answers}, format="json").json()
    assert body["assessment"]["total"] == 12
    assert body["risk"] == {
        "level": "moderate",
        "reasons": ["R4"],
        "actions": ["repeat_epds_14d", "open_toolkit"],
    }


def test_epds_submit_validation(auth_client):
    assert auth_client.post("/api/v1/epds", {"answers": [0] * 9}, format="json").status_code == 400
    assert auth_client.post("/api/v1/epds", {"answers": [0] * 9 + [9]}, format="json").status_code == 400
    assert auth_client.post("/api/v1/epds", {}, format="json").status_code == 400


def test_epds_history_and_due(auth_client, user, postpartum):
    assert auth_client.get("/api/v1/epds").json() == []
    due = auth_client.get("/api/v1/epds/due").json()
    assert due == {"due": True, "last_at": None}
    auth_client.post("/api/v1/epds", {"answers": [0] * 10}, format="json")
    assert len(auth_client.get("/api/v1/epds").json()) == 1
    due = auth_client.get("/api/v1/epds/due").json()
    assert due == {"due": False, "last_at": str(TODAY)}
    # Another user's EPDS does not affect this user.
    assert EPDSAssessment.objects.filter(user=user).count() == 1


def test_epds_due_cycle_mode_never(auth_client, user):
    user.profile.mode = "cycle"
    user.profile.save()
    assert auth_client.get("/api/v1/epds/due").json()["due"] is False


def test_export_contains_tracking_data(auth_client, user):
    DailyCheckIn.objects.create(user=user, date=TODAY, mood=3, note="hi")
    Period.objects.create(user=user, start_date=TODAY)
    body = auth_client.get("/api/v1/me/export").json()
    assert body["data"]["tracking"]["checkins"][0]["mood"] == 3
    assert body["data"]["tracking"]["checkins"][0]["note"] == "hi"
    assert len(body["data"]["tracking"]["periods"]) == 1


def test_selectors_latest_and_mood_today(user):
    DailyCheckIn.objects.create(user=user, date=TODAY - timedelta(days=2), mood=2)
    DailyCheckIn.objects.create(user=user, date=TODAY, mood=4)
    assert [c.mood for c in latest_checkins(user, 30)] == [4, 2]
    assert [c.mood for c in latest_checkins(user, 1)] == [4]
    assert mood_today(user) == 4


def test_unauthenticated_rejected(api_client):
    assert api_client.get("/api/v1/checkins").status_code == 401
    assert api_client.get("/api/v1/dashboard").status_code == 401
