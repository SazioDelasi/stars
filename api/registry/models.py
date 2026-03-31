from django.db import models
from django.forms import ValidationError
from django.utils import timezone

from academics.models import Course, Programme
from accounts.models.student import Student


# Create your models here.
class AcademicSession(models.Model):
    """Tracks academic sessions; format: 2023/2024, 2024/2025"""

    year = models.CharField(max_length=20, unique=True)
    is_current = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.is_current:
            AcademicSession.objects.filter(is_current=True).update(is_current=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.year


class Semester(models.Model):

    class SemesterNumber(models.IntegerChoices):
        FIRST = 1, "First Semester"
        SECOND = 2, "Second Semester"

    session = models.ForeignKey(
        AcademicSession, on_delete=models.CASCADE, related_name="semesters"
    )
    number = models.PositiveSmallIntegerField(choices=SemesterNumber.choices)
    is_current = models.BooleanField(default=False)

    # Timeline tracking
    start_date = models.DateField()
    end_date = models.DateField()
    registration_deadline = models.DateTimeField()

    class Meta:
        unique_together = ("session", "number")

    @property
    def is_registration_open(self):
        return self.is_current and timezone.now() < self.registration_deadline

    @property
    def days_until_deadline(self):
        delta = self.registration_deadline - timezone.now()
        return max(0, delta.days)

    def clean(self):
        if self.start_date >= self.end_date:
            raise ValidationError("End date must be after start date.")

    def save(self, *args, **kwargs):
        if self.is_current:
            # When one semester becomes current, others in the system must stop being current
            Semester.objects.filter(is_current=True).update(is_current=False)
        super().save(*args, **kwargs)

    @classmethod
    def get_active(cls):
        return cls.objects.filter(is_current=True, session__is_current=True).first()

    def __str__(self):
        return f"{self.session.year} - {self.get_number_display()}"


class Registration(models.Model):
    """The link between a Student and their Courses for a specific semester"""

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PENDING = "PENDING", "Pending Approval"
        APPROVED = "APPROVED", "Fully Registered"
        REJECTED = "REJECTED", "Rejected"

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="registrations"
    )
    programme = models.ForeignKey(Programme, on_delete=models.PROTECT)
    session = models.ForeignKey(AcademicSession, on_delete=models.PROTECT)
    semester = models.PositiveSmallIntegerField(choices=[(1, "1st"), (2, "2nd")])

    courses = models.ManyToManyField(Course)
    is_confirmed = models.BooleanField(default=False)
    date_registered = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.DRAFT
    )

    class Meta:
        unique_together = ("student", "session", "semester")
