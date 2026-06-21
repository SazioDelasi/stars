from django.contrib import admin
from .models import AcademicYear, Course, CourseResult, SemesterResult, Lecturer, CourseOffering, ResultEditLog

admin.site.register(AcademicYear)
admin.site.register(Course)
admin.site.register(CourseResult)
admin.site.register(SemesterResult)
admin.site.register(Lecturer)
admin.site.register(CourseOffering)
admin.site.register(ResultEditLog)
from .models import ElectivePool, ElectivePoolCourse
admin.site.register(ElectivePool)
admin.site.register(ElectivePoolCourse)
