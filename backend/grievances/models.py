from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class Grievance(models.Model):
    TYPE_RESULT       = 'result'
    TYPE_REGISTRATION = 'registration'
    TYPE_GRADE        = 'grade'
    TYPE_TIMETABLE    = 'timetable'
    TYPE_PORTAL       = 'portal'
    TYPE_LECTURER     = 'lecturer'
    TYPE_GRADUATION   = 'graduation'
    TYPE_TRANSCRIPT   = 'transcript'
    TYPE_FEEDBACK     = 'feedback'
    TYPE_OTHER        = 'other'

    TYPE_CHOICES = [
        (TYPE_RESULT,       'Result Issue'),
        (TYPE_REGISTRATION, 'Registration Issue'),
        (TYPE_GRADE,        'Grade Dispute'),
        (TYPE_TIMETABLE,    'Timetable Conflict'),
        (TYPE_PORTAL,       'Portal / System Issue'),
        (TYPE_LECTURER,     'Lecturer Complaint'),
        (TYPE_GRADUATION,   'Graduation Issue'),
        (TYPE_TRANSCRIPT,   'Transcript Issue'),
        (TYPE_FEEDBACK,     'General Feedback'),
        (TYPE_OTHER,        'Other'),
    ]

    STATUS_PENDING    = 'pending'
    STATUS_IN_REVIEW  = 'in_review'
    STATUS_ESCALATED  = 'escalated'
    STATUS_RESOLVED   = 'resolved'
    STATUS_REJECTED   = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING,   'Pending'),
        (STATUS_IN_REVIEW, 'Under Review'),
        (STATUS_ESCALATED, 'Escalated'),
        (STATUS_RESOLVED,  'Resolved'),
        (STATUS_REJECTED,  'Rejected'),
    ]

    PRIORITY_LOW    = 'low'
    PRIORITY_MEDIUM = 'medium'
    PRIORITY_HIGH   = 'high'
    PRIORITY_CHOICES = [
        (PRIORITY_LOW,    'Low'),
        (PRIORITY_MEDIUM, 'Medium'),
        (PRIORITY_HIGH,   'High'),
    ]

    student        = models.ForeignKey('students.Student', on_delete=models.CASCADE,
                                        related_name='grievances')
    grievance_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default=TYPE_OTHER)
    priority       = models.CharField(max_length=10, choices=PRIORITY_CHOICES,
                                       default=PRIORITY_MEDIUM)
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES,
                                       default=STATUS_PENDING)
    subject        = models.CharField(max_length=200)
    description    = models.TextField()
    assigned_to    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                        null=True, blank=True, related_name='assigned_grievances')
    priority_set_by= models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                        null=True, blank=True, related_name='priority_overrides')
    priority_override_reason = models.TextField(blank=True)
    related_course       = models.ForeignKey('results.Course', on_delete=models.SET_NULL,
                                              null=True, blank=True)
    related_academic_year= models.ForeignKey('results.AcademicYear', on_delete=models.SET_NULL,
                                              null=True, blank=True)
    response_deadline = models.DateTimeField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    resolved_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if is_new:
            from grievances.services.priority_classifier import classify_priority, auto_assign
            self.priority = classify_priority(self.grievance_type, self.subject, self.description)
            self.response_deadline = _compute_deadline(self.priority)
            if not self.assigned_to:
                self.assigned_to = auto_assign(self.grievance_type, self.student)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"#{self.pk} [{self.priority.upper()}] {self.student.index_number}: {self.subject}"


def _compute_deadline(priority):
    days = {'high': 2, 'medium': 5, 'low': 14}
    return timezone.now() + timedelta(days=days.get(priority, 5))


class GrievanceComment(models.Model):
    grievance   = models.ForeignKey(Grievance, on_delete=models.CASCADE, related_name='comments')
    author      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message     = models.TextField()
    is_internal = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['created_at']


class GrievancePriorityLog(models.Model):
    grievance    = models.ForeignKey(Grievance, on_delete=models.CASCADE, related_name='priority_logs')
    changed_by   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    old_priority = models.CharField(max_length=10)
    new_priority = models.CharField(max_length=10)
    reason       = models.TextField()
    changed_at   = models.DateTimeField(auto_now_add=True)
