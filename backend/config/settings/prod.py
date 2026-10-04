"""Production settings for the VPS deployment (Nginx Proxy Manager in front).

TLS is terminated by NPM; Django sees plain HTTP behind it, so the
``X-Forwarded-Proto: https`` header set by NPM is trusted for
``request.is_secure()``. Secrets come from the server-side ``.env``
(never committed) — see ``DEPLOYMENT.md``.
"""

import os

from .base import *  # noqa: F401,F403

DEBUG = False

# NPM terminates TLS and proxies as http; it sends X-Forwarded-Proto: https.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])  # noqa: F405

# Admin / DRF static files collected here and served by the nginx gateway.
STATIC_ROOT = os.path.join(str(BASE_DIR), "staticfiles")  # noqa: F405

# Same-origin in production (frontend + /api/ on one domain): browser does
# not send CORS preflights. Extra origins only if ever needed.
_prod_cors = env.list("CORS_EXTRA_ORIGINS", default=[])  # noqa: F405
CORS_ALLOWED_ORIGINS = list(set(CORS_ALLOWED_ORIGINS + _prod_cors))  # noqa: F405
