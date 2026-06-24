from django.db import models
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from accounts.permissions import IsAnyStaff, IsHOD, scoped_dept_id, scope_students
from .models import CourseRegistration, RegisteredCourse
from .serializers import (CourseRegistrationSerializer,
                           CourseRegistrationListSerializer,
                           RegisteredCourseSerializer)
from results.models import Course, AcademicYear, CourseOffering

MAX_ELECTIVE_CREDITS = 12   # max extra elective credits on top of core
MAX_TOTAL_CREDITS    = 27
MIN_CREDITS          = 3


def _get_student(user):
    from students.models import Student
    return Student.objects.select_related('programme', 'department').get(user=user)


def _auto_populate_core(registration):
    """
    Auto-add all core courses for this student's programme + year + semester.
    Called when a new registration is created.
    """
    student = registration.student
    core_qs = Course.objects.filter(
        department=student.department,
        year=registration.year_of_study,
        semester=registration.semester,
        is_active=True,
        is_core=True,
    )
    # Also include programme-specific cores
    prog_core_qs = Course.objects.filter(
        programme=student.programme,
        year=registration.year_of_study,
        semester=registration.semester,
        is_active=True,
        is_core=True,
    )
    all_cores = (core_qs | prog_core_qs).distinct()
    for course in all_cores:
        RegisteredCourse.objects.get_or_create(
            registration=registration, course=course,
            defaults={'is_core': True}
        )


# ── Student endpoints ─────────────────────────────────────────────────────────

class MyRegistrationListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return CourseRegistrationListSerializer if self.request.method == 'GET' \
               else CourseRegistrationSerializer

    def get_queryset(self):
        student = _get_student(self.request.user)
        return CourseRegistration.objects.filter(
            student=student
        ).prefetch_related('registered_courses__course').select_related('academic_year')

    def perform_create(self, serializer):
        student = _get_student(self.request.user)
        ay_id    = self.request.data.get('academic_year')
        semester = self.request.data.get('semester')
        if CourseRegistration.objects.filter(
                student=student, academic_year_id=ay_id, semester=semester).exists():
            raise ValueError('Registration already exists for this semester.')
        reg = serializer.save(student=student)
        _auto_populate_core(reg)


class MyRegistrationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = CourseRegistrationSerializer

    def get_queryset(self):
        student = _get_student(self.request.user)
        return CourseRegistration.objects.filter(student=student).prefetch_related(
            'registered_courses__course')

    def update(self, request, *args, **kwargs):
        reg = self.get_object()
        if reg.status != CourseRegistration.STATUS_DRAFT:
            return Response({'error': 'Only draft registrations can be edited.'}, status=400)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        reg = self.get_object()
        if reg.status != CourseRegistration.STATUS_DRAFT:
            return Response({'error': 'Only draft registrations can be deleted.'}, status=400)
        return super().destroy(request, *args, **kwargs)


class AvailableCoursesView(APIView):
    """
    Return available elective courses for a registration.Electives only allowed for Y3S2 and Y4 (any semester)
    Also returns the core courses already auto-populated.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, reg_id):
        student = _get_student(request.user)
        try:
            reg = CourseRegistration.objects.get(pk=reg_id, student=student)
        except CourseRegistration.DoesNotExist:
            return Response({'error': 'Registration not found.'}, status=404)

        # Determine if this student is eligible for electives
        # Only Year 3 Semester 2 and all of Year 4
        electives_allowed = (
            (reg.year_of_study == 3 and reg.semester == 2) or
            (reg.year_of_study == 4)
        )

        registered_ids = set(reg.registered_courses.values_list('course_id', flat=True))

        # Core courses for this dept/year/semester
        core_qs = Course.objects.filter(
            department=student.department,
            year=reg.year_of_study, semester=reg.semester,
            is_active=True, is_core=True,
        ) | Course.objects.filter(
            programme=student.programme,
            year=reg.year_of_study, semester=reg.semester,
            is_active=True, is_core=True,
        )
        core_qs = core_qs.distinct()

        # Elective courses — sourced from HOD-configured ElectivePool when available
        # Falls back to any non-core dept courses if no pool is configured
        from results.models import ElectivePool, ElectivePoolCourse
        pool = ElectivePool.objects.filter(
            department=student.department,
            academic_year_id=reg.academic_year_id,
            semester=reg.semester,
            year_of_study=reg.year_of_study,
            is_active=True,
        ).filter(
            # match programme-specific pool OR dept-wide pool
            models.Q(programme=student.programme) | models.Q(programme__isnull=True)
        ).order_by('programme').first()  # prefer programme-specific

        if not electives_allowed:
            # Years 1, 2, and Year 3 Semester 1 — no electives shown at all
            elective_qs          = Course.objects.none()
            max_elective_credits = 0
            max_electives        = 0
        elif pool:
            pool_course_ids = list(
                pool.pool_courses.values_list('course_id', flat=True)
            )
            elective_qs = Course.objects.filter(
                id__in=pool_course_ids, is_active=True
            ).exclude(id__in=registered_ids)
            max_elective_credits = pool.max_elective_credits
            max_electives        = pool.max_electives
        else:
            # Fallback: all non-core dept courses at this level/semester
            elective_qs = Course.objects.filter(
                department=student.department,
                year=reg.year_of_study, semester=reg.semester,
                is_active=True, is_core=False,
            ).exclude(id__in=registered_ids)
            max_elective_credits = MAX_ELECTIVE_CREDITS
            max_electives        = 2

        # Fetch offering info (lecturer) per course
        ay_id = reg.academic_year_id
        sem   = reg.semester
        offerings = {
            o.course_id: {
                'lecturer_name':  o.lecturer.full_name if o.lecturer else 'TBA',
                'lecturer_email': o.lecturer.email if o.lecturer else '',
                'enrolled_count': o.enrolled_count,
                'max_students':   o.max_students,
            }
            for o in CourseOffering.objects.filter(
                academic_year_id=ay_id, semester=sem
            ).select_related('lecturer')
        }

        def enrich(c):
            info = offerings.get(c.id, {})
            return {
                'id': c.id, 'code': c.code, 'title': c.title,
                'credit_hours': c.credit_hours, 'is_core': c.is_core,
                'already_registered': c.id in registered_ids,
                'lecturer_name':  info.get('lecturer_name', 'TBA'),
                'lecturer_email': info.get('lecturer_email', ''),
                'enrolled_count': info.get('enrolled_count', 0),
                'max_students':   info.get('max_students', 200),
            }
       
        return Response({
            'core_courses':     [enrich(c) for c in core_qs],
            'elective_courses': [enrich(c) for c in elective_qs],
            'current_total_credits':    reg.total_credits,
            'current_elective_credits': reg.elective_credits,
            'max_elective_credits':     max_elective_credits,
            'max_electives':            max_electives,
            'max_total_credits':        MAX_TOTAL_CREDITS,
            'pool_configured':          pool is not None,
            'pool_name':                pool.name if pool else None,
            'electives_allowed':        electives_allowed,
            'electives_allowed_from':    'Year 3 Semester 2 and Year 4',
        })


class AddElectiveView(APIView):
    """Student adds an ELECTIVE course to draft registration."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, reg_id):
        student = _get_student(request.user)
        try:
            reg = CourseRegistration.objects.get(pk=reg_id, student=student)
        except CourseRegistration.DoesNotExist:
            return Response({'error': 'Registration not found.'}, status=404)

        if reg.status != CourseRegistration.STATUS_DRAFT:
            return Response({'error': 'Registration is not a draft.'}, status=400)

        # Block electives for Y1, Y2, and Y3 Semester 1
        electives_allowed = (
            (reg.year_of_study == 3 and reg.semester == 2) or
            (reg.year_of_study == 4)
        )
        if not electives_allowed:
            return Response({
                'error': f'Elective selection is not available for Year {reg.year_of_study} '
                         f'Semester {reg.semester}. Electives are only offered from '
                         f'Year 3 Semester 2 onwards.'
            }, status=400)
        
        course_id = request.data.get('course_id')
        try:
            course = Course.objects.get(pk=course_id, is_active=True)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=404)

        # Must be elective
        if course.is_core:
            return Response({'error': f'{course.code} is a core course and is already auto-registered.'}, status=400)

        # Dept check
        if course.department_id != student.department_id:
            return Response({'error': f'{course.code} is not offered in your department.'}, status=400)

        # Level/year match
        if course.year != reg.year_of_study:
            return Response({'error': f'{course.code} is for Year {course.year}, not Year {reg.year_of_study}.'}, status=400)

        # Duplicate
        if RegisteredCourse.objects.filter(registration=reg, course=course).exists():
            return Response({'error': f'{course.code} is already in your registration.'}, status=400)

        # Elective credit cap — use pool limit if configured, else default
        from results.models import ElectivePool
        pool = ElectivePool.objects.filter(
            department=student.department,
            academic_year_id=reg.academic_year_id,
            semester=reg.semester, year_of_study=reg.year_of_study, is_active=True,
        ).filter(
            models.Q(programme=student.programme) | models.Q(programme__isnull=True)
        ).order_by('programme').first()
        elective_cap = pool.max_elective_credits if pool else MAX_ELECTIVE_CREDITS

        # Count of electives already registered
        current_elective_count = reg.registered_courses.filter(is_core=False).count()
        max_electives_count    = pool.max_electives if pool else 2
        if current_elective_count >= max_electives_count:
            return Response({
                'error': f'You have already selected the maximum of {max_electives_count} elective(s).'
            }, status=400)

        if reg.elective_credits + course.credit_hours > elective_cap:
            return Response({
                'error': f'Adding {course.code} ({course.credit_hours} cr) would exceed the '
                         f'elective limit ({elective_cap} cr). '
                         f'You have used {reg.elective_credits} elective credits.'
            }, status=400)

        # Total credit cap
        if reg.total_credits + course.credit_hours > MAX_TOTAL_CREDITS:
            return Response({'error': f'Would exceed maximum total credits ({MAX_TOTAL_CREDITS}).'}, status=400)

        rc = RegisteredCourse.objects.create(registration=reg, course=course, is_core=False)
        return Response(RegisteredCourseSerializer(rc).data, status=201)


class RemoveElectiveView(APIView):
    """Student removes an ELECTIVE course from draft registration."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, reg_id, course_id):
        student = _get_student(request.user)
        try:
            reg = CourseRegistration.objects.get(pk=reg_id, student=student)
        except CourseRegistration.DoesNotExist:
            return Response({'error': 'Registration not found.'}, status=404)

        if reg.status != CourseRegistration.STATUS_DRAFT:
            return Response({'error': 'Registration is not a draft.'}, status=400)

        try:
            rc = RegisteredCourse.objects.get(registration=reg, course_id=course_id)
        except RegisteredCourse.DoesNotExist:
            return Response({'error': 'Course not in registration.'}, status=404)

        if rc.is_core:
            return Response({'error': 'Core courses cannot be removed from your registration.'}, status=400)

        rc.delete()
        return Response({'message': 'Elective removed.'})


class SubmitRegistrationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, reg_id):
        student = _get_student(request.user)
        try:
            reg = CourseRegistration.objects.get(pk=reg_id, student=student)
        except CourseRegistration.DoesNotExist:
            return Response({'error': 'Registration not found.'}, status=404)

        if reg.status != CourseRegistration.STATUS_DRAFT:
            return Response({'error': 'Already submitted.'}, status=400)

        if reg.total_credits < MIN_CREDITS:
            return Response({'error': f'Minimum {MIN_CREDITS} credits required. You have {reg.total_credits}.'}, status=400)

        reg.status       = CourseRegistration.STATUS_SUBMITTED
        reg.submitted_at = timezone.now()
        reg.save()
        return Response(CourseRegistrationSerializer(reg).data)


# ── Staff endpoints ───────────────────────────────────────────────────────────

class StaffRegistrationListView(generics.ListAPIView):
    serializer_class   = CourseRegistrationListSerializer
    permission_classes = [IsAnyStaff]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['status', 'semester', 'academic_year', 'year_of_study']

    def get_queryset(self):
        dept_id = scoped_dept_id(self.request.user)
        qs = CourseRegistration.objects.select_related(
            'student__user', 'student__department', 'academic_year'
        ).prefetch_related('registered_courses__course')
        if dept_id:
            qs = qs.filter(student__department_id=dept_id)
        return qs


class ApproveRegistrationView(APIView):
    permission_classes = [IsHOD]

    def patch(self, request, pk):
        dept_id = scoped_dept_id(request.user)
        try:
            reg = CourseRegistration.objects.prefetch_related(
                'registered_courses__course').get(pk=pk)
        except CourseRegistration.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        if dept_id and reg.student.department_id != dept_id:
            return Response({'error': 'Outside your department.'}, status=403)

        action = request.data.get('action')
        notes  = request.data.get('notes', '')

        if action == 'approve':
            if reg.status != CourseRegistration.STATUS_SUBMITTED:
                return Response({'error': 'Only submitted registrations can be approved.'}, status=400)
            reg.status      = CourseRegistration.STATUS_APPROVED
            reg.approved_by = request.user
            reg.approved_at = timezone.now()
            reg.notes       = notes
        elif action == 'reject':
            reg.status = CourseRegistration.STATUS_REJECTED
            reg.notes  = notes
        else:
            return Response({'error': 'action must be "approve" or "reject".'}, status=400)

        reg.save()
        return Response(CourseRegistrationSerializer(reg).data)


class RegistrationSummaryView(APIView):
    permission_classes = [IsAnyStaff]

    def get(self, request):
        dept_id = scoped_dept_id(request.user)
        qs = CourseRegistration.objects.all()
        if dept_id:
            qs = qs.filter(student__department_id=dept_id)
        return Response({
            'total':     qs.count(),
            'draft':     qs.filter(status='draft').count(),
            'submitted': qs.filter(status='submitted').count(),
            'approved':  qs.filter(status='approved').count(),
            'rejected':  qs.filter(status='rejected').count(),
        })




class StaffRegistrationDetailView(generics.RetrieveAPIView):
    """Staff: view full detail of any registration including registered_courses."""
    serializer_class   = CourseRegistrationSerializer
    permission_classes = [IsHOD]

    def get_queryset(self):
        dept_id = scoped_dept_id(self.request.user)
        qs = CourseRegistration.objects.prefetch_related(
            'registered_courses__course'
        ).select_related('student__user', 'student__department', 'academic_year', 'approved_by')
        if dept_id:
            qs = qs.filter(student__department_id=dept_id)
        return qs

class CourseOfferingListView(generics.ListCreateAPIView):
    """List/create course offerings (with lecturer assignments)."""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['course', 'academic_year', 'semester', 'lecturer']

    def get_queryset(self):
        from results.models import CourseOffering
        qs = CourseOffering.objects.select_related(
            'course', 'academic_year', 'lecturer')
        dept_id = scoped_dept_id(self.request.user)
        if dept_id:
            qs = qs.filter(course__department_id=dept_id)
        return qs

    def get_serializer_class(self):
        from .serializers import CourseOfferingSerializer
        return CourseOfferingSerializer
