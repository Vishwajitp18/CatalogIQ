from django.utils import timezone
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.accounts.models import UserSession


class SessionJWTAuthentication(JWTAuthentication):
    """Session-aware JWT authentication: verifies signature and checks active UserSession in DB."""

    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        user, session = self.get_user_and_session(validated_token)

        request.auth_session_id = session.id
        request.user_session = session
        return (user, validated_token)

    def get_user_and_session(self, validated_token):
        sid = validated_token.get("sid")
        if not sid:
            raise exceptions.AuthenticationFailed(
                detail={
                    "code": "token_invalid",
                    "message": "Token missing session identifier (sid).",
                },
                code="token_invalid",
            )

        try:
            session = UserSession.objects.select_related("user").get(id=sid)
        except (UserSession.DoesNotExist, ValueError) as exc:
            raise exceptions.AuthenticationFailed(
                detail={"code": "session_revoked", "message": "Session not found or revoked."},
                code="session_revoked",
            ) from exc

        now = timezone.now()
        if session.revoked_at is not None:
            raise exceptions.AuthenticationFailed(
                detail={"code": "session_revoked", "message": "Session has been revoked."},
                code="session_revoked",
            )

        if now >= session.expires_at or now >= session.absolute_expires_at:
            raise exceptions.AuthenticationFailed(
                detail={"code": "session_expired", "message": "Session has expired."},
                code="session_expired",
            )

        user = session.user
        if not user.is_active:
            raise exceptions.AuthenticationFailed(
                detail={"code": "user_inactive", "message": "User account is disabled."},
                code="user_inactive",
            )

        return (user, session)


class SessionJWTAuthenticationExtension(OpenApiAuthenticationExtension):
    """OpenAPI schema extension for Spectacular to document Bearer authentication."""

    target_class = "apps.accounts.authentication.SessionJWTAuthentication"
    name = "BearerAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT Access Token. Prefix with 'Bearer '.",
        }
