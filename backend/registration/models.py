from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class CourseRegistration(models.Model):
    STATUS_DRAFT     = 'draft'
    STATUS_SUBMITTED = 'submitted'
    STATUS_APPROVED  = 'approved'
    STATUS_REJECTED  = 'rejected'
    STATUS_CHOICES = [
        (STATUS_DRAFT,     'Draft'),
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_APPROVED,  'Approved'),
        (STATUS_REJECTED,  'Rejected'),
    ]

    student       = models.ForeignKey('students.Student', on_delete=models.CASCADE,
                                       related_name='registrations')
    academic_year = models.ForeignKey('results.AcademicYear', on_delete=models.CASCADE)
    semester      = models.PositiveIntegerField()
    year_of_study = models.PositiveIntegerField()
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    submitted_at  = models.DateTimeField(null=True, blank=True)
    approved_by   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                       null=True, blank=True, related_name='approved_registrations')
    approved_at   = models.DateTimeField(null=True, blank=True)
    notes         = models.TextField(blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'academic_year', 'semester']
        ordering = ['-academic_year__label', 'semester']

    @property
    def total_credits(self):
        return sum(rc.course.credit_hours
                   for rc in self.registered_courses.select_related('course').all())

    @property
    def core_credits(self):
        return sum(rc.course.credit_hours
                   for rc in self.registered_courses.select_related('course').all()
                   if rc.course.is_core)

    @property
    def elective_credits(self):
        return sum(rc.course.credit_hours
                   for rc in self.registered_courses.select_related('course').all()
                   if not rc.course.is_core)

    def __str__(self):
        return f"{self.student.index_number} — {self.academic_year.label} S{self.semester} [{self.status}]"


class RegisteredCourse(models.Model):
    registration = models.ForeignKey(CourseRegistration, on_delete=models.CASCADE,
                                      related_name='registered_courses')
    course       = models.ForeignKey('results.Course', on_delete=models.CASCADE,
                                      related_name='registrations')
    is_core      = models.BooleanField(default=True)   # snapshot at time of registration
    added_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['registration', 'course']

    def __str__(self):
        return f"{self.registration} — {self.course.code} ({'core' if self.is_core else 'elective'})"
