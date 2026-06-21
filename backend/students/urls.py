from django.urls import path
from .views import (DepartmentListView, DepartmentDetailView, ProgrammeListView,
                    StudentListView, StudentDetailView, StudentMeView,
                    StudentByIndexView, GlobalSearchView)

urlpatterns = [
    path('departments/',                        DepartmentListView.as_view()),
    path('departments/<int:pk>/',               DepartmentDetailView.as_view()),
    path('programmes/',                         ProgrammeListView.as_view()),
    path('students/',                           StudentListView.as_view()),
    path('students/me/',                        StudentMeView.as_view()),
    path('students/global-search/',             GlobalSearchView.as_view()),
    path('students/<int:pk>/',                  StudentDetailView.as_view()),
    path('students/search/<str:index_number>/', StudentByIndexView.as_view()),
]
