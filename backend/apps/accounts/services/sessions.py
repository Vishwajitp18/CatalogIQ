import logging
from datetime import timedelta
from uuid import UUID

from django.conf import settings
from django.contrib.auth import password_validation
from django.contrib.auth.models import AbstractBaseUser
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import exceptions

from apps.accounts.models import UserSession
from apps.accounts.services.tokens import (
    create_access_token_for_session,
    generate_refresh_token,
    hash_token,
)

logger = logging.getLogger("apps.accounts.sessions")


def get_client_ip(request) -> str | None:
    """Extracts client IP from X-Forwarded-For or REMOTE_ADDR."""
    if not request:
        return None
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def get_user_agent(request) -> str:
    """Extracts and truncates User-Agent string."""
    if not request:
        return ""
    return request.META.get("HTTP_USER_AGENT", "")[:255]


def create_user_session(user: AbstractBaseUser, request=None) -> tuple[UserSession, str, str]:
    """Creates a new UserSession with a cryptographically secure refresh token.
    Returns: (session, access_jwt, raw_refresh_token)
    """
    raw_refresh = generate_refresh_token()
    token_hash = hash_token(raw_refresh)
    now = timezone.now()

    refresh_days = getattr(settings, "REFRESH_TOKEN_DAYS", 14)
    absolute_days = getattr(settings, "SESSION_ABSOLUTE_DAYS", 30)

    session = UserSession.objects.create(
        user=user,
        refresh_token_hash=token_hash,
        user_agent=get_user_agent(request),
        ip_address=get_client_ip(request),
        expires_at=now + timedelta(days=refresh_days),
        absolute_expires_at=now + timedelta(days=absolute_days),
    )

    access_token = create_access_token_for_session(session)
    return session, access_token, raw_refresh


def rotate_refresh_token(presented_token: str, request=None) -> tuple[str, str]:
    """Rotates refresh token inside a row-locked transaction.
    Detects token reuse outside the grace window and immediately revokes the compromised session.
    Returns: (new_access_token, new_raw_refresh_token)
    """
    if not presented_token:
        raise exceptions.AuthenticationFailed(
            detail={"code": "refresh_token_invalid", "message": "Refresh token is required."},
            code="refresh_token_invalid",
        )

    h = hash_token(presented_token)
    theft_detected = False
    theft_session_id = None
    theft_user_id = None

    with transaction.atomic():
        session = (
            UserSession.objects.select_for_update()
            .select_related("user")
            .filter(Q(refresh_token_hash=h) | Q(previous_token_hash=h))
            .first()
        )

        if not session:
            raise exceptions.AuthenticationFailed(
                detail={"code": "refresh_token_invalid", "message": "Invalid refresh token."},
                code="refresh_token_invalid",
            )

        now = timezone.now()

        # Case 1: Presented token matches the current active token hash
        if session.refresh_token_hash == h:
            if (
                session.revoked_at is not None
                or not session.user.is_active
                or now >= session.expires_at
                or now >= session.absolute_expires_at
            ):
                if session.revoked_at is None:
                    session.revoked_at = now
                    session.revoked_reason = (
                        "user_inactive" if not session.user.is_active else "idle_expired"
                    )
                    session.save(update_fields=["revoked_at", "revoked_reason"])
                raise exceptions.AuthenticationFailed(
                    detail={
                        "code": "session_revoked",
                        "message": "Session has expired or been revoked.",
                    },
                    code="session_revoked",
                )

            # Legitimate rotation
            old_hash = session.refresh_token_hash
            new_raw_token = generate_refresh_token()
            new_hash = hash_token(new_raw_token)
            refresh_days = getattr(settings, "REFRESH_TOKEN_DAYS", 14)

            session.previous_token_hash = old_hash
            session.refresh_token_hash = new_hash
            session.rotated_at = now
            session.rotation_count += 1
            session.last_used_at = now
            session.expires_at = min(
                now + timedelta(days=refresh_days), session.absolute_expires_at
            )

            # Update client metadata
            if request:
                session.user_agent = get_user_agent(request)
                session.ip_address = get_client_ip(request)

            session.save()
            new_access = create_access_token_for_session(session)
            return new_access, new_raw_token

        # Case 2: Presented token matches previous token hash (reuse attempt)
        if session.previous_token_hash == h:
            grace_seconds = getattr(settings, "REFRESH_REUSE_GRACE_SECONDS", 10)
            is_within_grace = session.rotated_at and (now - session.rotated_at) <= timedelta(
                seconds=grace_seconds
            )

            if is_within_grace:
                # Benign concurrent request or double-submit
                raise exceptions.AuthenticationFailed(
                    detail={
                        "code": "refresh_token_rotated",
                        "message": "Token was already rotated recently. Please use the newest token.",
                    },
                    code="refresh_token_rotated",
                )

            # Mark for theft revocation outside atomic block so DB commit persists
            theft_detected = True
            theft_session_id = session.id
            theft_user_id = session.user.id

    if theft_detected:
        now = timezone.now()
        UserSession.objects.filter(id=theft_session_id).update(
            revoked_at=now,
            revoked_reason="reuse_detected",
        )
        logger.warning(
            "Refresh token reuse detected for user=%s session=%s. Revoked immediately.",
            theft_user_id,
            theft_session_id,
            extra={"user_id": theft_user_id, "session_id": str(theft_session_id)},
        )
        raise exceptions.AuthenticationFailed(
            detail={
                "code": "session_revoked",
                "message": "Security warning: refresh token reuse detected. Session has been revoked.",
            },
            code="session_revoked",
        )

    raise exceptions.AuthenticationFailed(
        detail={"code": "refresh_token_invalid", "message": "Invalid refresh token."},
        code="refresh_token_invalid",
    )


def revoke_session_by_token(refresh_token: str) -> None:
    """Revokes the session corresponding to the presented refresh token (current or previous hash). Idempotent."""
    if not refresh_token:
        return
    h = hash_token(refresh_token)
    UserSession.objects.filter(
        Q(refresh_token_hash=h) | Q(previous_token_hash=h),
        revoked_at__isnull=True,
    ).update(revoked_at=timezone.now(), revoked_reason="logout")


def revoke_all_user_sessions(user: AbstractBaseUser) -> int:
    """Revokes all active sessions for a user."""
    return UserSession.objects.filter(user=user, revoked_at__isnull=True).update(
        revoked_at=timezone.now(),
        revoked_reason="logout_all",
    )


def revoke_single_session_for_user(user: AbstractBaseUser, session_id: UUID) -> bool:
    """Revokes a specific session belonging to the user."""
    count = UserSession.objects.filter(user=user, id=session_id, revoked_at__isnull=True).update(
        revoked_at=timezone.now(),
        revoked_reason="logout",
    )
    return count > 0


def change_user_password(
    user: AbstractBaseUser,
    old_password: str,
    new_password: str,
    current_session_id: UUID | None = None,
) -> None:
    """Validates old password, validates new password complexity, updates password,
    and revokes all other sessions.
    """
    if not user.check_password(old_password):
        raise exceptions.ValidationError({"old_password": ["Current password does not match."]})

    try:
        password_validation.validate_password(new_password, user=user)
    except DjangoValidationError as exc:
        raise exceptions.ValidationError({"new_password": list(exc.messages)}) from exc

    user.set_password(new_password)
    user.save()

    # Revoke all other sessions for this user
    other_sessions = UserSession.objects.filter(user=user, revoked_at__isnull=True)
    if current_session_id:
        other_sessions = other_sessions.exclude(id=current_session_id)
    other_sessions.update(revoked_at=timezone.now(), revoked_reason="password_change")

    logger.info("User %s changed password. All other sessions revoked.", user.id)
