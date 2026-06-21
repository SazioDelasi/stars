from django.db import models
from django.conf import settings


class AcademicYear(models.Model):
    label = models.CharField(max_length=20, unique=True)  # e.g. "2023/2024"
    is_current = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.is_current:
            AcademicYear.objects.exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)

    def __str__(self): return self.label


class Course(models.Model):
    code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=200)
    credit_hours = models.PositiveIntegerField(default=3)
    department = models.ForeignKey('students.Department', on_delete=models.CASCADE, related_name='courses')
    year = models.PositiveIntegerField(default=1)
    semester = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    # Core vs Elective
    is_core = models.BooleanField(default=True,
        help_text='Core/compulsory for the programme — auto-added during registration')
    # Programme ownership — optional: if set, course belongs to this specific programme
    programme = models.ForeignKey('students.Programme', on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='programme_courses')
    # Course equivalency: maps old codes to this course
    equivalent_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='equivalents')

    def __str__(self): return f"{self.code} - {self.title}"


GRADE_POINTS = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0,
    'F': 0.0, 'IC': 0.0, 'WD': 0.0,
}

GRADE_CHOICES = [(g, g) for g in GRADE_POINTS.keys()]


class CourseResult(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='course_results')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='results')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    semester = models.PositiveIntegerField()
    year_of_study = models.PositiveIntegerField()
    
    # Marks breakdown
    continuous_assessment = models.FloatField(null=True, blank=True)  # out of 40
    exam_score = models.FloatField(null=True, blank=True)              # out of 60
    total_score = models.FloatField(null=True, blank=True)             # out of 100
    grade = models.CharField(max_length=5, choices=GRADE_CHOICES, blank=True)
    grade_point = models.FloatField(default=0.0)
    
    is_published = models.BooleanField(default=False)
    is_locked   = models.BooleanField(default=False)  # locked after official publish
    is_trail = models.BooleanField(default=False)  # retaking a failed course
    entered_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='entered_results')
    entered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'course', 'academic_year', 'semester']

    def compute_grade(self):
        if self.total_score is None:
            return
        score = self.total_score
        if score >= 80: self.grade = 'A+'
        elif score >= 75: self.grade = 'A'
        elif score >= 70: self.grade = 'A-'
        elif score >= 67: self.grade = 'B+'
        elif score >= 63: self.grade = 'B'
        elif score >= 60: self.grade = 'B-'
        elif score >= 57: self.grade = 'C+'
        elif score >= 53: self.grade = 'C'
        elif score >= 50: self.grade = 'C-'
        elif score >= 47: self.grade = 'D+'
        elif score >= 40: self.grade = 'D'
        else: self.grade = 'F'
        self.grade_point = GRADE_POINTS.get(self.grade, 0.0)

    def save(self, *args, **kwargs):
        if self.continuous_assessment is not None and self.exam_score is not None:
            self.total_score = self.continuous_assessment + self.exam_score
        if self.total_score is not None:
            self.compute_grade()
        super().save(*args, **kwargs)

    def __str__(self): return f"{self.student.index_number} - {self.course.code} ({self.grade})"


class SemesterResult(models.Model):
    """Aggregated semester summary for a student."""
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='semester_results')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    semester = models.PositiveIntegerField()
    year_of_study = models.PositiveIntegerField()
    semester_gpa = models.FloatField(default=0.0)
    total_credits = models.PositiveIntegerField(default=0)
    weighted_points = models.FloatField(default=0.0)
    is_published = models.BooleanField(default=False)

    class Meta:
        unique_together = ['student', 'academic_year', 'semester']

    def recompute(self):
        course_results = CourseResult.objects.filter(
            student=self.student,
            academic_year=self.academic_year,
            semester=self.semester,
            is_published=True
        )
        total_credits = sum(cr.course.credit_hours for cr in course_results)
        weighted = sum(cr.grade_point * cr.course.credit_hours for cr in course_results)
        self.total_credits = total_credits
        self.weighted_points = weighted
        self.semester_gpa = round(weighted / total_credits, 2) if total_credits > 0 else 0.0
        self.save()

    def __str__(self): return f"{self.student.index_number} - Y{self.year_of_study}S{self.semester} GPA:{self.semester_gpa}"


class ResultEditLog(models.Model):
    """Audit trail every time a result is edited."""
    course_result  = models.ForeignKey(CourseResult, on_delete=models.CASCADE, related_name='edit_logs')
    edited_by      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    old_ca         = models.FloatField(null=True, blank=True)
    new_ca         = models.FloatField(null=True, blank=True)
    old_exam       = models.FloatField(null=True, blank=True)
    new_exam       = models.FloatField(null=True, blank=True)
    old_grade      = models.CharField(max_length=5, blank=True)
    new_grade      = models.CharField(max_length=5, blank=True)
    reason         = models.TextField(blank=True)
    timestamp      = models.DateTimeField(auto_now_add=True)
    is_override    = models.BooleanField(default=False)  # True = university coord override

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Edit #{self.pk} on {self.course_result} by {self.edited_by}"


class Lecturer(models.Model):
    """
    A person who teaches courses. Linked to User if they have an account,
    but can also exist as standalone (external lecturers).
    """
    user       = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                       null=True, blank=True, related_name='lecturer_profile')
    first_name = models.CharField(max_length=100)
    last_name  = models.CharField(max_length=100)
    title      = models.CharField(max_length=30, blank=True,
                                   help_text='e.g. Dr., Mr., Mrs., Prof.')
    email      = models.EmailField(blank=True)
    department = models.ForeignKey('students.Department', on_delete=models.CASCADE,
                                    related_name='lecturers')
    is_active  = models.BooleanField(default=True)

    @property
    def full_name(self):
        parts = [self.title, self.first_name, self.last_name]
        return ' '.join(p for p in parts if p).strip()

    def __str__(self): return self.full_name


class CourseOffering(models.Model):
    """
    A specific instance of a course being taught in a semester by a lecturer.
    This is what students actually register for.
    """
    course        = models.ForeignKey(Course, on_delete=models.CASCADE,
                                       related_name='offerings')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE,
                                       related_name='offerings')
    semester      = models.PositiveIntegerField()
    lecturer      = models.ForeignKey(Lecturer, on_delete=models.SET_NULL,
                                       null=True, blank=True, related_name='offerings')
    max_students  = models.PositiveIntegerField(default=200)
    notes         = models.TextField(blank=True)

    class Meta:
        unique_together = ['course', 'academic_year', 'semester']

    @property
    def enrolled_count(self):
        from registration.models import RegisteredCourse
        return RegisteredCourse.objects.filter(
            course=self.course,
            registration__academic_year=self.academic_year,
            registration__semester=self.semester,
            registration__status__in=['submitted', 'approved'],
        ).count()

    def __str__(self):
        lec = self.lecturer.full_name if self.lecturer else 'TBA'
        return f"{self.course.code} — {self.academic_year.label} S{self.semester} ({lec})"


class ElectivePool(models.Model):
    """
    HOD-configured elective offering for a specific programme/level/semester.
    Only courses in this pool are visible to students during registration.
    """
    name          = models.CharField(max_length=200,
                                      help_text='e.g. "Year 3 Sem 1 CS Electives"')
    department    = models.ForeignKey('students.Department', on_delete=models.CASCADE,
                                       related_name='elective_pools')
    programme     = models.ForeignKey('students.Programme', on_delete=models.SET_NULL,
                                       null=True, blank=True, related_name='elective_pools',
                                       help_text='Leave blank to apply to ALL programmes in dept')
    year_of_study = models.PositiveIntegerField()
    semester      = models.PositiveIntegerField()
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE,
                                       related_name='elective_pools')
    max_electives = models.PositiveIntegerField(default=2,
                                                 help_text='Max number of electives student may choose')
    max_elective_credits = models.PositiveIntegerField(default=6,
                                                        help_text='Max total elective credit hours')
    is_active     = models.BooleanField(default=True)
    created_by    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                       null=True, related_name='created_elective_pools')
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['department', 'programme', 'year_of_study', 'semester', 'academic_year']

    def __str__(self):
        prog = self.programme.code if self.programme else 'ALL'
        return f"{self.department.code} Y{self.year_of_study}S{self.semester} ({prog}) — {self.academic_year.label}"


class ElectivePoolCourse(models.Model):
    """A course approved by HOD for inclusion in an ElectivePool."""
    pool   = models.ForeignKey(ElectivePool, on_delete=models.CASCADE, related_name='pool_courses')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='elective_pool_entries')
    added_by  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                   null=True, related_name='added_elective_courses')
    added_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['pool', 'course']

    def __str__(self):
        return f"{self.pool} → {self.course.code}"
