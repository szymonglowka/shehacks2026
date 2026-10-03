"""Journal app: small wins and visit questions, encrypted at rest (SPEC section 5, W10, W12)."""
from typing import ClassVar

from django.conf import settings
from django.db import models

from apps.common.fields import EncryptedTextField
from apps.common.models import TimeStampedModel


class SmallWin(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="small_wins"
    )
    date = models.DateField()
    text = EncryptedTextField()

    class Meta:
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "date")),
        ]

    def __str__(self):
        return f"SmallWin({self.user_id}, {self.date})"


class VisitQuestion(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="visit_questions"
    )
    text = EncryptedTextField()
    done = models.BooleanField(default=False)

    class Meta:
        indexes: ClassVar[list[models.Index]] = [
            models.Index(fields=("user", "done")),
        ]

    def __str__(self):
        return f"VisitQuestion({self.user_id}, done={self.done})"
