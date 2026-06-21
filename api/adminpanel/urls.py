from django.urls import path, include
from adminpanel.views.dashboard import AdminDashboardSummaryView
from adminpanel.views.users import AdminUserListView

urlpatterns = [
    path(
        "dashboard/summary/",
        AdminDashboardSummaryView.as_view(),
        name="admin-dashboard-summary",
    ),
    path("users/", AdminUserListView.as_view(), name="admin-user-list"),
]
