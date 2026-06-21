from django.urls import path
from .views import (
    MyRegistrationListView, MyRegistrationDetailView,
    StaffRegistrationDetailView,
    AvailableCoursesView,
    AddElectiveView, RemoveElectiveView,
    SubmitRegistrationView,
    StaffRegistrationListView, ApproveRegistrationView,
    RegistrationSummaryView, CourseOfferingListView,
)

urlpatterns = [
    # Student
    path('my/',                                   MyRegistrationListView.as_view()),
    path('my/<int:pk>/',                          MyRegistrationDetailView.as_view()),
    path('my/<int:reg_id>/available/',            AvailableCoursesView.as_view()),
    path('my/<int:reg_id>/add-elective/',         AddElectiveView.as_view()),
    path('my/<int:reg_id>/remove/<int:course_id>/', RemoveElectiveView.as_view()),
    path('my/<int:reg_id>/submit/',               SubmitRegistrationView.as_view()),

    # Staff
    path('all/',                                  StaffRegistrationListView.as_view()),
    path('all/<int:pk>/',                          StaffRegistrationDetailView.as_view()),
    path('all/<int:pk>/action/',                  ApproveRegistrationView.as_view()),
    path('summary/',                              RegistrationSummaryView.as_view()),

    # Course offerings (lecturer assignments)
    path('offerings/',                            CourseOfferingListView.as_view()),
]
