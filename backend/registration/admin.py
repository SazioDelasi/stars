from django.contrib import admin
from .models import CourseRegistration, RegisteredCourse

class RegisteredCourseInline(admin.TabularInline):
    model = RegisteredCourse
    extra = 0

@admin.register(CourseRegistration)
class CourseRegistrationAdmin(admin.ModelAdmin):
    list_display = ['student', 'academic_year', 'semester', 'status', 'total_credits']
    inlines      = [RegisteredCourseInline]

admin.site.register(RegisteredCourse)
