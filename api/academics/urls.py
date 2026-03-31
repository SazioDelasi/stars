from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from academics.views import (
    CourseAssignmentViewSet,
    CourseViewSet,
    DepartmentViewSet,
    ProgrammeViewSet,
    SchoolViewSet,
)

router = DefaultRouter()
router.register(r"schools", SchoolViewSet, basename="school")
router.register(r"departments", DepartmentViewSet, basename="department")
router.register(r"programmes", ProgrammeViewSet, basename="programme")
router.register(r"courses", CourseViewSet, basename="course")
router.register(r"assignments", CourseAssignmentViewSet, basename="assignment")

urlpatterns = [
    path("", include(router.urls)),
]
