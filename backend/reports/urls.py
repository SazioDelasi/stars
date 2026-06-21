from django.urls import path
from .views import (
    CourseOfferingReportView, CourseOfferingPDFView,
    CourseOfferingExcelView, CourseOfferingCSVView,
    ProgrammeReportView, ProgrammeExcelView,
    DepartmentReportView, DepartmentReportPDFView, DepartmentReportExcelView,
    SemesterReportView, SemesterReportExcelView,
    DangerReportView, DangerReportExcelView,
    GraduationReportView, GraduationReportExcelView,
    UniversityComparisonView,
    BatchUploadView,
    ResultEditView, ResultLockView, ResultEditLogView,
    CourseRegistrationStatusView, CourseRegistrationStatusExcelView,
)

urlpatterns = [
    # Course offering
    path('courses/',             CourseOfferingReportView.as_view()),
    path('courses/pdf/',         CourseOfferingPDFView.as_view()),
    path('courses/excel/',       CourseOfferingExcelView.as_view()),
    path('courses/csv/',         CourseOfferingCSVView.as_view()),

    # Programme
    path('programmes/',          ProgrammeReportView.as_view()),
    path('programmes/excel/',    ProgrammeExcelView.as_view()),

    # Department
    path('departments/',         DepartmentReportView.as_view()),
    path('departments/pdf/',     DepartmentReportPDFView.as_view()),
    path('departments/excel/',   DepartmentReportExcelView.as_view()),

    # Semester
    path('semesters/',           SemesterReportView.as_view()),
    path('semesters/excel/',     SemesterReportExcelView.as_view()),

    # Academic danger
    path('danger/',              DangerReportView.as_view()),
    path('danger/excel/',        DangerReportExcelView.as_view()),

    # Graduation
    path('graduation/',          GraduationReportView.as_view()),
    path('graduation/excel/',    GraduationReportExcelView.as_view()),

    # University comparison
    path('university/',          UniversityComparisonView.as_view()),

    # Batch upload
    path('batch-upload/',        BatchUploadView.as_view()),

    # Result editing + audit
    path('results/<int:pk>/edit/',    ResultEditView.as_view()),
    path('results/<int:pk>/lock/',    ResultLockView.as_view()),
    path('results/<int:pk>/logs/',    ResultEditLogView.as_view()),
]

from .views import HODDashboardView
urlpatterns += [
    path('hod-dashboard/', HODDashboardView.as_view()),
    path('registration-status/',       CourseRegistrationStatusView.as_view()),
    path('registration-status/excel/', CourseRegistrationStatusExcelView.as_view()),
]
