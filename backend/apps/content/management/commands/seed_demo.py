"""Deterministic demo dataset (SPEC section 9).

Usage:
    python manage.py seed_demo [--no-today]

Creates demo@otula.app (Marta, postpartum day 39, C-section, breastfeeding)
with 40 check-ins (dip in weeks 2-3, recovery after walks + sleep), EPDS
14->11->8, 5 goals with logs, 6 support sessions with real strategy
feedback (ranking visibly shifts), trusted contact Tomek, circle link with
4 requests (1 claimed by Tomek, 1 done), 9 small wins and 5 visit
questions; demo-cycle@otula.app (Kasia, 4 cycles); and 12 background
accounts with night last_seen_at for the Night Shift counter.

--no-today skips Marta's check-in for the current day, so a presenter can
fill it in live (empty check-in state). Password comes from
settings.DEMO_PASSWORD. Idempotent: demo users are matched by email and
their generated rows are rebuilt scoped to those users only.
"""
import random
import uuid
from datetime import timedelta

from django.apps import apps as django_apps
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

RANDOM_SEED = 42
MARTA_EMAIL = "demo@otula.app"
KASIA_EMAIL = "demo-cycle@otula.app"

EPDS_SERIES = (
    [2, 2, 1, 2, 1, 2, 1, 1, 1, 1],  # total 14
    [2, 1, 1, 2, 1, 1, 1, 1, 1, 0],  # total 11
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],  # total 8
)

# Onboarding survey answers (0-3) behind Marta's ranking story.
SURVEY_SCORES = {
    "short_walk": 3,
    "micro_rest": 2,
    "breathing_478": 2,
    "grounding_54321": 1,
    "warm_drink": 1,
}

# (strategy_code, helped, intensity, mood_after, days_ago): walk/rest on top.
SESSION_SERIES = (
    ("short_walk", "yes", 4, 3, 30),
    ("short_walk", "yes", 5, 2, 25),
    ("micro_rest", "yes", 3, 3, 20),
    ("short_walk", "somewhat", 4, 4, 15),
    ("breathing_478", "yes", 2, 4, 10),
    ("short_walk", "yes", 3, 4, 4),
)

WIN_TEXTS = [
    "Wzięłam prysznic.",
    "Wyszłam na 5 minut sama.",
    "Poprosiłam o pomoc.",
    "Pierwszy spacer we dwoje.",
    "Zadzwoniłam do mamy.",
    "Zjadłam ciepły obiad.",
    "Pospałam 3 godziny ciurkiem.",
    "Przeczytałam 10 stron książki.",
    "Powiedziałam nie bez wyrzutów.",
]

VISIT_QUESTIONS = [
    "Czy moje krwawienie jest jeszcze normalne?",
    "Kiedy mogę wrócić do ćwiczeń po cesarskim cięciu?",
    "Popuszczam mocz przy kichaniu — co dalej?",
    "Boli mnie rana po cesarce przy dłuższym chodzeniu — czy to normalne?",
    "Od dwóch tygodni prawie codziennie boli mnie głowa — co sprawdzić?",
]

CARE_REQUESTS = [
    {"title": "Obiad na czwartek", "category": "meal", "status": "open"},
    {
        "title": "Przejmij nocne karmienie w piątek",
        "category": "night",
        "status": "claimed",
        "claimed_by_name": "Tomek",
    },
    {"title": "Zakupy na weekend", "category": "errands", "status": "done"},
    {"title": "Zabierz starszaka na plac", "category": "siblings", "status": "open"},
]


def optional_model(path):
    """Return the model for 'app_label.Model' or None when unavailable."""
    try:
        return django_apps.get_model(path)
    except (LookupError, ImportError, ValueError):
        return None


class Command(BaseCommand):
    help = "Create the deterministic SPEC section 9 demo dataset."

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-today",
            action="store_true",
            help="Skip Marta's check-in for today (for a live empty-state demo).",
        )

    def handle(self, *args, **options):
        random.seed(RANDOM_SEED)
        call_command("seed_content")
        today = timezone.localdate()
        User = get_user_model()
        password = settings.DEMO_PASSWORD

        marta, _ = User.objects.get_or_create(email=MARTA_EMAIL)
        marta.set_password(password)
        marta.save()
        self._marta_profile(marta, today)
        self._marta_goals(marta, today)
        self._marta_tracking(marta, today, skip_today=options["no_today"])
        self._marta_support(marta, today)
        self._marta_contact(marta)
        self._marta_circle(marta)
        self._marta_journal(marta, today)
        self._kasia(today, password)
        self._background_users(password)
        self.stdout.write("seed_demo: done")

    # -- accounts / goals --------------------------------------------------

    def _marta_profile(self, marta, today):
        profile = marta.profile
        profile.display_name = "Marta"
        profile.language = "pl"
        profile.mode = "postpartum"
        profile.birth_date = today - timedelta(days=39)
        profile.delivery_type = "cesarean"
        profile.feeding = "breast"
        profile.onboarding_completed = True
        profile.save()

    def _marta_goals(self, marta, today):
        from apps.goals.models import Goal, GoalLog, GoalTemplate

        templates = list(
            GoalTemplate.objects.filter(mode__in=["postpartum", "both"]).order_by("id")[:5]
        )
        for template in templates:
            goal, _ = Goal.objects.get_or_create(
                user=marta,
                title=template.title_pl,
                defaults={
                    "template": template,
                    "description": template.description_pl,
                    "category": template.category,
                    "frequency": template.frequency,
                    "target_count": template.target_count,
                    "reminder_enabled": True,
                    "reminder_time": template.default_reminder_time,
                    "is_active": True,
                },
            )
            for back in range(21):
                day = today - timedelta(days=back)
                if random.random() < 0.7:
                    GoalLog.objects.update_or_create(
                        goal=goal, date=day, defaults={"completed": True}
                    )
        self.stdout.write(f"seed_demo: {len(templates)} goals for Marta")

    # -- tracking ----------------------------------------------------------

    def _checkin_row(self, DailyCheckIn, marta, post_day, day):
        if post_day <= 6:
            mood = random.choice([2, 2, 3, 3])
            sleep = round(random.uniform(3.0, 5.0), 1)
            energy, anxiety, pain = 2, 3, random.choice([3, 4, 5])
            symptoms = ["wound_pain", "fatigue", "lack_of_sleep"][: random.randint(2, 3)]
            emotions = ["tired", random.choice(["overwhelmed", "tender", "anxious"])]
            bleeding = "medium" if post_day <= 3 else "light"
        elif 7 <= post_day <= 21:  # dip in weeks 2-3
            mood = random.choice([1, 1, 2, 2, 3])
            sleep = round(random.uniform(2.5, 4.5), 1)
            energy, anxiety, pain = 2, 4, random.choice([1, 2, 3])
            pool = ["fatigue", "lack_of_sleep", "headache", "back_pain", "breast_pain"]
            symptoms = random.sample(pool, random.randint(2, 3))
            emotions = random.sample(
                ["overwhelmed", "lonely", "irritable", "anxious", "tired"], 2
            )
            bleeding = "light" if post_day <= 13 else "spotting" if post_day <= 20 else "none"
        else:  # recovery after walks + sleep
            mood = random.choice([3, 3, 4, 4])
            sleep = round(random.uniform(4.5, 6.5), 1)
            energy, anxiety, pain = 3, 2, random.choice([0, 0, 1])
            symptoms = [] if random.random() < 0.5 else ["fatigue"]
            emotions = ["calm", random.choice(["grateful", "tender"])]
            bleeding = "none"
        return DailyCheckIn(
            user=marta,
            date=day,
            mood=mood,
            energy=energy,
            anxiety=anxiety,
            sleep_hours=sleep,
            sleep_quality=min(5, max(1, mood)),
            pain=pain,
            emotions=emotions,
            bleeding=bleeding,
            symptoms=symptoms,
            red_flags=[],
            note="",
        )

    def _marta_tracking(self, marta, today, skip_today=False):
        from apps.tracking.models import DailyCheckIn, EPDSAssessment, Period

        DailyCheckIn.objects.filter(user=marta).delete()
        rows = []
        for post_day in range(40):  # postpartum days 0..39, today last
            day = today - timedelta(days=39 - post_day)
            if skip_today and day == today:
                continue
            rows.append(self._checkin_row(DailyCheckIn, marta, post_day, day))
        DailyCheckIn.objects.bulk_create(rows)
        EPDSAssessment.objects.filter(user=marta).delete()
        for weeks_ago, answers in zip((5, 3, 1), EPDS_SERIES):
            assessment = EPDSAssessment.objects.create(
                user=marta,
                answers=list(answers),
                total=sum(answers),
                self_harm_score=answers[9],
                risk_level="high" if sum(answers) >= 13 else "moderate",
            )
            created = timezone.make_aware(
                timezone.datetime.combine(
                    today - timedelta(weeks=weeks_ago), timezone.datetime.min.time()
                )
            )
            EPDSAssessment.objects.filter(pk=assessment.pk).update(created_at=created)
        Period.objects.filter(user=marta).delete()
        self.stdout.write(
            f"seed_demo: {len(rows)} check-ins + 3 EPDS for Marta"
            + (" (today skipped)" if skip_today else "")
        )

    # -- support -----------------------------------------------------------

    def _marta_support(self, marta, today):
        from apps.support.models import (
            CopingStrategy,
            SupportSession,
            UserCopingPreference,
        )
        from apps.support.ranking import apply_feedback

        SupportSession.objects.filter(user=marta).delete()
        UserCopingPreference.objects.filter(user=marta).delete()
        strategies = {s.code: s for s in CopingStrategy.objects.all()}
        for code, score in SURVEY_SCORES.items():
            if code in strategies:
                UserCopingPreference.objects.create(
                    user=marta, strategy=strategies[code], survey_score=score
                )
        for code, helped, intensity, mood_after, days_ago in SESSION_SERIES:
            strategy = strategies[code]
            started = timezone.make_aware(
                timezone.datetime.combine(
                    today - timedelta(days=days_ago), timezone.datetime.min.time()
                )
            ) + timedelta(hours=20)
            SupportSession.objects.create(
                user=marta,
                started_at=started,
                ended_at=started + timedelta(minutes=10),
                intensity=intensity,
                trigger="manual",
                strategy=strategy,
                helped=helped,
                mood_after=mood_after,
            )
            # Same accounting as PATCH /support/sessions/{id} in support views.
            pref, _ = UserCopingPreference.objects.get_or_create(
                user=marta, strategy=strategy, defaults={"survey_score": 0}
            )
            pref.helped_score_sum, pref.used_count = apply_feedback(
                pref.survey_score, pref.helped_score_sum, pref.used_count, helped
            )
            pref.save(update_fields=["helped_score_sum", "used_count"])
        self.stdout.write("seed_demo: 6 support sessions for Marta")

    def _marta_contact(self, marta):
        from apps.support.models import TrustedContact

        contact, _ = TrustedContact.objects.get_or_create(
            user=marta,
            name="Tomek",
            defaults={
                "relation": "partner",
                "phone": "+48 600 000 000",
                "preferred_channel": "whatsapp",
                "default_message": (
                    "Hej, jest mi dziś ciężko. Możesz wpaść na godzinę? "
                    "Nie musisz nic robić, wystarczy, że będziesz."
                ),
            },
        )
        self.stdout.write(f"seed_demo: trusted contact {contact.name}")

    # -- circle / journal / Kasia / background -------------------------------

    def _marta_circle(self, marta):
        from apps.circle.models import CareRequest, CircleLink

        link, _ = CircleLink.objects.get_or_create(
            user=marta, defaults={"token": uuid.uuid4(), "share_mood": True}
        )
        CareRequest.objects.filter(user=marta).delete()
        now = timezone.now()
        for entry in CARE_REQUESTS:
            claimed = entry["status"] == "claimed"
            done = entry["status"] == "done"
            CareRequest.objects.create(
                user=marta,
                title=entry["title"],
                category=entry["category"],
                when_label="w czwartek",
                note="",
                status=entry["status"],
                claimed_by_name=entry.get("claimed_by_name", ""),
                claimed_at=now - timedelta(days=1) if claimed or done else None,
                done_at=now - timedelta(hours=2) if done else None,
            )
        self.stdout.write(f"seed_demo: circle link {link.token} + 4 requests")

    def _marta_journal(self, marta, today):
        from apps.journal.models import SmallWin, VisitQuestion

        SmallWin.objects.filter(user=marta).delete()
        for index, text in enumerate(WIN_TEXTS):
            SmallWin.objects.create(
                user=marta, date=today - timedelta(days=index * 4), text=text
            )
        VisitQuestion.objects.filter(user=marta).delete()
        for text in VISIT_QUESTIONS:
            VisitQuestion.objects.create(user=marta, text=text, done=False)
        self.stdout.write("seed_demo: 9 wins + 5 visit questions for Marta")

    def _kasia(self, today, password):
        from apps.tracking.models import Period

        User = get_user_model()
        kasia, _ = User.objects.get_or_create(email=KASIA_EMAIL)
        kasia.set_password(password)
        kasia.save()
        profile = kasia.profile
        profile.display_name = "Kasia"
        profile.language = "pl"
        profile.mode = "cycle"
        profile.avg_cycle_length = 28
        profile.avg_period_length = 5
        profile.onboarding_completed = True
        profile.save()
        Period.objects.filter(user=kasia).delete()
        for cycle in range(4):
            start = today - timedelta(days=5 + cycle * 28)
            Period.objects.create(
                user=kasia, start_date=start, end_date=start + timedelta(days=5)
            )
        self.stdout.write("seed_demo: Kasia + 4 cycles")

    def _background_users(self, password):
        User = get_user_model()
        now = timezone.localtime()
        base = now.replace(hour=3, minute=0, second=0, microsecond=0)
        if base > now:
            base -= timedelta(days=1)
        for index in range(12):
            email = f"demo-night-{index:02d}@otula.app"
            user, _ = User.objects.get_or_create(email=email)
            user.set_password(password)
            user.save()
            profile = user.profile
            profile.display_name = f"Nocna Mama {index + 1}"
            profile.night_mode = "auto"
            profile.last_seen_at = base - timedelta(minutes=random.randint(0, 90))
            profile.save()
        self.stdout.write("seed_demo: 12 background night users")
