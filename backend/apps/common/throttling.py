from rest_framework.throttling import SimpleRateThrottle


class PublicThrottle(SimpleRateThrottle):
    """Global 30/min throttle (scope "public" in DEFAULT_THROTTLE_RATES).

    Public circle endpoints additionally set `throttle_scope = "public"`;
    this class applies the same rate everywhere so anonymous burst traffic
    stays bounded even before per-view scopes land.
    """

    scope = "public"

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}
