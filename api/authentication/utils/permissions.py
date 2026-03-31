from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsStaff(BasePermission):
    message = "You must be a staff member to access this resource"

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_aunthenticated
            and request.user.role != "STUDENT"
        )


class IsStaffOrReadOnly(IsStaff):
    message = "You must be a staff member to perform this action"

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return super().has_permission(request, view)


class IsOwner(BasePermission):
    message = "You must be the owner of this object to access this"

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user if hasattr(obj, "owner") else False


class IsOwnerOrReadOnly(IsOwner):
    message = "You must be the owner of this object to access this"

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return super().has_object_permission(request, view, obj)


class IsAuthorized(BasePermission):
    message = "You are not authorized to access this resource"

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_superuser
        )

    def has_object_permission(self, request, view, obj):
        return (obj.owner == request.user if hasattr(obj, "owner") else False) or bool(
            request.user and request.user.is_superuser and request.user.is_authenticated
        )


class IsAuthorizedOrReadOnly(IsAuthorized):
    message = "You are not authorized to perform this action"

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return super().has_permission(request, view)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return super().has_object_permission(request, view, obj)


class HasRole(BasePermission):
    message = "You do not have permission to access this resource"

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if getattr(request.user, "is_superuser", False):
            return True

        allowed_roles = getattr(view, "allowed_roles", None)

        # If no roles are specified on the view, allow authenticated access
        if not allowed_roles:
            return True

        # Normalize allowed_roles to a list
        if isinstance(allowed_roles, str):
            allowed_roles = [allowed_roles]

        user_role = getattr(request.user, "role", None)
        return user_role in allowed_roles


class HasRoleOrReadOnly(HasRole):
    message = "You do not have permission to access this resource"

    def has_permission(self, request, view):

        if request.method in SAFE_METHODS:
            return True

        return super().has_permission(request, view)
