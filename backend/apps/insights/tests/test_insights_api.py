"""Insights API tests: patterns, forecast, night, dashboard, isolation."""
from datetime import timedelta
from types import SimpleNamespace

import pytest
from django.utils import timezone
from freezegun import freeze_time

import apps.insights.views as insights_views
from apps.goals.models import Goal, GoalLog
from apps.notifications.models import Notification
from apps.tracking.models import DailyCheckIn, EPDSAssessment, Period

TODAY = timezone.localdate()


@pytest.fixture
def postpartum(user):
    profile = user.profile
    profile.mode = "postpartum"
    profile.birth_date = TODAY - timedelta(days=30)
    profile.save()
    return user


def make_checkins(user, days=14, mood=4, sleep=7.0):
    for i in range(days):
        DailyCheckIn.objects.create(
            user=user,
            date=TODAY - timedelta(days=days - 1 - i),
            mood=mood,
            sleep_hours=sleep,
        )


def test_insights_series_and_cards(auth_client, user, postpartum):
    # Old week: bad sleep + low mood; recent week: good sleep + high mood.
    for i in range(14):
        good = i >= 7
        DailyCheckIn.objects.create(
            user=user,
            date=TODAY - timedelta(days=13 - i),
            mood=4 if good else 2,
            sleep_hours=7.0 if good else 4.0,
            energy=3,
            anxiety=2,
        )
    body = auth_client.get("/api/v1/insights", {"range": "7"}).json()
    assert len(body["series"]) == 7
    assert all(set(s) == {"date", "mood", "energy", "anxiety", "sleep_hours"}
               for s in body["series"])
    codes = {c["code"] for c in body["cards"]}
    assert {"sleep_mood", "trend", "streak"} <= codes
    assert body["streaks"] == {"checkin": 14}
    assert body["epds_history"] == []
    assert body["phase_mood"] is None  # postpartum: no phases


def test_insights_default_range_30_and_bad_range(auth_client, user):
    make_checkins(user)
    assert len(auth_client.get("/api/v1/insights").json()["series"]) == 14
    response = auth_client.get("/api/v1/insights", {"range": "90"})
    assert response.status_code == 400


def test_insights_phase_mood_cycle_mode(auth_client, user):
    user.profile.mode = "cycle"
    user.profile.save()
    Period.objects.create(user=user, start_date=TODAY - timedelta(days=20))
    # Cycle days 8-17: follicular (8-12), ovulation (13-15), luteal (16-17).
    moods = [3] * 5 + [4] * 2 + [2] * 3
    for i, mood in enumerate(moods):
        DailyCheckIn.objects.create(
            user=user, date=TODAY - timedelta(days=len(moods) - 1 - i), mood=mood
        )
    body = auth_client.get("/api/v1/insights").json()
    assert body["phase_mood"] is not None
    assert set(body["phase_mood"]) >= {"avgs", "best_phase", "n"}


def test_insights_epds_history(auth_client, user):
    best = [0, 0, 3, 0, 3, 3, 3, 3, 3, 3]  # least severe on every item
    auth_client.post("/api/v1/epds", {"answers": best}, format="json")
    history = auth_client.get("/api/v1/insights").json()["epds_history"]
    assert len(history) == 1
    assert history[0]["total"] == 0


def test_forecast_sunny_default(auth_client, user):
    body = auth_client.get("/api/v1/forecast/tomorrow").json()
    assert body["outlook"] == "sunny"
    assert set(body) == {"outlook", "factors", "tip_code"}


def test_forecast_baby_blues_peak(auth_client, user):
    user.profile.mode = "postpartum"
    user.profile.birth_date = TODAY - timedelta(days=3)  # tomorrow = day 4
    user.profile.save()
    body = auth_client.get("/api/v1/forecast/tomorrow").json()
    assert body["outlook"] == "cloudy"
    assert body["factors"] == ["baby_blues_peak"]
    assert body["tip_code"] == "lower_expectations"


def test_forecast_period_soon(auth_client, user):
    user.profile.mode = "cycle"
    user.profile.save()
    Period.objects.create(user=user, start_date=TODAY - timedelta(days=25))
    body = auth_client.get("/api/v1/forecast/tomorrow").json()
    # Tomorrow is day 27 of a 28-day cycle -> next period in 2 days.
    assert body["outlook"] == "cloudy"
    assert body["factors"] == ["period_soon"]


def test_forecast_poor_sleep_and_streak(auth_client, user):
    for i in range(3):
        DailyCheckIn.objects.create(
            user=user, date=TODAY - timedelta(days=i), mood=2, sleep_hours=4.0
        )
    goal = Goal.objects.create(user=user, title="Walk")
    for i in range(3):
        GoalLog.objects.create(
            goal=goal, date=TODAY - timedelta(days=i), completed=True
        )
    body = auth_client.get("/api/v1/forecast/tomorrow").json()
    # -2 (sleep) -1 (trend) +1 (streak) = -2 -> cloudy.
    assert body["outlook"] == "cloudy"
    assert "poor_sleep" in body["factors"]
    assert "goal_streak" in body["factors"]


def _night_users(count, **profile_kw):
    from apps.common.factories import UserFactory

    users = []
    for _ in range(count):
        other = UserFactory()
        profile = other.profile
        for key, value in profile_kw.items():
            setattr(profile, key, value)
        profile.last_seen_at = timezone.now()
        profile.save()
        users.append(other)
    return users


@freeze_time("2026-01-05 01:00:00")  # 02:00 in Warsaw (night)
def test_night_counts_awake_others(auth_client, user):
    auth_client.get("/api/v1/night/now")  # touch middleware path first
    _night_users(5)
    body = auth_client.get("/api/v1/night/now").json()
    assert body == {"awake_count": 5}


@freeze_time("2026-01-05 01:00:00")
def test_night_hidden_below_five(auth_client):
    _night_users(4)
    assert auth_client.get("/api/v1/night/now").json() == {"awake_count": None}


@freeze_time("2026-01-05 01:00:00")
def test_night_excludes_daytime_zone_and_self(auth_client, user):
    user.profile.last_seen_at = timezone.now()  # self never counted
    user.profile.save()
    _night_users(5)
    _night_users(3, timezone="Pacific/Kiritimati")  # 15:00 local: day
    body = auth_client.get("/api/v1/night/now").json()
    assert body == {"awake_count": 5}


@freeze_time("2026-01-05 12:00:00")  # 13:00 in Warsaw (day)
def test_night_empty_during_day(auth_client):
    _night_users(6)
    assert auth_client.get("/api/v1/night/now").json() == {"awake_count": None}


def test_dashboard_shape(auth_client, user, postpartum):
    DailyCheckIn.objects.create(user=user, date=TODAY, mood=4, sleep_hours=6.5)
    Goal.objects.create(user=user, title="Walk")
    Notification.objects.create(
        user=user, kind="system", title="Hi", body="hello",
        sent_at=timezone.now(),
    )
    body = auth_client.get("/api/v1/dashboard").json()
    assert set(body) == {
        "status", "today_checkin", "today_goals", "insight",
        "epds_due", "article_of_day", "unread_notifications",
    }
    assert body["status"]["mode"] == "postpartum"
    assert body["today_checkin"]["mood"] == 4
    assert len(body["today_goals"]) == 1
    assert body["epds_due"] == {"due": True, "last_at": None}
    assert body["article_of_day"] is None  # content selectors not merged yet
    assert body["unread_notifications"] == 1


def test_dashboard_article_wiring(auth_client, user, monkeypatch):
    article = SimpleNamespace(
        slug="sleep", title_pl="Sen", title_en="Sleep",
        summary_pl="s", summary_en="s",
    )
    monkeypatch.setattr(
        insights_views, "article_of_the_day", lambda u, lang: article
    )
    body = auth_client.get("/api/v1/dashboard").json()
    assert body["article_of_day"]["slug"] == "sleep"


def test_dashboard_isolation(auth_client, user):
    from apps.common.factories import UserFactory

    other = UserFactory()
    DailyCheckIn.objects.create(user=other, date=TODAY, mood=1)
    EPDSAssessment.objects.create(
        user=other, answers=[0] * 10, total=21, self_harm_score=3,
        risk_level="urgent",
    )
    body = auth_client.get("/api/v1/dashboard").json()
    assert body["today_checkin"] is None
    assert body["epds_due"] == {"due": True, "last_at": None}


def test_dashboard_accepts_dict_from_content_selector(auth_client, user, monkeypatch):
    # apps.content.selectors.article_of_the_day returns an already-localized dict
    article = {"slug": "dno-miednicy-podstawy", "title": "Dno miednicy", "summary": "…"}
    monkeypatch.setattr(insights_views, "article_of_the_day", lambda u, lang: article)
    body = auth_client.get("/api/v1/dashboard").json()
    assert body["article_of_day"]["slug"] == "dno-miednicy-podstawy"
