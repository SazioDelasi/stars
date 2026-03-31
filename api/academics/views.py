from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from academics.models import (
    Course,
    CourseAssignment,
    Department,
    Programme,
    ProgrammeCourse,
    School,
)
from academics.serializers.course import AvailableCourseSerializer, CourseSerializer
from academics.serializers.course_assignment import CourseAssignmentSerializer
from academics.serializers.department import DepartmentSerializer
from academics.serializers.program_course import BulkProgrammeCourseSerializer
from academics.serializers.programme import ProgrammeSerializer
from academics.serializers.school import SchoolSerializer
from authentication.models import User
from authentication.utils.permissions import HasRoleOrReadOnly, IsAuthorizedOrReadOnly
from registry.models import Registration, Semester


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.annotate(number_of_departments=Count("department")).all()
    serializer_class = SchoolSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]
    permission_classes = [IsAuthorizedOrReadOnly]


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.select_related("school", "hod__user").all()
    serializer_class = DepartmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["school"]
    search_fields = ["name", "prefix"]
    permission_classes = [IsAuthorizedOrReadOnly]


class ProgrammeViewSet(viewsets.ModelViewSet):
    queryset = Programme.objects.select_related("department").all()
    serializer_class = ProgrammeSerializer
    filterset_fields = ["department", "degree_level"]
    permission_classes = [IsAuthorizedOrReadOnly]


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related("department").all()
    serializer_class = CourseSerializer
    filterset_fields = ["department", "is_elective"]
    search_fields = ["name", "code"]
    permission_classes = [IsAuthorizedOrReadOnly]

    @action(detail=False, methods=["get"], url_path="available-for-registration")
    def get_available_courses(self, request):
        user = request.user

        if not hasattr(user, "student") or user.student is None:
            return Response(
                {"detail": "User profile is not associated with a student record."},
                status=status.HTTP_403_FORBIDDEN,
            )

        student = user.student
        active_semester = Semester.get_active()

        if not active_semester:
            return Response(
                {
                    "detail": "There is no active academic semester. Registration is closed."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        existing_registration = Registration.objects.filter(
            student=student,
            session=active_semester.session,
            semester=active_semester.number,
        ).first()

        if existing_registration:
            if existing_registration.is_confirmed:
                return Response(
                    {
                        "detail": "Your registration for this semester has already been confirmed and closed."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {
                    "detail": "You have a pending registration. Would you like to edit or view it?",
                    "registration_id": existing_registration.id,
                    "status": "pending",
                },
                status=status.HTTP_200_OK,
            )

        relevant_courses = ProgrammeCourse.objects.filter(
            programme=student.programme,
            level=student.level,
            session=active_semester.session,
            semester=active_semester.number,
        ).select_related("course")

        if not relevant_courses.exists():
            return Response(
                {
                    "detail": f"No courses mapped for {student.programme} at Level {student.level}."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AvailableCourseSerializer(relevant_courses, many=True)
        return Response(
            {
                "context": {
                    "session": active_semester.session.year,
                    "semester": active_semester.get_number_display(),
                },
                "courses": serializer.data,
            }
        )


class CourseAssignmentViewSet(viewsets.ModelViewSet):
    queryset = CourseAssignment.objects.select_related("course", "lecturer__user").all()
    serializer_class = CourseAssignmentSerializer
    filterset_fields = ["academic_year", "semester", "lecturer"]
    permission_classes = [IsAuthorizedOrReadOnly]


class ProgrammeCourseViewSet(viewsets.ModelViewSet):
    queryset = ProgrammeCourse.objects.all()
    serializer_class = AvailableCourseSerializer
    permission_classes = [HasRoleOrReadOnly]
    allowed_roles = ["REGISTRY", "ADMIN"]

    @action(detail=False, methods=["post"], url_path="bulk-assign")
    def bulk_assign(self, request):
        serializer = BulkProgrammeCourseSerializer(data=request.data)
        if serializer.is_valid():
            instances = serializer.save()
            return Response(
                {"message": f"Successfully mapped {len(instances)} courses."},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
