import logging
from typing import Any

from django.core.exceptions import PermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler

from apps.core.logging import get_current_request_id

logger = logging.getLogger("apps.core.exceptions")


class APIApplicationError(exceptions.APIException):
    """Base class for custom application errors with specific codes."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "bad_request"
    default_detail = "An error occurred."

    def __init__(
        self, message: str | None = None, code: str | None = None, status_code: int | None = None
    ):
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.default_code = code
        super().__init__(detail=message or self.default_detail, code=code or self.default_code)


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """Produces the standardized error envelope for all non-2xx responses:
    {
      "error": {
        "code": "validation_error",
        "message": "Human readable message",
        "details": { ... }, # optional, validation only
        "request_id": "..."
      }
    }
    """
    request = context.get("request")
    req_id = getattr(request, "request_id", "") if request else get_current_request_id() or "-"

    # Translate Django core exceptions
    if isinstance(exc, DjangoValidationError):
        exc = exceptions.ValidationError(
            detail=exc.message_dict if hasattr(exc, "message_dict") else exc.messages
        )
    elif isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied()

    # Call DRF's default exception handler to get the base response
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled 500 Internal Server Error
        logger.exception("Unhandled server exception: %s", exc, extra={"request_id": req_id})
        return Response(
            {
                "error": {
                    "code": "internal_error",
                    "message": "An unexpected server error occurred.",
                    "request_id": req_id,
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            headers={"X-Request-ID": req_id},
        )

    # Determine error code and message
    error_code = "error"
    error_message = "An error occurred."
    details = None

    if isinstance(exc, exceptions.ValidationError):
        error_code = "validation_error"
        error_message = "Invalid input."
        details = response.data
    elif isinstance(exc, exceptions.AuthenticationFailed | exceptions.NotAuthenticated):
        response.status_code = status.HTTP_401_UNAUTHORIZED
        error_code = (
            getattr(exc, "detail", {}).get("code", "not_authenticated")
            if isinstance(getattr(exc, "detail", None), dict)
            else getattr(exc, "code", "not_authenticated")
        )
        if error_code == "not_authenticated" and isinstance(exc, exceptions.AuthenticationFailed):
            error_code = "invalid_credentials"
        error_message = str(exc.detail) if isinstance(exc.detail, str) else "Authentication failed."
    elif isinstance(exc, exceptions.PermissionDenied):
        error_code = "permission_denied"
        error_message = (
            str(exc.detail)
            if isinstance(exc.detail, str)
            else "You do not have permission to perform this action."
        )
    elif isinstance(exc, exceptions.NotFound):
        error_code = "not_found"
        error_message = str(exc.detail) if isinstance(exc.detail, str) else "Resource not found."
    elif isinstance(exc, exceptions.Throttled):
        error_code = "throttled"
        wait = exc.wait
        error_message = (
            f"Request was throttled. Expected available in {wait} seconds."
            if wait
            else "Request was throttled."
        )
    elif isinstance(exc, APIApplicationError):
        error_code = exc.default_code
        error_message = str(exc.detail)
    elif hasattr(exc, "default_code"):
        error_code = exc.default_code
        error_message = str(exc.detail) if isinstance(exc.detail, str) else str(exc)

    payload: dict[str, Any] = {
        "error": {
            "code": error_code,
            "message": error_message,
            "request_id": req_id,
        }
    }
    if details is not None:
        payload["error"]["details"] = details

    response.data = payload
    response["X-Request-ID"] = req_id
    return response
