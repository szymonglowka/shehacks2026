"""Journal API tests: wins, visit questions, report, encryption, isolation."""
from datetime import timedelta

import pytest
from django.db import connection
from django.utils import timezone
from rest_framework.test import APIClient

from apps.common.factories import UserFactory
from apps.journal.models import SmallWin, VisitQuestion
from apps.journal.selectors import wins_count
from apps.tracking.models import DailyCheckIn, EPDSAssessment

TODAY = timezone.localdate()


@pytest.fixture
def other_user(db):
    return UserFactory()


def test_wins_crud(auth_client):
    created = auth_client.post(
        "/api/v1/wins", {"date": str(TODAY), "text": "Wzięłam prysznic"}, format="json"
    )
    assert created.status_code == 201
    assert auth_client.get("/api/v1/wins").json()[0]["text"] == "Wzięłam prysznic"
    win_id = created.json()["id"]
    assert (
        auth_client.patch(f"/api/v1/wins/{win_id}", {"text": "Spacer!"},
                          format="json").status_code
        == 200
    )
    assert auth_client.delete(f"/api/v1/wins/{win_id}").status_code == 204
    assert auth_client.get("/api/v1/wins").json() == []


def test_wins_isolation(auth_client, user, other_user):
    SmallWin.objects.create(user=user, date=TODAY, text="mine")
    other = APIClient()
    other.force_authenticate(user=other_user)
    assert other.get("/api/v1/wins").json() == []
    assert other.get("/api/v1/wins/random").status_code == 404


def test_random_win(auth_client, user):
    assert auth_client.get("/api/v1/wins/random").status_code == 404
    SmallWin.objects.create(user=user, date=TODAY, text="first")
    SmallWin.objects.create(user=user, date=TODAY, text="second")
    texts = {
        auth_client.get("/api/v1/wins/random").json()["text"] for _ in range(10)
    }
    assert texts <= {"first", "second"}
    assert auth_client.get("/api/v1/wins/random").json()["text"] in texts


def test_win_text_encrypted_at_rest(user):
    SmallWin.objects.create(user=user, date=TODAY, text="sekretny tekst")
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT text FROM journal_smallwin WHERE user_id = %s", [user.id]
        )
        stored = cursor.fetchone()[0]
    assert stored != "sekretny tekst"
    assert SmallWin.objects.get(user=user).text == "sekretny tekst"


def test_visit_questions_crud(auth_client):
    created = auth_client.post(
        "/api/v1/visit-questions", {"text": "Czy ten smutek minie?"}, format="json"
    )
    assert created.status_code == 201
    qid = created.json()["id"]
    assert (
        auth_client.patch(f"/api/v1/visit-questions/{qid}", {"done": True},
                          format="json").json()["done"]
        is True
    )
    assert auth_client.delete(f"/api/v1/visit-questions/{qid}").status_code == 204


def test_report_weeks_validated(auth_client):
    assert auth_client.get("/api/v1/reports/visit?weeks=5").status_code == 400
    assert auth_client.get("/api/v1/reports/visit?weeks=x").status_code == 400


def test_report_empty_tracking_sections(auth_client, user):
    user.profile.display_name = "Marta"
    user.profile.mode = "postpartum"
    user.profile.birth_date = TODAY - timedelta(days=39)
    user.profile.delivery_type = "cesarean"
    user.profile.save()
    body = auth_client.get("/api/v1/reports/visit?weeks=4").json()
    assert body["weeks"] == 4
    assert body["profile"]["postpartum_day"] == 39
    assert body["profile"]["postpartum_week"] == 6
    assert body["profile"]["delivery_type"] == "cesarean"
    assert body["mood_sleep"] == {"days": 0, "avg_mood": None, "avg_sleep_hours": None}
    assert body["symptoms"] == []
    assert body["red_flags"] == []
    assert body["epds"] == {"history": [], "trend": None}
    assert body["wins_count"] == 0
    assert body["questions"] == []


def test_report_aggregates_tracking(auth_client, user):
    DailyCheckIn.objects.create(
        user=user, date=TODAY - timedelta(days=2), mood=2, sleep_hours=4.0,
        symptoms=["headache"], red_flags=[],
    )
    DailyCheckIn.objects.create(
        user=user, date=TODAY - timedelta(days=1), mood=4, sleep_hours=6.0,
        symptoms=["headache", "fatigue"], red_flags=["fever"],
    )
    EPDSAssessment.objects.create(
        user=user, answers=[0] * 10, total=14,
        self_harm_score=0, risk_level="high",
    )
    VisitQuestion.objects.create(user=user, text="Pytanie 1")
    body = auth_client.get("/api/v1/reports/visit?weeks=2").json()
    assert body["mood_sleep"] == {"days": 2, "avg_mood": 3.0, "avg_sleep_hours": 5.0}
    assert body["symptoms"][0] == {"symptom": "headache", "count": 2, "days": 2}
    assert len(body["red_flags"]) == 1
    assert body["red_flags"][0]["red_flags"] == ["fever"]
    assert body["epds"]["history"][0]["total"] == 14
    assert len(body["questions"]) == 1


def test_wins_count_selector(user):
    assert wins_count(user) == 0
    SmallWin.objects.create(user=user, date=TODAY, text="a")
    assert wins_count(user) == 1


def test_journal_export(user):
    from apps.journal.export import export_user_data

    SmallWin.objects.create(user=user, date=TODAY, text="mała wygrana")
    data = export_user_data(user)
    assert data["small_wins"][0]["text"] == "mała wygrana"
