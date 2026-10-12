import contextvars
import logging

request_id_ctx = contextvars.ContextVar("request_id", default="")


def get_current_request_id() -> str:
    return request_id_ctx.get()


def set_current_request_id(req_id: str) -> None:
    request_id_ctx.set(req_id)


class RequestIDFilter(logging.Filter):
    """Logging filter that attaches the active request_id to log records."""

    def filter(self, record):
        record.request_id = get_current_request_id() or "-"
        return True
