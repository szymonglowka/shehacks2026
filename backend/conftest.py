import importlib
import sys

import pytest
from rest_framework.test import APIClient

from apps.common.factories import UserFactory

# TEMPORARY checkpoint-0 compat: b-track's pre-checkpoint tests use bare
# `import risk` / `from engine import ...`. Now that every app is a real
# package, alias those top-level names to their package locations until b-track
# switches to package imports (see docs/agents/requests/platform.md).
_COMPAT_ALIASES = {
    "risk": "apps.tracking.risk",
    "cycle": "apps.tracking.cycle",
    "epds": "apps.tracking.epds",
    "engine": "apps.insights.engine",
    "forecast": "apps.insights.forecast",
}
for _alias, _target in _COMPAT_ALIASES.items():
    if _alias not in sys.modules:
        try:
            sys.modules[_alias] = importlib.import_module(_target)
        except ImportError:
            pass


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client
