from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',       include('accounts.urls')),
    path('api/',            include('students.urls')),
    path('api/results/',    include('results.urls')),
    path('api/grievances/', include('grievances.urls')),
    path('api/registration/', include('registration.urls')),
    path('api/reports/',    include('reports.urls')),
]
