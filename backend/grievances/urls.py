from django.urls import path
from .views import (GrievanceListView, GrievanceDetailView,
                    UpdateGrievanceStatusView, GrievanceCommentView, GrievanceSummaryView)

urlpatterns = [
    path('',                               GrievanceListView.as_view()),
    path('summary/',                       GrievanceSummaryView.as_view()),
    path('<int:pk>/',                      GrievanceDetailView.as_view()),
    path('<int:pk>/status/',               UpdateGrievanceStatusView.as_view()),
    path('<int:grievance_id>/comments/',   GrievanceCommentView.as_view()),
]
