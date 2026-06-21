from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from accounts.models.student import Student
from academics.models import Department, Programme
from authentication.models import User
from rest_framework import status
from registry.models import Semester, AcademicSession, Registration


class AdminDashboardSummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        
        total_students = Student.objects.count()
        total_staff = User.objects.exclude(role=User.Role.STUDENT).count()
        total_departments = Department.objects.count()
        total_programmes = Programme.objects.count()
        current_semester = Semester.objects.filter(is_current=True).first()
        current_session = AcademicSession.objects.filter(is_current=True).first()

        if current_semester and current_session:
            registrations = Registration.objects.filter(
                session=current_session, 
                semester=current_semester.number
            )
    
        else:
            registrations = Registration.objects.none()

        total_registrations = registrations.count()
        draft_registrations = registrations.filter(status=Registration.Status.DRAFT).count()
        pending_registrations = registrations.filter(status=Registration.Status.PENDING).count()
        approved_registrations = registrations.filter(status=Registration.Status.APPROVED).count()
        rejected_registrations = registrations.filter(status=Registration.Status.REJECTED).count()

        data = {
            "totals": {
                "students": total_students,
                "staff": total_staff,
                "departments": total_departments,
                "programmes": total_programmes,
            },
            "current": {
                "semester": current_semester.get_number_display() if current_semester else None,
                "session": (
                    current_session.year if current_session else None
                ),
            },
            "status": {
                "registration_open": (
                    current_semester.is_registration_open if current_semester else False
                ),
            },
            "registration": {
                "total": total_registrations,
                "draft": draft_registrations,
                "pending": pending_registrations,
                "approved": approved_registrations,
                "rejected": rejected_registrations,
            },
        }
        return Response(data, status=status.HTTP_200_OK)