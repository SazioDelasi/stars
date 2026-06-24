from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_STUDENT = "student"
    ROLE_HOD = "hod"
    ROLE_DEPT_COORDINATOR = "dept_coordinator"
    ROLE_UNIVERSITY_COORDINATOR = "university_coordinator"
    ROLE_ADMINISTRATOR = 'administrator'

    ROLE_CHOICES = [
        ("student", "Student"),
        ("hod", "Head of Department"),
        ("dept_coordinator", "Departmental Exams Coordinator"),
        ("university_coordinator", "University Exams Coordinator"),
        ("administrator", "Administrator"),
    ]

    role = models.CharField(max_length=40, choices=ROLE_CHOICES, default=ROLE_STUDENT)
    department = models.ForeignKey(
        "students.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_members",
    )

    # ── convenience properties ──────────────────────────────────
    @property
    def is_student(self):
        return self.role == self.ROLE_STUDENT

    @property
    def is_hod(self):
        return self.role == self.ROLE_HOD

    @property
    def is_dept_coordinator(self):
        return self.role == self.ROLE_DEPT_COORDINATOR

    @property
    def is_university_coordinator(self):
        return self.role == self.ROLE_UNIVERSITY_COORDINATOR

    # legacy alias kept for backward compat
    @property
    def is_exams_coordinator(self):
        return self.role in (
            self.ROLE_DEPT_COORDINATOR,
            self.ROLE_UNIVERSITY_COORDINATOR,
        )

    @property
    def is_any_staff(self):
        return self.role in (
            self.ROLE_HOD,
            self.ROLE_DEPT_COORDINATOR,
            self.ROLE_UNIVERSITY_COORDINATOR,
            self.ROLE_ADMINISTRATOR,
        )

    @property
    def is_administrator(self):
        return self.role == self.ROLE_ADMINISTRATOR

    @property
    def has_dept_scope(self):
        """True when role is limited to one department."""
        return self.role in (self.ROLE_HOD, self.ROLE_DEPT_COORDINATOR)

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"
