from django.db import models
from accounts.models.hod import HOD
from accounts.models.lecturer import Lecturer
from accounts.models.dean import Dean


# Create your models here.
class School(models.Model):
    name = models.CharField(max_length=255, unique=True)
    dean = models.ForeignKey(Dean, on_delete=models.SET_NULL, null=True)


class Department(models.Model):
    name = models.CharField(max_length=255, unique=True)
    hod = models.ForeignKey(HOD, on_delete=models.SET_NULL, null=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    prefix = models.CharField(max_length=5, unique=True)


class Programme(models.Model):
    class DegreeType(models.TextChoices):
        BSC = "BSC", "BSc"
        MSC = "MSC", "MSc"

    class DegreeLevel(models.TextChoices):
        UNDERGRADUATE = "UNDERGRADUATE", "Undergraduate"
        MASTERS = "MASTERS", "Masters Degree"

    name = models.CharField(max_length=255)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    duration = models.PositiveIntegerField(default=4)
    required_credit = models.PositiveIntegerField()
    degree_type = models.CharField(choices=DegreeType.choices)
    degree_level = models.CharField(choices=DegreeLevel.choices)

    class Meta:
        unique_together = ("name", "department")


class Course(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, unique=True)
    credits = models.PositiveIntegerField()
    has_lab = models.BooleanField(default=False)


class ProgrammeCourse(models.Model):
    """
    Defines which courses are available for a specific Programme in a Session.
    This keeps the history of what was offered in 2024 vs 2025.
    """

    class CourseType(models.TextChoices):
        CORE = "CORE", "Core"
        ELECTIVE = "ELECTIVE", "Elective"

    programme = models.ForeignKey(Programme, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    session = models.ForeignKey("registry.AcademicSession", on_delete=models.CASCADE)
    semester = models.PositiveSmallIntegerField(choices=[(1, "1st"), (2, "2nd")])
    level = models.PositiveIntegerField()

    course_type = models.CharField(
        max_length=10, choices=CourseType.choices, default=CourseType.CORE
    )

    class Meta:
        unique_together = ("programme", "course", "session", "semester")

    def __str__(self):
        return f"{self.programme.name} - {self.course.code} ({self.get_course_type_display()})"


class CourseAssignment(models.Model):
    class Semester(models.IntegerChoices):
        FIRST_SEMESTER = 1, "First Semester"
        SECOND_SEMESTER = 2, "Second Semester"

    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE)
    academic_year = models.CharField(max_length=20)
    semester = models.PositiveSmallIntegerField(choices=Semester.choices)
    is_lead = models.BooleanField(default=False)

    class Meta:
        unique_together = ("course", "lecturer", "academic_year", "semester")


class ProgrammeRequirement(models.Model):
    programme = models.ForeignKey(Programme, on_delete=models.CASCADE)
    semester = models.PositiveSmallIntegerField(choices=[(1, "1st"), (2, "2nd")])
    level = models.PositiveIntegerField()

    min_credits = models.PositiveIntegerField(default=15)
    max_credits = models.PositiveIntegerField(default=21)

    class Meta:
        unique_together = ("programme", "semester", "level")

    def __str__(self):
        return f"{self.programme.name} - L{self.level} S{self.semester} Limits"
