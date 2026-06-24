from rest_framework import generics, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend as _DFB
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import (
    IsAnyStaff, scoped_dept_id,
    scope_students, scope_courses, scope_programmes,
)
from .models import Department, Programme, Student
from .serializers import (DepartmentSerializer, ProgrammeSerializer,
                           StudentListSerializer, StudentDetailSerializer)


class DepartmentListView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProgrammeListView(generics.ListCreateAPIView):
    serializer_class = ProgrammeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['department']

    def get_queryset(self):
        # dept-scoped staff only see their dept's programmes
        return scope_programmes(self.request.user)


class StudentListView(generics.ListCreateAPIView):
    serializer_class = StudentListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'status', 'current_year', 'programme']
    search_fields = ['index_number', 'reference_number',
                     'user__first_name', 'user__last_name']
    ordering_fields = ['index_number', 'current_year', 'status',
                       'user__last_name', 'programme__name']
    ordering = ['user__last_name']

    def get_queryset(self):
        user = self.request.user
        if user.is_student:
            return Student.objects.filter(user=user)
        return scope_students(user)


class StudentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_student:
            return Student.objects.filter(user=user)
        return scope_students(user)   # ← was: Student.objects.all()


class StudentMeView(generics.RetrieveAPIView):
    serializer_class = StudentDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return Student.objects.select_related(
            'user', 'department', 'programme'
        ).get(user=self.request.user)


class StudentByIndexView(generics.RetrieveAPIView):
    serializer_class = StudentDetailSerializer
    permission_classes = [IsAnyStaff]
    lookup_field = 'index_number'

    def get_queryset(self):
        return scope_students(self.request.user)


class GlobalSearchView(APIView):
    """
    Master search — search by name, index, programme, department, course.
    Returns students matching any of the fields.
    """
    permission_classes = [IsAnyStaff]

    def get(self, request):
        from accounts.permissions import scope_students
        from results.models import Course
        from django.db.models import Q

        q = request.query_params.get('q', '').strip()
        dept_id      = request.query_params.get('department_id')
        programme_id = request.query_params.get('programme_id')
        year         = request.query_params.get('year')
        standing     = request.query_params.get('standing')
        min_gpa      = request.query_params.get('min_gpa')
        max_gpa      = request.query_params.get('max_gpa')
        danger_only  = request.query_params.get('danger_only', '').lower() == 'true'

        qs = scope_students(request.user)

        if dept_id:       qs = qs.filter(department_id=dept_id)
        if programme_id:  qs = qs.filter(programme_id=programme_id)
        if year:          qs = qs.filter(current_year=year)
        
        if q:
            words = q.strip().split()
            if len(words) >= 2:
                # Multi-word query — try matching first+last name combination
                # e.g. "kofi adu" → first_name=kofi AND last_name=adu
                from functools import reduce
                import operator
                # Build AND filter: every word must appear somewhere in the name
                word_filters = []
                for word in words:
                    word_filters.append(
                        Q(user__first_name__icontains=word) |
                        Q(user__last_name__icontains=word)
                    )
                combined = reduce(operator.and_, word_filters)
                qs = qs.filter(combined)
            else:
                # Single word — search across all fields
                qs = qs.filter(
                    Q(user__first_name__icontains=q) |
                    Q(user__last_name__icontains=q) |
                    Q(index_number__icontains=q) |
                    Q(reference_number__icontains=q) |
                    Q(programme__name__icontains=q) |
                    Q(department__name__icontains=q)
                )

        students = list(qs.select_related('user', 'department', 'programme'))

        results = []
        for s in students:
            gpa      = s.cumulative_gpa
            standing_ = s.academic_standing
            if standing and standing_ != standing: continue
            if min_gpa and gpa < float(min_gpa): continue
            if max_gpa and gpa > float(max_gpa): continue
            if danger_only and not s.in_academic_danger: continue
            results.append({
                'id':              s.id,
                'index_number':    s.index_number,
                'reference_number':s.reference_number,
                'full_name':       s.user.get_full_name(),
                'email':           s.user.email,
                'department':      s.department.name,
                'department_id':   s.department_id,
                'programme':       s.programme.name,
                'programme_id':    s.programme_id,
                'current_year':    s.current_year,
                'status':          s.status,
                'cumulative_gpa':  gpa,
                'academic_standing': standing_,
                'trail_count':     s.trail_count,
                'in_danger':       s.in_academic_danger,
            })

        # Sort by relevance: exact index match first, then name
        if q:
            results.sort(key=lambda r: (
                0 if r['index_number'].upper() == q.upper() else
                1 if r['index_number'].upper().startswith(q.upper()) else 2
            ))

        return Response({
            'query': q,
            'count': len(results),
            'results': results[:100],   # cap at 100
        })
