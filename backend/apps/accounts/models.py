import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone

from apps.accounts.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model where email is the primary identity."""

    email = models.EmailField(max_length=255, unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        constraints = [
            models.UniqueConstraint(Lower("email"), name="accounts_user_email_ci_unq"),
        ]

    def __str__(self) -> str:
        return self.email

    def clean(self):
        super().clean()
        if self.email:
            self.email = self.email.lower().strip()

    @property
    def role(self) -> str:
        return "admin" if (self.is_staff or self.is_superuser) else "user"

    @property
    def is_admin(self) -> bool:
        return bool(self.is_staff or self.is_superuser)


class UserSession(models.Model):
    """Persisted refresh session tracking tokens, rotation, theft detection, and active devices."""

    REVOKED_REASON_CHOICES = [
        ("logout", "User Logout"),
        ("logout_all", "Logout All Devices"),
        ("reuse_detected", "Token Reuse Detected (Theft)"),
        ("password_change", "Password Changed"),
        ("admin", "Admin Revocation"),
        ("user_inactive", "User Deactivated"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sessions"
    )
    refresh_token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    previous_token_hash = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    rotated_at = models.DateTimeField(null=True, blank=True)
    rotation_count = models.IntegerField(default=0)
    user_agent = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    absolute_expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_reason = models.CharField(max_length=32, blank=True, choices=REVOKED_REASON_CHOICES)

    class Meta:
        indexes = [
            models.Index(fields=["user", "revoked_at"]),
            models.Index(fields=["expires_at"]),
        ]
        ordering = ["-last_used_at"]

    def __str__(self) -> str:
        return f"Session {self.id} for {self.user.email} (Active: {self.is_valid})"

    @property
    def is_valid(self) -> bool:
        """Returns True if the session is not revoked and within both idle and absolute expirations."""
        now = timezone.now()
        return self.revoked_at is None and now < self.expires_at and now < self.absolute_expires_at
