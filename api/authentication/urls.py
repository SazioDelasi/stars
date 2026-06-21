from django.urls import path, include
from rest_framework_simplejwt import views as jwt_views
from authentication.views.login import LoginView
from authentication.views.user import UserViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="users")

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", jwt_views.TokenRefreshView.as_view(), name="token_refresh"),
    path("", include(router.urls)),
]
