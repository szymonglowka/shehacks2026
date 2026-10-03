"""Deterministic demo dataset (SPEC section 9).

Usage: python manage.py seed_demo   (run seed_content first; also safe standalone)

Creates demo@otula.app (Marta, postpartum day 39, C-section, breastfeeding)
with check-ins, EPDS 14->11->8, goals, support sessions, circle requests,
wins and visit questions; demo-cycle@otula.app (Kasia, 4 cycles); and 12
background accounts with night last_seen_at for the Night Shift counter.

Password comes from settings.DEMO_PASSWORD. Blocks that need models from
apps not merged yet (tracking, support, circle, journal) are guarded and
skipped with a note; they activate automatically once those models exist.
The command is idempotent: demo users are matched by email and their
generated rows are rebuilt scoped to those users only.
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
        self._marta_tracking(marta, today)
        self._marta_support(marta, today)
        self._marta_circle(marta)
        self._marta_journal(marta, today)
        self._kasia(today, password)
        self._background_users(password)
        self.stdout.write("seed_demo: done")

    # -- accounts / goals (models exist) -----------------------------------

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

    # -- guarded blocks (activate when sibling models merge) ---------------

    def _marta_tracking(self, marta, today):
        DailyCheckIn = optional_model("tracking.DailyCheckIn")
        EPDSAssessment = optional_model("tracking.EPDSAssessment")
        Period = optional_model("tracking.Period")
        if DailyCheckIn is None or EPDSAssessment is None:
            self.stdout.write("seed_demo: skip check-ins+EPDS (tracking models missing)")
            return
        DailyCheckIn.objects.filter(user=marta).delete()
        rows = []
        for back in range(41, -1, -1):
            day = today - timedelta(days=back)
            post_day = 39 - back  # postpartum day for this check-in
            if 7 <= post_day <= 21:  # dip in weeks 2-3
                mood = random.choice([1, 1, 2, 2])
                sleep = round(random.uniform(2.5, 4.5), 1)
                energy, anxiety = 2, 4
            elif post_day < 7:
                mood = random.choice([2, 2, 3])
                sleep = round(random.uniform(3.0, 5.0), 1)
                energy, anxiety = 2, 3
            else:  # recovery after walks + sleep
                mood = random.choice([3, 3, 4, 4])
                sleep = round(random.uniform(4.5, 6.5), 1)
                energy, anxiety = 3, 2
            rows.append(
                DailyCheckIn(
                    user=marta,
                    date=day,
                    mood=mood,
                    energy=energy,
                    anxiety=anxiety,
                    sleep_hours=sleep,
                    sleep_quality=min(5, max(1, mood)),
                    pain=random.choice([0, 1, 2, 3]),
                    emotions=["tired"] if mood <= 2 else ["calm", "grateful"],
                    bleeding="none",
                    symptoms=[],
                    red_flags=[],
                    note="",
                )
            )
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
                timezone.datetime.combine(today - timedelta(weeks=weeks_ago), timezone.datetime.min.time())
            )
            EPDSAssessment.objects.filter(pk=assessment.pk).update(created_at=created)
        if Period is not None:
            Period.objects.filter(user=marta).delete()
        self.stdout.write("seed_demo: 42 check-ins + 3 EPDS for Marta")

    def _marta_support(self, marta, today):
        SupportSession = optional_model("support.SupportSession")
        if SupportSession is None:
            self.stdout.write("seed_demo: skip support sessions (support models missing)")
            return
        SupportSession.objects.filter(user=marta).delete()
        feedback = ["yes", "yes", "somewhat", "yes", "somewhat", "no"]
        for index, helped in enumerate(feedback):
            started = timezone.make_aware(
                timezone.datetime.combine(
                    today - timedelta(days=30 - index * 5), timezone.datetime.min.time()
                )
            ) + timedelta(hours=20)
            SupportSession.objects.create(
                user=marta,
                started_at=started,
                ended_at=started + timedelta(minutes=10),
                intensity=[4, 5, 3, 4, 2, 3][index],
                trigger="manual",
                strategy=None,
                helped=helped,
                mood_after=[3, 2, 3, 4, 4, 3][index],
            )
        self.stdout.write("seed_demo: 6 support sessions for Marta")

    def _marta_circle(self, marta):
        CircleLink = optional_model("circle.CircleLink")
        CareRequest = optional_model("circle.CareRequest")
        if CircleLink is None or CareRequest is None:
            self.stdout.write("seed_demo: skip circle (circle models missing)")
            return
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
        SmallWin = optional_model("journal.SmallWin")
        VisitQuestion = optional_model("journal.VisitQuestion")
        if SmallWin is None or VisitQuestion is None:
            self.stdout.write("seed_demo: skip wins+questions (journal models missing)")
            return
        SmallWin.objects.filter(user=marta).delete()
        for index, text in enumerate(WIN_TEXTS):
            SmallWin.objects.create(
                user=marta, date=today - timedelta(days=index * 4), text=text
            )
        VisitQuestion.objects.filter(user=marta).delete()
        for text in VISIT_QUESTIONS:
            VisitQuestion.objects.create(user=marta, text=text, done=False)
        self.stdout.write("seed_demo: 9 wins + 3 visit questions for Marta")

    def _kasia(self, today, password):
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
        Period = optional_model("tracking.Period")
        if Period is None:
            self.stdout.write("seed_demo: skip Kasia periods (tracking models missing)")
            return
        Period.objects.filter(user=kasia).delete()
        for cycle in range(4):
            start = today - timedelta(days=5 + cycle * 28)
            Period.objects.create(user=kasia, start_date=start, end_date=start + timedelta(days=5))
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
