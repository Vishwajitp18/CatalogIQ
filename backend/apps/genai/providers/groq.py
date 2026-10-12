import json
import logging
from typing import Any

import groq
from django.conf import settings

from apps.genai.providers.base import (
    LLMProvider,
    ProviderBadOutput,
    ProviderNotConfigured,
    ProviderUnavailable,
)

logger = logging.getLogger("apps.genai.groq")


class GroqProvider(LLMProvider):
    """Groq API provider utilizing ultra-fast LPU inference and JSON object format."""

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or getattr(settings, "GROQ_API_KEY", "")
        if not self.api_key:
            raise ProviderNotConfigured("GROQ_API_KEY is not configured.")
        self.model = model or getattr(settings, "GROQ_MODEL", "qwen/qwen3.8-27b")
        self.client = groq.Groq(api_key=self.api_key)

    def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema_name: str,
        json_schema: dict[str, Any],
        timeout: float,
    ) -> dict[str, Any]:
        prompt_with_schema = (
            f"{system_prompt}\n\n"
            f"You MUST output valid JSON matching this JSON schema:\n"
            f"{json.dumps(json_schema, indent=2)}\n"
            f"Output ONLY the JSON object and nothing else."
        )

        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": prompt_with_schema},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                timeout=timeout,
            )

            raw_content = completion.choices[0].message.content
            if not raw_content or not raw_content.strip():
                raise ProviderBadOutput("Received empty response from Groq.")

            return json.loads(raw_content)

        except (
            groq.APITimeoutError,
            groq.APIConnectionError,
            groq.RateLimitError,
            groq.InternalServerError,
        ) as exc:
            logger.error("Groq provider unavailable: %s", exc)
            raise ProviderUnavailable(f"Groq service unavailable: {exc}") from exc
        except groq.APIError as exc:
            logger.error("Groq API error: %s", exc)
            raise ProviderUnavailable(f"Groq API error: {exc}") from exc
        except json.JSONDecodeError as exc:
            logger.error("Groq returned non-JSON output: %s", exc)
            raise ProviderBadOutput("Model output could not be parsed as JSON.") from exc
