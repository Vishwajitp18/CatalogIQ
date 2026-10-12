from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import UserSession
from apps.accounts.services.sessions import create_user_session
from tests.factories import UserFactory


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
class TestAuthenticationAndSessions:
    def test_register_success(self, client):
        payload = {
            "email": "NewUser@CatalogIQ.com",
            "password": "StrongPassword123!",
            "full_name": "Test User",
        }
        res = client.post("/api/v1/auth/register/", payload)
        assert res.status_code == 201
        data = res.json()
        assert "access" in data
        assert "refresh" in data
        assert data["user"]["email"] == "newuser@catalogiq.com"
        assert "password" not in data["user"]
        # Session was persisted
        assert UserSession.objects.filter(user__email="newuser@catalogiq.com").exists()

    def test_register_duplicate_email_case_insensitive(self, client):
        UserFactory(email="existing@catalogiq.com")
        payload = {
            "email": "EXISTING@catalogiq.com",
            "password": "StrongPassword123!",
        }
        res = client.post("/api/v1/auth/register/", payload)
        assert res.status_code == 400
        assert res.json()["error"]["code"] == "validation_error"

    def test_login_success(self, client):
        user = UserFactory(email="shopper@catalogiq.com")
        res = client.post(
            "/api/v1/auth/login/",
            {"email": "SHOPPER@catalogiq.com", "password": "ValidPassword123!"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "access" in data
        assert "refresh" in data
        assert data["user"]["id"] == user.id

    def test_login_invalid_password(self, client):
        UserFactory(email="shopper@catalogiq.com")
        res = client.post(
            "/api/v1/auth/login/", {"email": "shopper@catalogiq.com", "password": "WrongPassword!"}
        )
        assert res.status_code == 401
        assert res.json()["error"]["code"] == "invalid_credentials"

    def test_me_endpoint_with_session_jwt(self, client):
        user = UserFactory()
        session, access, _ = create_user_session(user)

        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        res = client.get("/api/v1/auth/me/")
        assert res.status_code == 200
        assert res.json()["email"] == user.email

    def test_instant_revocation_on_deactivated_user(self, client):
        user = UserFactory(is_active=True)
        session, access, _ = create_user_session(user)

        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        res = client.get("/api/v1/auth/me/")
        assert res.status_code == 200

        # Deactivate user
        user.is_active = False
        user.save()

        # Immediate rejection on next request
        res = client.get("/api/v1/auth/me/")
        assert res.status_code == 401

    def test_token_rotation_flow(self, client):
        user = UserFactory()
        session, access, refresh = create_user_session(user)

        # Refresh
        res = client.post("/api/v1/auth/refresh/", {"refresh": refresh})
        assert res.status_code == 200
        new_tokens = res.json()
        assert "access" in new_tokens
        assert "refresh" in new_tokens
        assert new_tokens["refresh"] != refresh

        # New access token works
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {new_tokens['access']}")
        assert client.get("/api/v1/auth/me/").status_code == 200

    def test_refresh_token_reuse_theft_detection(self, client):
        user = UserFactory()
        session, access, refresh_1 = create_user_session(user)

        # First legitimate rotation
        res = client.post("/api/v1/auth/refresh/", {"refresh": refresh_1})
        assert res.status_code == 200
        refresh_2 = res.json()["refresh"]

        # Simulate time passing past grace period (e.g. 15 seconds)
        session.refresh_from_db()
        session.rotated_at = timezone.now() - timedelta(seconds=15)
        session.save()

        # Attacker/stale client presents old refresh_1
        res_theft = client.post("/api/v1/auth/refresh/", {"refresh": refresh_1})
        assert res_theft.status_code == 401
        assert res_theft.json()["error"]["code"] == "session_revoked"

        # Session was permanently revoked
        session.refresh_from_db()
        assert session.revoked_at is not None
        assert session.revoked_reason == "reuse_detected"

        # Even the newer tokens stop working immediately!
        res_new_refresh = client.post("/api/v1/auth/refresh/", {"refresh": refresh_2})
        assert res_new_refresh.status_code == 401

    def test_logout_revokes_session_immediately(self, client):
        user = UserFactory()
        session, access, refresh = create_user_session(user)

        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        assert client.get("/api/v1/auth/me/").status_code == 200

        # Logout
        res_logout = client.post("/api/v1/auth/logout/", {"refresh": refresh})
        assert res_logout.status_code == 204

        # Access token is immediately revoked
        assert client.get("/api/v1/auth/me/").status_code == 401

    def test_user_sessions_management(self, client):
        user = UserFactory()
        s1, a1, _ = create_user_session(user)
        s2, a2, _ = create_user_session(user)

        client.credentials(HTTP_AUTHORIZATION=f"Bearer {a1}")
        res = client.get("/api/v1/auth/sessions/")
        assert res.status_code == 200
        sessions_list = res.json()
        assert len(sessions_list) == 2

        # Check is_current flag
        current_entry = next(s for s in sessions_list if s["id"] == str(s1.id))
        other_entry = next(s for s in sessions_list if s["id"] == str(s2.id))
        assert current_entry["is_current"] is True
        assert other_entry["is_current"] is False

        # Revoke other session
        res_del = client.delete(f"/api/v1/auth/sessions/{s2.id}/")
        assert res_del.status_code == 204

        # Other session's access token is dead
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {a2}")
        assert client.get("/api/v1/auth/me/").status_code == 401

    def test_password_change_flow(self, client):
        user = UserFactory()
        s1, a1, _ = create_user_session(user)
        s2, a2, _ = create_user_session(user)

        client.credentials(HTTP_AUTHORIZATION=f"Bearer {a1}")
        res = client.post(
            "/api/v1/auth/password/change/",
            {"old_password": "ValidPassword123!", "new_password": "NewSecretPassword99!"},
        )
        assert res.status_code == 204

        # Current session remains active
        assert client.get("/api/v1/auth/me/").status_code == 200

        # Other session was revoked
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {a2}")
        assert client.get("/api/v1/auth/me/").status_code == 401
