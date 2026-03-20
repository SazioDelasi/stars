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
    
    role = models.CharField(max_length=35, choices=Role.choices, default=Role.STUDENT)
