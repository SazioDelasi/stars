from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from academics.models import ProgrammeCourse
from academics.serializers.course import AvailableCourseSerializer
from authentication.models import User
from authentication.utils.permissions import HasRole, HasRoleOrReadOnly
from registry.models import AcademicSession, Registration, Semester
from academics.serializers.program_course import BulkProgrammeCourseSerializer
from registry.serializers.registration import RegistrationSerializer
from registry.serializers.semester import (
    AcademicSessionSerializer,
    SemesterSerializer,
    SemesterSerializer,
)


# Create your views here.
class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.select_related("student__user", "programme").all()
    serializer_class = RegistrationSerializer
    permission_classes = [HasRoleOrReadOnly]
    allowed_roles = ["REGISTRY", "ADMIN"]
    filterset_fields = ["session", "programme", "semester", "is_confirmed"]

    def get_queryset(self):
        user = self.request.user

        if user.role == User.Role.DEAN:
            return Registration.objects.filter(
                student__programme__department__school__dean__user=user
            )

        if user.role == User.Role.HOD:
            return Registration.objects.filter(
                student__programme__department__hod__user=user
            )

        if user.role == User.Role.STUDENT:
            return Registration.objects.filter(student__user=user)

        return Registration.objects.none()

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.is_confirmed:
            raise serializers.ValidationError(
                "This registration has been confirmed by the Registry and cannot be modified."
            )

        # Ensure registration is still open
        if not instance.semester.is_registration_open:
            raise serializers.ValidationError(
                "The registration deadline has passed. Modifications are no longer allowed."
            )

        # Save the changes
        serializer.save()

    @action(detail=True, methods=["post"], url_path="request-void")
    def request_void(self, request, pk=None):
        """
        If a student already confirmed but made a massive error,
        they can 'request' a void, which flags it for the Registry.
        """
        registration = self.get_object()
        registration.status_note = "Student requested void/reset."
        registration.save()
        return Response({"detail": "Void request sent to Registry."})

    def perform_create(self, serializer):
        if self.request.user.role == "STUDENT":
            serializer.save(student=self.request.user.student)
        else:
            serializer.save()


class AcademicSessionViewSet(viewsets.ModelViewSet):
    queryset = AcademicSession.objects.all().order_by("-year")
    serializer_class = AcademicSessionSerializer
    permission_classes = [HasRoleOrReadOnly]
    allowed_roles = ["REGISTRY", "ADMIN"]


class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.all().select_related("session")
    serializer_class = SemesterSerializer
    permission_classes = [HasRoleOrReadOnly]
    allowed_roles = ["REGISTRY", "ADMIN"]

    @action(detail=True, methods=["post"], url_path="close-registration")
    def close_registration(self, request, pk=None):
        """
        Immediately sets the registration deadline to the current time.
        """
        semester = self.get_object()
        semester.registration_deadline = timezone.now()
        semester.save()

        return Response(
            {
                "message": f"Registration for {semester} has been closed immediately.",
                "new_deadline": semester.registration_deadline,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="extend-deadline")
    def extend_deadline(self, request, pk=None):
        """
        Expects {'days': 7} in the request body to extend the deadline.
        """
        days = request.data.get("days", 0)
        if not isinstance(days, int) or days <= 0:
            return Response(
                {"error": "Please provide a valid number of days."}, status=400
            )

        semester = self.get_object()
        semester.registration_deadline += timezone.timedelta(days=days)
        semester.save()

        return Response(
            {
                "message": f"Deadline extended by {days} days.",
                "new_deadline": semester.registration_deadline,
            }
        )
