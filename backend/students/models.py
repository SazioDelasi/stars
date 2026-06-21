from django.db import models
from django.conf import settings


class Department(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=10, unique=True)
    faculty = models.CharField(max_length=200, blank=True)

    def __str__(self): return f"{self.code} - {self.name}"


class Programme(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='programmes')
    duration_years = models.PositiveIntegerField(default=4)
    min_graduation_credits = models.PositiveIntegerField(
        default=120,
        help_text='Minimum credits required to be eligible for graduation'
    )

    def __str__(self): return self.name


class Student(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_REPEATING = 'repeating'
    STATUS_DEFERRED = 'deferred'
    STATUS_GRADUATED = 'graduated'
    STATUS_WITHDRAWN = 'withdrawn'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_REPEATING, 'Repeating'),
        (STATUS_DEFERRED, 'Deferred'),
        (STATUS_GRADUATED, 'Graduated'),
        (STATUS_WITHDRAWN, 'Withdrawn'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    index_number = models.CharField(max_length=20, unique=True)
    reference_number = models.CharField(max_length=20, unique=True, blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='students')
    programme = models.ForeignKey(Programme, on_delete=models.CASCADE, related_name='students')
    year_of_admission = models.PositiveIntegerField()
    current_year = models.PositiveIntegerField(default=1)
    current_semester = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self): return f"{self.index_number} - {self.user.get_full_name()}"

    @property
    def cumulative_gpa(self):
        from results.models import SemesterResult
        semester_results = SemesterResult.objects.filter(student=self, is_published=True)
        if not semester_results.exists():
            return 0.0
        total_points = sum(sr.weighted_points for sr in semester_results)
        total_credits = sum(sr.total_credits for sr in semester_results)
        return round(total_points / total_credits, 2) if total_credits > 0 else 0.0

    @property
    def academic_standing(self):
        gpa = self.cumulative_gpa
        if gpa >= 3.60: return 'First Class'
        elif gpa >= 3.00: return 'Second Class Upper'
        elif gpa >= 2.00: return 'Second Class Lower'
        elif gpa >= 1.00: return 'Third Class'
        else: return 'Fail'

    @property
    def trail_count(self):
        from results.models import CourseResult
        return CourseResult.objects.filter(student=self, grade='F', is_published=True).count()

    @property
    def in_academic_danger(self):
        return self.cumulative_gpa < 1.5 or self.trail_count >= 3
