"""
Centralised permission and scope utilities for UENR STARS.
Every view and service pulls scoping from here — no scattered role checks.
"""
from rest_framework import permissions


# ── DRF permission classes ────────────────────────────────────────────────────

class IsAnyStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_any_staff

class IsHOD(permissions.BasePermission):
    """Only HoDs (and university coordinator) can use this endpoint."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ('hod', 'university_coordinator')
        )

class IsCoordinator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_exams_coordinator


class IsUniversityCoordinator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_university_coordinator


class IsDeptCoordinatorOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_exams_coordinator


# ── Scope helpers (used by views AND reporting services) ─────────────────────

def scoped_dept_id(user):
    """
    Return the single department_id this user is restricted to,
    or None for university-wide access.
    Always enforced server-side — never trust the frontend.
    """
    if getattr(user, 'has_dept_scope', False) and user.department_id:
        return user.department_id
    return None


def scope_students(user, qs=None):
    """Return a Student queryset scoped to user's department."""
    from students.models import Student
    if qs is None:
        qs = Student.objects.select_related('user', 'department', 'programme')
    dept_id = scoped_dept_id(user)
    if dept_id:
        qs = qs.filter(department_id=dept_id)
    return qs


def scope_courses(user, qs=None):
    """Return a Course queryset scoped to user's department."""
    from results.models import Course
    if qs is None:
        qs = Course.objects.select_related('department')
    dept_id = scoped_dept_id(user)
    if dept_id:
        qs = qs.filter(department_id=dept_id)
    return qs


def scope_programmes(user, qs=None):
    """Return a Programme queryset scoped to user's department."""
    from students.models import Programme
    if qs is None:
        qs = Programme.objects.select_related('department')
    dept_id = scoped_dept_id(user)
    if dept_id:
        qs = qs.filter(department_id=dept_id)
    return qs


def scope_results(user, qs=None):
    """Return a CourseResult queryset scoped to user's department."""
    from results.models import CourseResult
    if qs is None:
        qs = CourseResult.objects.select_related(
            'student__department', 'student__user', 'course', 'academic_year'
        )
    dept_id = scoped_dept_id(user)
    if dept_id:
        qs = qs.filter(student__department_id=dept_id)
    return qs


def scope_grievances(user, qs=None):
    """Return a Grievance queryset scoped to user's department."""
    from grievances.models import Grievance
    if qs is None:
        qs = Grievance.objects.all()
    if user.is_student:
        return qs.filter(student__user=user)
    dept_id = scoped_dept_id(user)
    if dept_id:
        qs = qs.filter(student__department_id=dept_id)
    return qs


def assert_dept_owns_course(user, course):
    """Raise PermissionError if a dept-scoped user tries to access another dept's course."""
    dept_id = scoped_dept_id(user)
    if dept_id and course.department_id != dept_id:
        raise PermissionError("Course does not belong to your department.")


def assert_dept_owns_student(user, student):
    """Raise PermissionError if a dept-scoped user tries to access another dept's student."""
    dept_id = scoped_dept_id(user)
    if dept_id and student.department_id != dept_id:
        raise PermissionError("Student does not belong to your department.")
