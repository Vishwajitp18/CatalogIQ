from typing import Any

from apps.genai.providers.base import LLMProvider


class FakeProvider(LLMProvider):
    """Deterministic offline provider for tests, CI, and keyless demoing."""

    def generate_json(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema_name: str,
        json_schema: dict[str, Any],
        timeout: float,
    ) -> dict[str, Any]:
        if schema_name == "ProductDescriptionOutput":
            return {
                "description": "Premium build with high reliability and modern design. Engineered for excellent everyday performance.",
                "tags": ["premium", "quality", "durable", "modern"],
            }
        elif schema_name == "SearchInterpretationOutput":
            # Extract basic keywords from the query
            words = [w.strip() for w in user_prompt.replace(",", " ").split() if len(w.strip()) > 2]
            return {
                "search_terms": words[:4],
                "brand": None,
                "category": None,
                "min_price": None,
                "max_price": None,
                "sort_by": "relevance",
            }

        return {}
