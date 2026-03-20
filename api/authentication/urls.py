from django.urls import path, include
from rest_framework_simplejwt import views as jwt_views
from authentication.views.login import LoginView

urlpatterns = [
    path('login/',
         LoginView.as_view(),
         name = 'login'
         ),
    path('refresh/',
         jwt_views.TokenRefreshView.as_view(),
         name = 'token_refresh')
]