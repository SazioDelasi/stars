from django.contrib import admin
from .models import Grievance, GrievanceComment, GrievancePriorityLog

@admin.register(Grievance)
class GrievanceAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'grievance_type', 'priority', 'status', 'response_deadline']
    list_filter  = ['priority', 'status', 'grievance_type']

admin.site.register(GrievanceComment)
admin.site.register(GrievancePriorityLog)
