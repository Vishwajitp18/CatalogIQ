import hashlib
import secrets

from rest_framework_simplejwt.tokens import AccessToken

from apps.accounts.models import UserSession


def generate_refresh_token() -> str:
    """Generates an opaque cryptographic random URL-safe refresh token string."""
    return secrets.token_urlsafe(48)


def hash_token(raw_token: str) -> str:
    """Computes SHA-256 hexadecimal hash of a token string."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def create_access_token_for_session(session: UserSession) -> str:
    """Creates a short-lived signed JWT access token embedding user_id and sid (session id)."""
    token = AccessToken()
    token["user_id"] = session.user.id
    token["sid"] = str(session.id)
    return str(token)
