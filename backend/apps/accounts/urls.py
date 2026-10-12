from django.urls import path

from apps.accounts.views import (
    LoginView,
    LogoutAllView,
    LogoutView,
    MeView,
    PasswordChangeView,
    RegisterView,
    TokenRefreshView,
    UserSessionDetailView,
    UserSessionsListView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("logout-all/", LogoutAllView.as_view(), name="auth-logout-all"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("sessions/", UserSessionsListView.as_view(), name="auth-sessions-list"),
    path(
        "sessions/<uuid:session_id>/", UserSessionDetailView.as_view(), name="auth-session-detail"
    ),
    path("password/change/", PasswordChangeView.as_view(), name="auth-password-change"),
]
