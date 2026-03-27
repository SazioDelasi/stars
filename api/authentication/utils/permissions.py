from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsStaff(BasePermission):
    message = "You must be a staff member to access this resource"

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_aunthenticated
            and request.user.role != "STUDENT"
        )


class IsStaffOrReadOnly(BasePermission):
    message = "You must be a staff member to perform this action"

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return bool(
            request.user and request.user.is_authenticated and request.user.is_staff
        )


class IsOwner(BasePermission):
    message = "You must be the owner of this object to access this"

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user if hasattr(obj, "owner") else False


class IsOwnerOrReadOnly(BasePermission):
    message = "You must be the owner of this object to access this"

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.owner == request.user if hasattr(obj, "owner") else False


class IsAuthorized(BasePermission):
    message = "You are not authorized to access this resource"

    def has_object_permission(self, request, view, obj):
        return (obj.owner == request.user if hasattr(obj, "owner") else False) or bool(
            request.user and request.user.is_admin and request.user.is_authenticated
        )


class IsAuthorizedOrReadOnly(BasePermission):
    message = "You are not authorized to perform this action"

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return (obj.owner == request.user if hasattr(obj, "owner") else False) or bool(
            request.user and request.user.is_admin and request.user.is_authenticated
        )


class HasRole(BasePermission):
    message = "You do not have permission to access this resource"

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        required_role = getattr(view, "required_role", None)
        if not required_role:
            return True

        return request.user.role == required_role


class HasRoleOrReadOnly(BasePermission):
    message = "You do not have permission to access this resource"

    def has_permission(self, request, view):

        if request.method in SAFE_METHODS:
            return True

        if not request.user.is_authenticated:
            return False

        required_role = getattr(view, "required_role", None)
        if not required_role:
            return True

        return request.user.role == required_role
