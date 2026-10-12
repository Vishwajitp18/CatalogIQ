from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils import timezone

from apps.accounts.models import User, UserSession


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ("email", "full_name", "is_active", "is_staff", "date_joined")
    list_filter = ("is_active", "is_staff", "is_superuser")
    search_fields = ("email", "full_name")
    ordering = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name",)}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password", "full_name", "is_active", "is_staff"),
            },
        ),
    )


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "ip_address",
        "user_agent",
        "created_at",
        "last_used_at",
        "is_session_active",
        "revoked_at",
    )
    list_filter = ("revoked_at", "revoked_reason", "created_at")
    search_fields = ("user__email", "ip_address", "user_agent")
    readonly_fields = (
        "id",
        "user",
        "refresh_token_hash",
        "previous_token_hash",
        "rotated_at",
        "rotation_count",
        "user_agent",
        "ip_address",
        "created_at",
        "last_used_at",
        "expires_at",
        "absolute_expires_at",
        "revoked_at",
        "revoked_reason",
    )
    actions = ["revoke_selected_sessions"]

    @admin.display(boolean=True, description="Active")
    def is_session_active(self, obj):
        return obj.is_valid

    @admin.action(description="Revoke selected sessions")
    def revoke_selected_sessions(self, request, queryset):
        now = timezone.now()
        count = queryset.filter(revoked_at__isnull=True).update(
            revoked_at=now, revoked_reason="admin"
        )
        self.message_user(request, f"{count} sessions were revoked.")
