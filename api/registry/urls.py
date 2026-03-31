from django.urls import include, path
from rest_framework.routers import DefaultRouter

from registry.views import AcademicSessionViewSet, RegistrationViewSet, SemesterViewSet

router = DefaultRouter()
router.register(r"sessions", AcademicSessionViewSet, basename="session")
router.register(r"semesters", SemesterViewSet, basename="semester")
router.register(r"registrations", RegistrationViewSet, basename="registration")

# 2. Define the URL patterns
urlpatterns = [
    path("", include(router.urls)),
]
