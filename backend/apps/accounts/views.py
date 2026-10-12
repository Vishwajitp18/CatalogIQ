from uuid import UUID

from django.conf import settings
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import exceptions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.accounts.models import UserSession
from apps.accounts.serializers import (
    LoginSerializer,
    LogoutSerializer,
    PasswordChangeSerializer,
    RegisterSerializer,
    TokenRefreshSerializer,
    UserSerializer,
    UserSessionSerializer,
)
from apps.accounts.services.sessions import (
    change_user_password,
    create_user_session,
    revoke_all_user_sessions,
    revoke_session_by_token,
    revoke_single_session_for_user,
    rotate_refresh_token,
)


class RegisterView(APIView):
    """Creates a new user account and immediately issues session tokens."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(
        summary="Register user account",
        description="Creates a new account and establishes an active login session.",
        request=RegisterSerializer,
        responses={201: dict, 400: OpenApiResponse(description="Validation error")},
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        session, access_token, refresh_token = create_user_session(user, request)
        access_expires_in = getattr(settings, "ACCESS_TOKEN_MINUTES", 10) * 60

        return Response(
            {
                "access": access_token,
                "refresh": refresh_token,
                "access_expires_in": access_expires_in,
                "token_type": "Bearer",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """Verifies user credentials and starts a new session."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(
        summary="User login",
        description="Verifies credentials and returns access and refresh tokens.",
        request=LoginSerializer,
        responses={200: dict, 401: OpenApiResponse(description="Invalid credentials")},
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        session, access_token, refresh_token = create_user_session(user, request)
        access_expires_in = getattr(settings, "ACCESS_TOKEN_MINUTES", 10) * 60

        return Response(
            {
                "access": access_token,
                "refresh": refresh_token,
                "access_expires_in": access_expires_in,
                "token_type": "Bearer",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class TokenRefreshView(APIView):
    """Rotates refresh token and issues a new access token pair."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        summary="Refresh access token",
        description="Presents current refresh token to receive a fresh access token and rotated refresh token.",
        request=TokenRefreshSerializer,
        responses={200: dict, 401: OpenApiResponse(description="Invalid, expired or reused token")},
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = TokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        access_token, new_refresh_token = rotate_refresh_token(
            serializer.validated_data["refresh"],
            request,
        )
        access_expires_in = getattr(settings, "ACCESS_TOKEN_MINUTES", 10) * 60

        return Response(
            {
                "access": access_token,
                "refresh": new_refresh_token,
                "access_expires_in": access_expires_in,
                "token_type": "Bearer",
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """Revokes session associated with the provided refresh token."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        summary="Logout current session",
        description="Revokes the presented refresh token and its session immediately.",
        request=LogoutSerializer,
        responses={204: None},
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        if serializer.is_valid():
            revoke_session_by_token(serializer.validated_data["refresh"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class LogoutAllView(APIView):
    """Revokes all active sessions for the authenticated user."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Logout all devices",
        description="Revokes all active sessions for the current authenticated user across all devices.",
        request=None,
        responses={204: None},
        tags=["Authentication"],
    )
    def post(self, request):
        revoke_all_user_sessions(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """Returns profile information for the authenticated user."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Current user profile",
        description="Retrieves profile data for the authenticated user.",
        responses={200: UserSerializer},
        tags=["Authentication"],
    )
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserSessionsListView(APIView):
    """Lists all active device sessions for the authenticated user."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List active sessions",
        description="Returns all active login sessions and devices associated with the authenticated user.",
        responses={200: UserSessionSerializer(many=True)},
        tags=["Authentication"],
    )
    def get(self, request):
        now = timezone.now()
        sessions = UserSession.objects.filter(
            user=request.user,
            revoked_at__isnull=True,
            expires_at__gt=now,
            absolute_expires_at__gt=now,
        ).order_by("-last_used_at")

        serializer = UserSessionSerializer(sessions, many=True, context={"request": request})
        return Response(serializer.data)


class UserSessionDetailView(APIView):
    """Revokes a specific session belonging to the user."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Revoke single session",
        description="Revokes a specific session ID owned by the user.",
        responses={204: None, 404: OpenApiResponse(description="Session not found")},
        tags=["Authentication"],
    )
    def delete(self, request, session_id: UUID):
        revoked = revoke_single_session_for_user(request.user, session_id)
        if not revoked:
            raise exceptions.NotFound("Session not found.")
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordChangeView(APIView):
    """Changes password and revokes all other active sessions."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Change password",
        description="Verifies existing password, sets new password, and revokes all other sessions.",
        request=PasswordChangeSerializer,
        responses={204: None, 400: OpenApiResponse(description="Password validation error")},
        tags=["Authentication"],
    )
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        current_sid = getattr(request, "auth_session_id", None)
        change_user_password(
            user=request.user,
            old_password=serializer.validated_data["old_password"],
            new_password=serializer.validated_data["new_password"],
            current_session_id=current_sid,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
