from typing import Any, Protocol


class ProviderError(Exception):
    """Base error for LLM providers."""

    pass


class ProviderNotConfigured(ProviderError):
    """Raised when an AI provider is requested but its API key or configuration is missing."""

    pass


class ProviderUnavailable(ProviderError):
    """Raised on provider timeout, network error, rate limit, or 5xx outage."""

    pass


class ProviderBadOutput(ProviderError):
    """Raised when the provider produces malformed or non-JSON output."""

    pass


class LLMProvider(Protocol):
    """Protocol for LLM adapters returning structured JSON."""

    def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema_name: str,
        json_schema: dict[str, Any],
        timeout: float,
    ) -> dict[str, Any]:
        """Calls the model and returns parsed JSON dictionary."""
        ...
