from django.urls import path, include
from rest_framework_simplejwt import views as jwt_views

from accounts.views import ProfileView

urlpatterns = [
    path("me/", ProfileView.as_view(), name="profile"),
]
