from rest_framework import permissions


class IsOwnerOrStaffOrReadOnly(permissions.BasePermission):
    """Allows public read access, authenticated creation, and creator/staff modification/deletion."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff:
            return True

        # Owner check (created_by field)
        return hasattr(obj, "created_by") and obj.created_by == request.user


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """Allows public read access and authenticated creation."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated
