from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """Object-level permission: only the owning user may access."""

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "user", obj)
        return owner == request.user
