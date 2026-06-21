from django.urls import path
from .views import (
    LecturerListView, CourseOfferingListView,
    AcademicYearListView, CourseListView, CourseDetailView,
    CourseResultListView, CourseResultDetailView,
    PublishResultsView, StudentTranscriptView,
    GeneratePDFTranscriptView,
)

urlpatterns = [
    path('academic-years/',                          AcademicYearListView.as_view()),
    path('courses/',                                 CourseListView.as_view()),
    path('courses/<int:pk>/',                        CourseDetailView.as_view()),
    path('course-results/',                          CourseResultListView.as_view()),
    path('course-results/<int:pk>/',                 CourseResultDetailView.as_view()),
    path('publish/',                                 PublishResultsView.as_view()),
    path('transcript/student/<int:student_id>/',     StudentTranscriptView.as_view()),
    path('transcript/search/<str:index_number>/',    StudentTranscriptView.as_view()),
    path('transcript/pdf/<str:index_number>/',       GeneratePDFTranscriptView.as_view()),
]


from .views import LecturerListView, CourseOfferingListView
urlpatterns += [
    path('lecturers/', LecturerListView.as_view()),
    path('offerings/', CourseOfferingListView.as_view()),
]
from .views import ElectivePoolListView, ElectivePoolDetailView, ElectivePoolCourseView
urlpatterns += [
    path('elective-pools/',                          ElectivePoolListView.as_view()),
    path('elective-pools/<int:pk>/',                 ElectivePoolDetailView.as_view()),
    path('elective-pools/<int:pool_id>/courses/',    ElectivePoolCourseView.as_view()),
    path('elective-pools/<int:pool_id>/courses/<int:course_id>/', ElectivePoolCourseView.as_view()),
]
