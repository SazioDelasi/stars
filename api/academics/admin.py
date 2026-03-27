from django.contrib import admin
from academics.models import School, Department, Course, Programme, CourseAssignment

# Register your models here.
admin.site.register([School, Department, Course, Programme, CourseAssignment])
