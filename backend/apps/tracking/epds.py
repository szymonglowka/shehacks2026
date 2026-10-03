"""EPDS — Edinburgh Postnatal Depression Scale (SPEC §6.3).

Reference: Cox, J.L., Holden, J.M., Sagovsky, R. (1987). Detection of
postnatal depression: Development of the 10-item Edinburgh Postnatal
Depression Scale. British Journal of Psychiatry, 150, 782-786.

Scoring: questions 1, 2, 4 are scored normally (first option = 0);
questions 3, 5-10 are reverse-scored (first option = 3), i.e. their
options are listed most-severe-first. Each answer is stored as the
selected option index (0-3); the score is derived from it.

NOTE: the Polish wording below still needs verification against the
validated Polish EPDS translation before any clinical use.

Pure module, no Django.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class EPDSQuestion:
    number: int  # 1-10
    reverse: bool
    text_pl: str
    text_en: str
    options_pl: tuple[str, str, str, str]
    options_en: tuple[str, str, str, str]

    def score(self, answer_index: int) -> int:
        if answer_index not in (0, 1, 2, 3):
            raise ValueError(f"answer must be 0-3, got {answer_index!r}")
        return 3 - answer_index if self.reverse else answer_index

    def localized(self, lang: str) -> dict:
        pl = lang != "en"
        return {
            "number": self.number,
            "text": self.text_pl if pl else self.text_en,
            "options": list(self.options_pl if pl else self.options_en),
        }


QUESTIONS: tuple[EPDSQuestion, ...] = (
    EPDSQuestion(
        number=1, reverse=False,
        text_pl="Potrafiłam się śmiać i dostrzegać zabawne strony życia",
        text_en="I have been able to laugh and see the funny side of things",
        options_pl=("Tak często jak zwykle", "Nie tak często jak kiedyś",
                    "Zdecydowanie rzadziej niż kiedyś", "Wcale"),
        options_en=("As much as I always could", "Not quite so much now",
                    "Definitely not so much now", "Not at all"),
    ),
    EPDSQuestion(
        number=2, reverse=False,
        text_pl="Z przyjemnością wyczekiwałam różnych spraw",
        text_en="I have looked forward with enjoyment to things",
        options_pl=("Tak jak zawsze", "Rzadziej niż kiedyś",
                    "Zdecydowanie rzadziej niż kiedyś", "Prawie wcale"),
        options_en=("As much as I ever did", "Rather less than I used to",
                    "Definitely less than I used to", "Hardly at all"),
    ),
    EPDSQuestion(
        number=3, reverse=True,
        text_pl="Niesłusznie obwiniałam się, gdy coś poszło nie tak",
        text_en="I have blamed myself unnecessarily when things went wrong",
        options_pl=("Tak, przez większość czasu", "Tak, czasami",
                    "Rzadko", "Nie, nigdy"),
        options_en=("Yes, most of the time", "Yes, some of the time",
                    "Not very often", "No, never"),
    ),
    EPDSQuestion(
        number=4, reverse=False,
        text_pl="Bez wyraźnego powodu odczuwałam lęk lub martwiłam się",
        text_en="I have been anxious or worried for no good reason",
        options_pl=("Nie, wcale", "Prawie nigdy",
                    "Tak, czasami", "Tak, bardzo często"),
        options_en=("No, not at all", "Hardly ever",
                    "Yes, sometimes", "Yes, very often"),
    ),
    EPDSQuestion(
        number=5, reverse=True,
        text_pl="Bez wyraźnego powodu czułam strach lub panikę",
        text_en="I have felt scared or panicky for no very good reason",
        options_pl=("Tak, dość często", "Tak, czasami",
                    "Nie, raczej nie", "Nie, wcale"),
        options_en=("Yes, quite a lot", "Yes, sometimes",
                    "No, not much", "No, not at all"),
    ),
    EPDSQuestion(
        number=6, reverse=True,
        text_pl="Sprawy mnie przerastały",
        text_en="Things have been getting on top of me",
        options_pl=("Tak, przez większość czasu sobie nie radziłam",
                    "Tak, czasami nie radziłam sobie tak jak zwykle",
                    "Nie, zwykle radziłam sobie dobrze",
                    "Nie, radziłam sobie tak dobrze jak zwykle"),
        options_en=("Yes, most of the time I haven't been able to cope at all",
                    "Yes, sometimes I haven't been coping as well as usual",
                    "No, most of the time I have coped quite well",
                    "No, I have been coping as well as ever"),
    ),
    EPDSQuestion(
        number=7, reverse=True,
        text_pl="Byłam tak nieszczęśliwa, że miałam trudności ze snem",
        text_en="I have been so unhappy that I have had difficulty sleeping",
        options_pl=("Tak, przez większość czasu", "Tak, czasami",
                    "Rzadko", "Nie, wcale"),
        options_en=("Yes, most of the time", "Yes, sometimes",
                    "Not very often", "No, not at all"),
    ),
    EPDSQuestion(
        number=8, reverse=True,
        text_pl="Czułam się smutna lub przygnębiona",
        text_en="I have felt sad or miserable",
        options_pl=("Tak, przez większość czasu", "Tak, dość często",
                    "Rzadko", "Nie, wcale"),
        options_en=("Yes, most of the time", "Yes, quite often",
                    "Not very often", "No, not at all"),
    ),
    EPDSQuestion(
        number=9, reverse=True,
        text_pl="Byłam tak nieszczęśliwa, że płakałam",
        text_en="I have been so unhappy that I have been crying",
        options_pl=("Tak, przez większość czasu", "Tak, dość często",
                    "Tylko sporadycznie", "Nie, nigdy"),
        options_en=("Yes, most of the time", "Yes, quite often",
                    "Only occasionally", "No, never"),
    ),
    EPDSQuestion(
        number=10, reverse=True,
        text_pl="Myślałam o zrobieniu sobie krzywdy",
        text_en="The thought of harming myself has occurred to me",
        options_pl=("Tak, dość często", "Czasami",
                    "Rzadko", "Nigdy"),
        options_en=("Yes, quite often", "Sometimes",
                    "Hardly ever", "Never"),
    ),
)

REVERSED_NUMBERS = tuple(q.number for q in QUESTIONS if q.reverse)
assert REVERSED_NUMBERS == (3, 5, 6, 7, 8, 9, 10), REVERSED_NUMBERS

# Risk bands shared with risk.py R1/R3/R4.
HIGH_THRESHOLD = 13
MODERATE_MIN = 10
DUE_AFTER_DAYS = 14


@dataclass(frozen=True)
class EPDSResult:
    total: int
    self_harm_score: int  # score of question 10 (0-3)
    risk_level: str  # low | moderate | high | urgent


def risk_level(total: int, self_harm_score: int) -> str:
    if self_harm_score >= 1:
        return "urgent"
    if total >= HIGH_THRESHOLD:
        return "high"
    if total >= MODERATE_MIN:
        return "moderate"
    return "low"


def score_answers(answers: list[int] | tuple[int, ...]) -> EPDSResult:
    """Score 10 option indices (0-3 each) into total / self-harm / level."""
    if len(answers) != 10:
        raise ValueError(f"EPDS needs exactly 10 answers, got {len(answers)}")
    scores = [q.score(a) for q, a in zip(QUESTIONS, answers)]
    total = sum(scores)
    self_harm = scores[9]
    return EPDSResult(total=total, self_harm_score=self_harm,
                      risk_level=risk_level(total, self_harm))


def get_questions(lang: str = "pl") -> list[dict]:
    """Localized questions (options in display order) for the API."""
    return [q.localized(lang) for q in QUESTIONS]


def is_due(mode: str, last_assessment: date | None, today: date) -> bool:
    """Due in postpartum mode when never filled or last was >= 14 days ago.

    In cycle mode EPDS is on-demand only, never due.
    """
    if mode != "postpartum":
        return False
    if last_assessment is None:
        return True
    return (today - last_assessment).days >= DUE_AFTER_DAYS
