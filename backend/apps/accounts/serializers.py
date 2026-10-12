from django.contrib.auth import authenticate, get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import exceptions, serializers

from apps.accounts.models import UserSession

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Public safe representation of a user profile with role information."""

    role = serializers.CharField(read_only=True)
    is_admin = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "role",
            "is_admin",
            "is_staff",
            "is_superuser",
            "date_joined",
        ]
        read_only_fields = fields



class RegisterSerializer(serializers.Serializer):
    """User registration serializer."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=150)

    def validate_email(self, value: str) -> str:
        clean_email = value.lower().strip()
        if User.objects.filter(email__iexact=clean_email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return clean_email

    def validate_password(self, value: str) -> str:
        try:
            password_validation.validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data.get("full_name", ""),
        )


class LoginSerializer(serializers.Serializer):
    """Credentials verification serializer."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        email = attrs.get("email", "").lower().strip()
        password = attrs.get("password")

        user = authenticate(request=self.context.get("request"), email=email, password=password)
        if not user:
            # Same generic message for security
            raise exceptions.AuthenticationFailed(
                detail={"code": "invalid_credentials", "message": "Invalid email or password."},
                code="invalid_credentials",
            )
        if not user.is_active:
            raise exceptions.AuthenticationFailed(
                detail={"code": "user_inactive", "message": "This account is disabled."},
                code="user_inactive",
            )

        attrs["user"] = user
        return attrs


class TokenRefreshSerializer(serializers.Serializer):
    """Rotates refresh token and returns a new access/refresh pair."""

    refresh = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    """Revokes session associated with the provided refresh token."""

    refresh = serializers.CharField()


class PasswordChangeSerializer(serializers.Serializer):
    """Verifies existing password and sets a new password."""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)


class UserSessionSerializer(serializers.ModelSerializer):
    """Device session representation."""

    is_current = serializers.SerializerMethodField()

    class Meta:
        model = UserSession
        fields = [
            "id",
            "user_agent",
            "ip_address",
            "created_at",
            "last_used_at",
            "is_current",
        ]
        read_only_fields = fields

    def get_is_current(self, obj: UserSession) -> bool:
        request = self.context.get("request")
        if not request:
            return False
        current_sid = getattr(request, "auth_session_id", None)
        return str(obj.id) == str(current_sid)
