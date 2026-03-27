from django.contrib import admin
from accounts.models.student import Student
from accounts.models.lecturer import Lecturer
from accounts.models.admin import Admin
from accounts.models.dean import Dean
from accounts.models.hod import HOD

# Register your models here.
admin.site.register([Student, Lecturer, Dean, Admin, HOD])
