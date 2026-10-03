"""Insights API: patterns, forecast, night shift, dashboard (SPEC §6-7)."""
import logging
from datetime import timedelta
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.i18n import get_lang
from apps.tracking.cycle import PeriodInput, cycle_status
from apps.tracking.epds import is_due as epds_is_due
from apps.tracking.models import DailyCheckIn, EPDSAssessment, Period
from apps.tracking.selectors import cycle_status_for
from apps.tracking.serializers import DailyCheckInSerializer

from .engine import DayPoint, StrategyStat, build_cards, current_streak
from .forecast import ForecastContext, forecast_tomorrow

try:
    from apps.goals.models import GoalLog
except ImportError:  # goals not merged yet
    GoalLog = None

try:
    from apps.goals.selectors import today_goals
except ImportError:
    today_goals = None

try:
    from apps.notifications.models import Notification
except ImportError:
    Notification = None

try:
    from apps.content.selectors import article_of_the_day
except ImportError:
    article_of_the_day = None


def _checkins_map(user, since):
    return {
        c.date: c
        for c in DailyCheckIn.objects.filter(user=user, date__gte=since)
    }


def _goal_dates(user, since):
    """Dates with >= 1 completed goal (empty set when goals unavailable)."""
    if GoalLog is None:
        return set()
    return set(
        GoalLog.objects.filter(
            goal__user=user, date__gte=since, completed=True
        ).values_list("date", flat=True)
    )


def _strategy_stats(user):
    """Coping stats for the toolkit_top card ([] until support merges)."""
    try:
        from apps.support.models import CopingStrategy, UserCopingPreference
    except ImportError:
        return []
    stats = []
    for pref in UserCopingPreference.objects.filter(user=user).select_related(
        "strategy"
    ):
        stats.append(
            StrategyStat(
                code=pref.strategy.code,
                survey_score=pref.survey_score,
                used_count=pref.used_count,
                helped_score_sum=float(pref.helped_score_sum),
            )
        )
    # Strategies never rated nor used carry no signal.
    _ = CopingStrategy
    return stats


def _day_points(user, days=30):
    """DayPoint list for the insight window + raw check-in dates."""
    today = timezone.localdate()
    since = today - timedelta(days=days - 1)
    profile = user.profile
    by_date = _checkins_map(user, since)
    done_dates = _goal_dates(user, since)
    phases = {}
    if profile.mode == "cycle":
        periods = [
            PeriodInput(start_date=p.start_date, end_date=p.end_date)
            for p in Period.objects.filter(user=user).order_by("start_date")
        ]
        if periods:
            cursor = since
            while cursor <= today:
                phases[cursor] = cycle_status(
                    periods,
                    profile.avg_cycle_length,
                    profile.avg_period_length,
                    cursor,
                ).phase
                cursor += timedelta(days=1)
    points = []
    cursor = since
    while cursor <= today:
        checkin = by_date.get(cursor)
        if checkin is not None:
            points.append(
                DayPoint(
                    day=cursor,
                    mood=checkin.mood,
                    sleep_hours=checkin.sleep_hours,
                    goal_done=cursor in done_dates if GoalLog is not None else None,
                    phase=phases.get(cursor),
                )
            )
        cursor += timedelta(days=1)
    checkin_days = list(
        DailyCheckIn.objects.filter(user=user).values_list("date", flat=True)
    )
    return points, checkin_days


class InsightsView(APIView):
    def get(self, request):
        raw_range = request.query_params.get("range", "30")
        if raw_range not in ("7", "30"):
            return Response(
                {"detail": "Invalid range.",
                 "errors": {"range": ["Use 7 or 30."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        window = int(raw_range)
        today = timezone.localdate()
        since = today - timedelta(days=window - 1)
        series = [
            {
                "date": c.date.isoformat(),
                "mood": c.mood,
                "energy": c.energy,
                "anxiety": c.anxiety,
                "sleep_hours": c.sleep_hours,
            }
            for c in DailyCheckIn.objects.filter(
                user=request.user, date__gte=since
            ).order_by("date")
        ]
        points, checkin_days = _day_points(request.user)
        cards = build_cards(
            points, today, checkin_days, _strategy_stats(request.user)
        )
        phase_mood = next(
            (c["params"] for c in cards if c["code"] == "phase_mood"), None
        )
        epds_history = [
            {
                "date": a.created_at.date().isoformat(),
                "total": a.total,
                "risk_level": a.risk_level,
            }
            for a in EPDSAssessment.objects.filter(user=request.user).order_by(
                "created_at"
            )
        ]
        return Response(
            {
                "series": series,
                "phase_mood": phase_mood,
                "epds_history": epds_history,
                "cards": cards,
                "streaks": {"checkin": current_streak(checkin_days, today)},
            }
        )


class ForecastView(APIView):
    def get(self, request):
        user = request.user
        today = timezone.localdate()
        tomorrow = today + timedelta(days=1)
        profile = user.profile
        ctx_kwargs = {"mode": profile.mode}
        if profile.mode == "postpartum" and profile.birth_date is not None:
            ctx_kwargs["postpartum_day_tomorrow"] = (tomorrow - profile.birth_date).days
        elif profile.mode == "cycle":
            periods = [
                PeriodInput(start_date=p.start_date, end_date=p.end_date)
                for p in Period.objects.filter(user=user).order_by("start_date")
            ]
            if periods:
                status_tomorrow = cycle_status(
                    periods,
                    profile.avg_cycle_length,
                    profile.avg_period_length,
                    tomorrow,
                )
                if status_tomorrow.cycle_day in (1, 2):
                    ctx_kwargs["tomorrow_period_day"] = status_tomorrow.cycle_day
                else:
                    until = (status_tomorrow.next_period_date - tomorrow).days
                    if until == 2:
                        ctx_kwargs["days_until_period"] = 2
                    elif status_tomorrow.phase == "luteal":
                        ctx_kwargs["luteal_tomorrow"] = True
        recent = DailyCheckIn.objects.filter(user=user).order_by("-date")[:7]
        sleeps = [c.sleep_hours for c in recent if c.sleep_hours is not None][:3]
        moods = [c.mood for c in recent if c.mood is not None][:3]
        if sleeps:
            ctx_kwargs["avg_sleep_3d"] = sum(sleeps) / len(sleeps)
        if moods:
            ctx_kwargs["avg_mood_3d"] = sum(moods) / len(moods)
        ctx_kwargs["goal_streak"] = _goal_streak(user, today)
        return Response(forecast_tomorrow(ForecastContext(**ctx_kwargs)).as_dict())


def _goal_streak(user, today) -> int:
    """Consecutive days (ending today/yesterday) with a completed goal."""
    done = _goal_dates(user, today - timedelta(days=365))
    if today in done:
        cursor = today
    elif today - timedelta(days=1) in done:
        cursor = today - timedelta(days=1)
    else:
        return 0
    streak = 0
    while cursor in done:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


class NightView(APIView):
    def get(self, request):
        now = timezone.now()
        cutoff = now - timedelta(minutes=60)
        users = (
            get_user_model()
            .objects.filter(profile__last_seen_at__gte=cutoff)
            .exclude(pk=request.user.pk)
            .select_related("profile")
        )
        awake = 0
        for other in users:
            tz_name = getattr(other.profile, "timezone", None) or "Europe/Warsaw"
            try:
                local_hour = now.astimezone(ZoneInfo(tz_name)).hour
            except (ValueError, KeyError):
                logger.debug("night/now: skipping bad timezone %r", tz_name)
                continue
            if local_hour >= 22 or local_hour < 6:
                awake += 1
        # Privacy: hide small counts (SPEC §6.7).
        return Response({"awake_count": awake if awake >= 5 else None})


class DashboardView(APIView):
    def get(self, request):
        user = request.user
        today = timezone.localdate()
        lang = get_lang(request)
        today_checkin = DailyCheckIn.objects.filter(user=user, date=today).first()
        goals = self._today_goals(user)
        latest_epds = EPDSAssessment.objects.filter(user=user).first()
        last_at = latest_epds.created_at.date() if latest_epds else None
        points, checkin_days = _day_points(user)
        cards = build_cards(points, today, checkin_days, _strategy_stats(user))
        unread = (
            Notification.objects.filter(user=user, read_at__isnull=True).count()
            if Notification is not None
            else 0
        )
        return Response(
            {
                "status": cycle_status_for(user, today),
                "today_checkin": (
                    DailyCheckInSerializer(today_checkin).data
                    if today_checkin
                    else None
                ),
                "today_goals": goals,
                "insight": cards[0] if cards else None,
                "epds_due": {
                    "due": epds_is_due(user.profile.mode, last_at, today),
                    "last_at": last_at.isoformat() if last_at else None,
                },
                "article_of_day": self._article(user, lang),
                "unread_notifications": unread,
            }
        )

    def _today_goals(self, user):
        if today_goals is None:
            return []
        goals = today_goals(user)
        try:
            from apps.goals.serializers import GoalSerializer

            return GoalSerializer(goals, many=True).data
        except ImportError:
            return [{"id": g.pk, "title": g.title} for g in goals]

    def _article(self, user, lang):
        if article_of_the_day is None:
            return None
        article = article_of_the_day(user, lang)
        if article is None:
            return None
        if isinstance(article, dict):  # content.selectors returns an already-localized dict
            return article
        title = getattr(article, f"title_{lang}", None) or getattr(article, "title_pl", "")
        summary = getattr(article, f"summary_{lang}", None) or getattr(
            article, "summary_pl", ""
        )
        return {"slug": article.slug, "title": title, "summary": summary}
