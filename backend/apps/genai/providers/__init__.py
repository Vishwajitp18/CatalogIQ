from django.conf import settings

from apps.genai.providers.base import LLMProvider, ProviderNotConfigured
from apps.genai.providers.fake import FakeProvider
from apps.genai.providers.groq import GroqProvider
from apps.genai.providers.openai import OpenAIProvider


def get_provider() -> LLMProvider:
    """Factory creating configured LLMProvider based on settings.AI_PROVIDER."""
    provider_name = getattr(settings, "AI_PROVIDER", "groq").lower().strip()

    if provider_name == "fake":
        return FakeProvider()
    elif provider_name == "groq":
        return GroqProvider()
    elif provider_name == "openai":
        return OpenAIProvider()
    else:
        raise ProviderNotConfigured(
            f"Unsupported AI_PROVIDER: '{provider_name}'. Supported: groq, openai, fake."
        )
