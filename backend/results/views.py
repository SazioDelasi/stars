from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
import io

from accounts.permissions import (
    IsAnyStaff, IsDeptCoordinatorOrAbove, IsHOD,
    scoped_dept_id, scope_students, scope_results, scope_courses,
)
from .models import AcademicYear, Course, CourseResult, SemesterResult, GRADE_POINTS, Lecturer, CourseOffering, ElectivePool, ElectivePoolCourse
from .serializers import (
    AcademicYearSerializer, CourseSerializer,
    CourseResultSerializer, SemesterResultSerializer,
)
from students.models import Student, Department


class AcademicYearListView(generics.ListCreateAPIView):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated]


class CourseListView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsHOD()]
        return [permissions.IsAuthenticated()]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['department', 'year', 'semester']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsHOD()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        # dept-scoped users only see their dept's courses
        return scope_courses(self.request.user).filter(is_active=True)

    def perform_create(self, serializer):
        # Auto-assign the HOD's department so the frontend doesn't need to send it
        from accounts.permissions import scoped_dept_id
        dept_id = scoped_dept_id(self.request.user)
        if not dept_id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You are not assigned to a department.')
        serializer.save(department_id=dept_id)

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsHOD]

    def get_queryset(self):
        return scope_courses(self.request.user)


class CourseResultListView(generics.ListCreateAPIView):
    serializer_class = CourseResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['student', 'course', 'academic_year', 'semester', 'is_published']

    def get_queryset(self):
        user = self.request.user
        if user.is_student:
            return CourseResult.objects.filter(
                student__user=user, is_published=True
            ).select_related('course', 'academic_year', 'student')
        return scope_results(user)

    def perform_create(self, serializer):
        user = self.request.user
        # Validate dept ownership before saving
        course = serializer.validated_data.get('course')
        student = serializer.validated_data.get('student')
        dept_id = scoped_dept_id(user)
        if dept_id:
            if course and course.department_id != dept_id:
                raise PermissionError("Course does not belong to your department.")
            if student and student.department_id != dept_id:
                raise PermissionError("Student does not belong to your department.")
        serializer.save(entered_by=user)


class CourseResultDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CourseResultSerializer
    permission_classes = [IsAnyStaff]

    def get_queryset(self):
        return scope_results(self.request.user)


class PublishResultsView(APIView):
    permission_classes = [IsAnyStaff]

    def post(self, request):
        user = request.user
        dept_id = scoped_dept_id(user) or request.data.get('department_id')
        academic_year_id = request.data.get('academic_year_id')
        semester       = request.data.get('semester')
        year_of_study  = request.data.get('year_of_study')

        from django.db.models import Q
        qs = CourseResult.objects.filter(
            student__department_id=dept_id,
            academic_year_id=academic_year_id,
            semester=semester,
        ).filter(
            Q(year_of_study=year_of_study) | Q(year_of_study__isnull=True)
        )
        count = qs.update(is_published=True)

        students = scope_students(user).filter(department_id=dept_id)
        for student in students:
            sr, _ = SemesterResult.objects.get_or_create(
                student=student,
                academic_year_id=academic_year_id,
                semester=semester,
                year_of_study=year_of_study,
            )
            sr.is_published = True
            sr.recompute()

        return Response({'published': count, 'message': f'{count} results published.'})


class StudentTranscriptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id=None, index_number=None):
        user = request.user
        if student_id:
            if user.is_student and str(user.student_profile.id) != str(student_id):
                return Response({'error': 'Forbidden'}, status=403)
            qs = scope_students(user) if not user.is_student else Student.objects.filter(user=user)
            try:
                student = qs.get(pk=student_id)
            except Student.DoesNotExist:
                return Response({'error': 'Student not found or outside your department.'}, status=404)
        elif index_number:
            if user.is_student:
                return Response({'error': 'Forbidden'}, status=403)
            try:
                student = scope_students(user).get(index_number=index_number)
            except Student.DoesNotExist:
                return Response({'error': 'Student not found or outside your department.'}, status=404)
        else:
            return Response({'error': 'Provide student_id or index_number'}, status=400)

        results = CourseResult.objects.filter(
            student=student, is_published=True
        ).select_related('course', 'academic_year').order_by('year_of_study', 'semester')

        semesters_data = {}
        for cr in results:
            key = (cr.year_of_study, cr.semester, cr.academic_year.label)
            if key not in semesters_data:
                semesters_data[key] = {
                    'year_of_study': cr.year_of_study,
                    'semester': cr.semester,
                    'academic_year': cr.academic_year.label,
                    'courses': [],
                }
            semesters_data[key]['courses'].append({
                'code': cr.course.code, 'title': cr.course.title,
                'credit_hours': cr.course.credit_hours,
                'ca': cr.continuous_assessment, 'exam': cr.exam_score,
                'total': cr.total_score, 'grade': cr.grade,
                'grade_point': cr.grade_point, 'is_trail': cr.is_trail,
            })

        semester_list = []
        for key, sem_data in sorted(semesters_data.items()):
            credits = sum(c['credit_hours'] for c in sem_data['courses'])
            points  = sum(c['grade_point'] * c['credit_hours'] for c in sem_data['courses'])
            sem_data['total_credits'] = credits
            sem_data['semester_gpa']  = round(points / credits, 2) if credits else 0.0
            semester_list.append(sem_data)

        return Response({
            'student_info': {
                'id': student.id, 'index_number': student.index_number,
                'reference_number': student.reference_number,
                'full_name': student.user.get_full_name(),
                'email': student.user.email,
                'department': student.department.name,
                'programme': student.programme.name,
                'year_of_admission': student.year_of_admission,
                'current_year': student.current_year,
                'status': student.status, 'phone': student.phone,
            },
            'semesters': semester_list,
            'cumulative_gpa': student.cumulative_gpa,
            'academic_standing': student.academic_standing,
            'trail_count': student.trail_count,
            'in_academic_danger': student.in_academic_danger,
            'total_credits_earned': sum(s['total_credits'] for s in semester_list),
        })


class GeneratePDFTranscriptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, index_number):
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.platypus import (SimpleDocTemplate, Table, TableStyle,
                                         Paragraph, Spacer, HRFlowable)
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER

        user = request.user
        try:
            student = scope_students(user).get(index_number=index_number) \
                      if not user.is_student \
                      else Student.objects.get(index_number=index_number, user=user)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found or outside your department.'}, status=404)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                                 topMargin=1.5*cm, bottomMargin=2*cm,
                                 leftMargin=2*cm, rightMargin=2*cm)
        styles = getSampleStyleSheet()
        NAVY = colors.HexColor('#0f2744')
        BLUE = colors.HexColor('#2563eb')
        GRAY = colors.HexColor('#f1f5f9')

        title_s  = ParagraphStyle('T', fontSize=15, alignment=TA_CENTER,
                                   textColor=NAVY, fontName='Helvetica-Bold', spaceAfter=3)
        sub_s    = ParagraphStyle('S', fontSize=10, alignment=TA_CENTER,
                                   textColor=BLUE, spaceAfter=2)
        sect_s   = ParagraphStyle('Se', fontSize=11, spaceBefore=10, spaceAfter=4,
                                   textColor=NAVY, fontName='Helvetica-Bold')
        normal   = styles['Normal']
        normal.fontSize = 9

        story = []
        story.append(Paragraph('UNIVERSITY OF ENERGY AND NATURAL RESOURCES', title_s))
        story.append(Paragraph('UENR STARS — Official Academic Transcript', sub_s))
        story.append(HRFlowable(width='100%', thickness=2, color=NAVY))
        story.append(Spacer(1, 0.3*cm))

        info = [
            ['Student Name:', student.user.get_full_name(), 'Index Number:', student.index_number],
            ['Programme:', student.programme.name, 'Department:', student.department.name],
            ['Admission Year:', str(student.year_of_admission), 'Status:', student.status.title()],
            ['CuGPA:', str(student.cumulative_gpa), 'Standing:', student.academic_standing],
        ]
        it = Table(info, colWidths=[3.5*cm, 6.5*cm, 3.5*cm, 7*cm])
        it.setStyle(TableStyle([
            ('FONTNAME', (0,0),(0,-1),'Helvetica-Bold'),
            ('FONTNAME', (2,0),(2,-1),'Helvetica-Bold'),
            ('FONTSIZE', (0,0),(-1,-1), 9),
            ('ROWBACKGROUNDS', (0,0),(-1,-1),[GRAY, colors.white]),
            ('GRID', (0,0),(-1,-1), 0.4, colors.HexColor('#aaccee')),
            ('PADDING', (0,0),(-1,-1), 5),
        ]))
        story.append(it)
        story.append(Spacer(1, 0.5*cm))

        results = CourseResult.objects.filter(
            student=student, is_published=True
        ).select_related('course','academic_year').order_by('year_of_study','semester')

        sems = {}
        for cr in results:
            k = (cr.year_of_study, cr.semester)
            sems.setdefault(k, {'label': f'Year {cr.year_of_study}, Semester {cr.semester} ({cr.academic_year.label})', 'rows': []})
            sems[k]['rows'].append(cr)

        for (yr, sm), sem in sorted(sems.items()):
            story.append(Paragraph(sem['label'], sect_s))
            hdr = [['Code','Title','Cr','CA','Exam','Total','Grade','GP']]
            data = hdr + [[
                cr.course.code,
                Paragraph(cr.course.title, ParagraphStyle('c', fontSize=8)),
                str(cr.course.credit_hours),
                str(cr.continuous_assessment or '—'),
                str(cr.exam_score or '—'),
                str(cr.total_score or '—'),
                cr.grade, str(cr.grade_point),
            ] for cr in sem['rows']]
            creds = sum(cr.course.credit_hours for cr in sem['rows'])
            pts   = sum(cr.grade_point * cr.course.credit_hours for cr in sem['rows'])
            sgpa  = round(pts/creds,2) if creds else 0
            data.append(['','',f'Credits:{creds}','','','',f'GPA:{sgpa}',''])
            t = Table(data, colWidths=[2.5*cm,6.5*cm,1.2*cm,1.4*cm,1.6*cm,1.5*cm,1.3*cm,1*cm])
            t.setStyle(TableStyle([
                ('BACKGROUND',(0,0),(-1,0),NAVY),
                ('TEXTCOLOR',(0,0),(-1,0),colors.white),
                ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),
                ('FONTSIZE',(0,0),(-1,-1),8),
                ('ROWBACKGROUNDS',(0,1),(-1,-2),[colors.white,GRAY]),
                ('BACKGROUND',(0,-1),(-1,-1),colors.HexColor('#d0e8f8')),
                ('FONTNAME',(0,-1),(-1,-1),'Helvetica-Bold'),
                ('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#aaccee')),
                ('PADDING',(0,0),(-1,-1),4),
                ('ALIGN',(2,0),(-1,-1),'CENTER'),
            ]))
            story.append(t)
            story.append(Spacer(1, 0.3*cm))

        story.append(HRFlowable(width='100%', thickness=1, color=NAVY))
        story.append(Paragraph(
            f'Total Credits: {sum(cr.course.credit_hours for cr in results)} | '
            f'Trails: {student.trail_count} | Standing: {student.academic_standing}',
            ParagraphStyle('ft', fontSize=9, alignment=TA_CENTER)
        ))

        doc.build(story)
        buffer.seek(0)
        resp = HttpResponse(buffer, content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="transcript_{index_number}.pdf"'
        return resp


# ── Lecturer views ────────────────────────────────────────────────────────────

class LecturerListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        from .serializers import LecturerSerializer
        return LecturerSerializer

    def get_queryset(self):
        from .models import Lecturer
        qs = Lecturer.objects.select_related('department').filter(is_active=True)
        dept_id = scoped_dept_id(self.request.user)
        if dept_id:
            qs = qs.filter(department_id=dept_id)
        return qs


class CourseOfferingListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['course', 'academic_year', 'semester']

    def get_serializer_class(self):
        from .serializers import CourseOfferingPublicSerializer
        return CourseOfferingPublicSerializer

    def get_queryset(self):
        qs = CourseOffering.objects.select_related(
            'course', 'academic_year', 'lecturer'
        )
        dept_id = scoped_dept_id(self.request.user)
        if dept_id:
            qs = qs.filter(course__department_id=dept_id)
        return qs


# ── ElectivePool views ────────────────────────────────────────────────────────

class ElectivePoolListView(generics.ListCreateAPIView):
    """HOD/Coordinator: manage elective pools for their department."""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['year_of_study', 'semester', 'academic_year', 'is_active']

    def get_permissions(self):
        if self.request.method in ('POST',):
            return [IsHOD()]
        return [IsAnyStaff()]
    
    def get_serializer_class(self):
        from .serializers import ElectivePoolSerializer
        return ElectivePoolSerializer

    def get_queryset(self):
        from .models import ElectivePool
        qs = ElectivePool.objects.select_related(
            'department', 'programme', 'academic_year', 'created_by'
        ).prefetch_related('pool_courses__course')
        dept_id = scoped_dept_id(self.request.user)
        if dept_id:
            qs = qs.filter(department_id=dept_id)
        return qs

    def perform_create(self, serializer):
        user    = self.request.user
        dept_id = scoped_dept_id(user) or self.request.data.get('department')
        serializer.save(created_by=user, department_id=dept_id)


class ElectivePoolDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsHOD]

    def get_serializer_class(self):
        from .serializers import ElectivePoolSerializer
        return ElectivePoolSerializer

    def get_queryset(self):
        from .models import ElectivePool
        qs = ElectivePool.objects.all()
        dept_id = scoped_dept_id(self.request.user)
        if dept_id:
            qs = qs.filter(department_id=dept_id)
        return qs


class ElectivePoolCourseView(APIView):
    """HOD: add or remove a course from an elective pool."""
    permission_classes = [IsHOD]

    def post(self, request, pool_id):
        from .models import ElectivePool, ElectivePoolCourse, Course
        try:
            pool = ElectivePool.objects.get(pk=pool_id)
        except ElectivePool.DoesNotExist:
            return Response({'error': 'Pool not found.'}, status=404)

        dept_id = scoped_dept_id(request.user)
        if dept_id and pool.department_id != dept_id:
            return Response({'error': 'Outside your department.'}, status=403)

        course_id = request.data.get('course_id')
        try:
            course = Course.objects.get(pk=course_id, is_active=True)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=404)

        if course.is_core:
            return Response({'error': 'Core courses cannot be added to elective pools.'}, status=400)

        obj, created = ElectivePoolCourse.objects.get_or_create(
            pool=pool, course=course,
            defaults={'added_by': request.user}
        )
        if not created:
            return Response({'error': f'{course.code} is already in this pool.'}, status=400)

        return Response({
            'id': obj.id,
            'course_code': course.code,
            'course_title': course.title,
            'credit_hours': course.credit_hours,
        }, status=201)

    def delete(self, request, pool_id, course_id):
        from .models import ElectivePool, ElectivePoolCourse
        try:
            pool = ElectivePool.objects.get(pk=pool_id)
        except ElectivePool.DoesNotExist:
            return Response({'error': 'Pool not found.'}, status=404)
        deleted, _ = ElectivePoolCourse.objects.filter(pool=pool, course_id=course_id).delete()
        if deleted == 0:
            return Response({'error': 'Course not in pool.'}, status=404)
        return Response({'message': 'Course removed from pool.'})
