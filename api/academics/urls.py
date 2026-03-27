from django.contrib import admin
from django.urls import path, include
from academics.views.school import SchoolListView,SchoolDetailView

urlpatterns = [
    path("schools/", SchoolListView.as_view(), name="school-list"),
    path("schools/<int:id>/", SchoolDetailView.as_view(), name="school-details")

]
