from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from accounts.permissions import IsAnyStaff, scoped_dept_id
from .models import Grievance, GrievanceComment, GrievancePriorityLog
from .serializers import (GrievanceSerializer, GrievanceCreateSerializer,
                           GrievanceListSerializer, GrievanceCommentSerializer)


class IsStaffOrOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_any_staff: return True
        return obj.student.user == request.user


class GrievanceListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ['status','grievance_type','priority']

    def get_serializer_class(self):
        return GrievanceCreateSerializer if self.request.method == 'POST' else GrievanceListSerializer

    def get_queryset(self):
        user = self.request.user

        if user.is_student:
            return Grievance.objects.filter(student__user=user)

        qs = Grievance.objects.select_related(
            'student__user', 'student__department', 'assigned_to'
        )

        if user.role == 'dept_coordinator':
            # Coordinators see only exams-related grievances in their dept
            dept_id = scoped_dept_id(user)
            qs = qs.filter(
                grievance_type__in=['result', 'grade'],
                student__department_id=dept_id,
            )

        elif user.role == 'hod':
            # HoDs see registration, timetable, lecturer grievances in their dept
            dept_id = scoped_dept_id(user)
            qs = qs.filter(
                grievance_type__in=['registration', 'timetable', 'lecturer'],
                student__department_id=dept_id,
            )

        elif user.role == 'administrator':
            # Admin sees portal, feedback, other — no dept filter
            qs = qs.filter(
                grievance_type__in=['portal', 'feedback', 'other']
            )

        elif user.role == 'university_coordinator':
            # Uni coord sees transcript and graduation grievances from all depts
            # Plus can see everything as oversight
            type_filter = self.request.query_params.get('type_scope')
            if type_filter == 'assigned':
                qs = qs.filter(grievance_type__in=['transcript', 'graduation'])
            # else sees all (no filter) for oversight

        return qs
    def perform_create(self, serializer):
        serializer.save()


class GrievanceDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsStaffOrOwner]
    serializer_class   = GrievanceSerializer

    def get_queryset(self):
        user = self.request.user

        if user.is_student:
            return Grievance.objects.filter(student__user=user)

        qs = Grievance.objects.all()

        if user.role == 'dept_coordinator':
            dept_id = scoped_dept_id(user)
            qs = qs.filter(
                grievance_type__in=['result', 'grade'],
                student__department_id=dept_id,
            )
        elif user.role == 'hod':
            dept_id = scoped_dept_id(user)
            qs = qs.filter(
                grievance_type__in=['registration', 'timetable', 'lecturer'],
                student__department_id=dept_id,
            )
        elif user.role == 'administrator':
            qs = qs.filter(grievance_type__in=['portal', 'feedback', 'other'])

        return qs
    def update(self, request, *args, **kwargs):
        if request.user.is_student:
            return Response({'error': 'Students cannot edit grievances.'}, status=403)
        return super().update(request, *args, **kwargs)


class UpdateGrievanceStatusView(APIView):
    permission_classes = [IsAnyStaff]

    def patch(self, request, pk):
        dept_id = scoped_dept_id(request.user)
        try:
            g = Grievance.objects.get(pk=pk)
        except Grievance.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)
        if dept_id and g.student.department_id != dept_id:
            return Response({'error': 'Outside your department.'}, status=403)

        new_status   = request.data.get('status')
        new_priority = request.data.get('priority')
        assigned_to  = request.data.get('assigned_to')
        reason       = request.data.get('reason', '')

        if new_status:
            g.status = new_status
            if new_status == 'resolved':
                g.resolved_at = timezone.now()
            elif new_status == 'escalated' and g.priority != 'high':
                old_p = g.priority
                g.priority = 'high'
                GrievancePriorityLog.objects.create(
                    grievance=g, changed_by=request.user,
                    old_priority=old_p, new_priority='high',
                    reason='Auto-escalated with status change'
                )

        if new_priority and new_priority != g.priority:
            if not reason.strip():
                return Response({'error': 'A reason is required to override priority.'}, status=400)
            GrievancePriorityLog.objects.create(
                grievance=g, changed_by=request.user,
                old_priority=g.priority, new_priority=new_priority, reason=reason
            )
            g.priority = new_priority
            g.priority_set_by = request.user
            g.priority_override_reason = reason

        if assigned_to:
            g.assigned_to_id = assigned_to

        g.save()
        return Response(GrievanceSerializer(g).data)


class GrievanceCommentView(generics.ListCreateAPIView):
    serializer_class   = GrievanceCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = GrievanceComment.objects.filter(grievance_id=self.kwargs['grievance_id'])
        if self.request.user.is_student: qs = qs.filter(is_internal=False)
        return qs

    def perform_create(self, serializer):
        serializer.save(
            author=self.request.user,
            grievance_id=self.kwargs['grievance_id'],
            is_internal=not self.request.user.is_student and
                        bool(self.request.data.get('is_internal', False))
        )


class GrievanceSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_student:
            qs = Grievance.objects.filter(student__user=user)
        elif user.role == 'dept_coordinator':
            dept_id = scoped_dept_id(user)
            qs = Grievance.objects.filter(
                grievance_type__in=['result', 'grade'],
                student__department_id=dept_id,
            )
        elif user.role == 'hod':
            dept_id = scoped_dept_id(user)
            qs = Grievance.objects.filter(
                grievance_type__in=['registration', 'timetable', 'lecturer'],
                student__department_id=dept_id,
            )
        elif user.role == 'administrator':
            qs = Grievance.objects.filter(
                grievance_type__in=['portal', 'feedback', 'other']
            )
        else:
            # university_coordinator sees all
            qs = Grievance.objects.all()