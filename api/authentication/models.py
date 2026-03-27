from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        ADMIN = "ADMIN", "Admin"
        HOD = "HOD", "HOD"
        DEP_EXAMS_COORD = "DEP_EXAMS_COORD", "Department Exams Coordinator"
        SCH_EXAMS_COORD = "SCH_EXAMS_COORD", "School Exams Coordinator"
        LECTURER = "LECTURER", "Lecturer"
        DEAN = "DEAN", "Dean"
    
    class Gender(models.IntegerChoices):
        MALE = 0, "Male"
        FEMALE = 1, "Female"

    class Title(models.TextChoices):
        MR = "MR", 'Mr.'
        MRS = "MRS", 'Mrs.'
        DR = "DR", 'Dr.'
        PROF = "PROF", 'Prof.'
        REV = "REV", 'Rev.'

    role = models.CharField(max_length=35, choices=Role.choices, default=Role.STUDENT)
    gender = models.PositiveSmallIntegerField(choices=Gender.choices)
    phone = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=6, choices=Title.choices)

    @property
    def full_name(self):
        return f"{self.get_title_display()} {self.first_name} {self.last_name}"
    
    def __str__(self):
        return self.full_name