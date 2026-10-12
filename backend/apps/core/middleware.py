import logging
import re
import time
import uuid

from apps.core.logging import set_current_request_id

logger = logging.getLogger("apps.core.access")
VALID_REQUEST_ID_REGEX = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")


class RequestIDMiddleware:
    """Extracts or generates an X-Request-ID and binds it to contextvars and response header."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        incoming_id = request.META.get("HTTP_X_REQUEST_ID", "").strip()
        if incoming_id and VALID_REQUEST_ID_REGEX.match(incoming_id):
            req_id = incoming_id
        else:
            req_id = uuid.uuid4().hex

        request.request_id = req_id
        set_current_request_id(req_id)

        response = self.get_response(request)
        response["X-Request-ID"] = req_id
        return response


class AccessLogMiddleware:
    """Logs HTTP request details, latency, and status code."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.monotonic()
        response = self.get_response(request)
        duration_ms = round((time.monotonic() - start_time) * 1000, 2)

        user_id = "-"
        if hasattr(request, "user") and request.user.is_authenticated:
            user_id = str(request.user.pk)

        req_id = getattr(request, "request_id", "-")

        # Skip spamming logs on health checks if healthy
        if request.path.startswith("/api/health/") and response.status_code == 200:
            return response

        logger.info(
            "HTTP %s %s -> %s (%sms) user=%s req_id=%s",
            request.method,
            request.get_full_path(),
            response.status_code,
            duration_ms,
            user_id,
            req_id,
            extra={
                "method": request.method,
                "path": request.get_full_path(),
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "user_id": user_id,
                "request_id": req_id,
            },
        )
        return response
