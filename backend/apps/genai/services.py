import logging
from typing import Any

from django.conf import settings
from pydantic import ValidationError as PydanticValidationError

from apps.catalog.models import Brand, Category
from apps.catalog.selectors import (
    apply_ordering,
    apply_price_filter,
    apply_search,
    visible_products,
)
from apps.catalog.serializers import BrandSerializer, CategorySerializer, ProductReadSerializer
from apps.genai.prompts import (
    build_description_system_prompt,
    build_description_user_prompt,
    build_search_system_prompt,
    build_search_user_prompt,
)
from apps.genai.providers import get_provider
from apps.genai.providers.base import ProviderBadOutput
from apps.genai.schemas import ProductDescriptionOutput, SearchInterpretationOutput

logger = logging.getLogger("apps.genai.services")


def generate_description_draft(
    *,
    name: str,
    brand: str,
    category: str,
    key_features: list[str] | None = None,
    tone: str = "professional",
) -> dict[str, Any]:
    """Generates an editable product description and tag list draft.
    Does NOT write anything to the database.
    """
    provider = get_provider()
    timeout = getattr(settings, "AI_TIMEOUT_SECONDS", 15.0)

    system_prompt = build_description_system_prompt(tone=tone)
    user_prompt = build_description_user_prompt(
        name=name,
        brand=brand,
        category=category,
        key_features=key_features,
    )

    raw_json = provider.generate_json(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        schema_name="ProductDescriptionOutput",
        json_schema=ProductDescriptionOutput.model_json_schema(),
        timeout=timeout,
    )

    try:
        validated = ProductDescriptionOutput.model_validate(raw_json)
    except PydanticValidationError as exc:
        logger.error("Failed to validate product description output: %s", exc)
        raise ProviderBadOutput(f"Model output schema validation failed: {exc}") from exc

    # Sanitize and deduplicate tags
    cleaned_tags = []
    seen = set()
    for t in validated.tags:
        tag = str(t).strip().lower()
        if tag and tag not in seen:
            seen.add(tag)
            cleaned_tags.append(tag[:40])

    return {
        "description": validated.description.strip(),
        "tags": cleaned_tags[:8],
    }


def run_natural_language_search(query: str, limit: int = 20) -> dict[str, Any]:
    """Interprets natural language query with LLM, normalizes parameters against the DB,
    and executes via standard ORM selectors. Zero raw SQL executed.
    """
    provider = get_provider()
    timeout = getattr(settings, "AI_TIMEOUT_SECONDS", 15.0)

    # Allow-list existing brands and categories (capped at 200 each)
    brand_names = list(Brand.objects.values_list("name", flat=True)[:200])
    category_names = list(Category.objects.values_list("name", flat=True)[:200])

    system_prompt = build_search_system_prompt(brand_names, category_names)
    user_prompt = build_search_user_prompt(query)

    raw_json = provider.generate_json(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        schema_name="SearchInterpretationOutput",
        json_schema=SearchInterpretationOutput.model_json_schema(),
        timeout=timeout,
    )

    try:
        interp = SearchInterpretationOutput.model_validate(raw_json)
    except PydanticValidationError as exc:
        logger.error("Failed to validate search interpretation output: %s", exc)
        raise ProviderBadOutput(f"Search interpretation schema validation failed: {exc}") from exc

    GENERIC_QUERY_STOPWORDS = {
        "gadget",
        "gadgets",
        "device",
        "devices",
        "gear",
        "item",
        "items",
        "thing",
        "things",
        "product",
        "products",
        "stuff",
        "tech",
        "technology",
        "model",
        "models",
        "option",
        "options",
        "lineup",
        "collection",
        "accessories",
        "accessory",
        "peripheral",
        "peripherals",
        "electronics",
        "show",
        "find",
        "me",
        "buy",
        "cheapest",
        "expensive",
        "best",
        "good",
        "all",
    }

    notes: list[str] = []
    # Filter out generic filler words from extracted search terms
    search_terms = [
        t.strip()
        for t in interp.search_terms
        if t.strip() and t.strip().lower() not in GENERIC_QUERY_STOPWORDS
    ]

    # 1. Resolve Brand
    brand_obj: Brand | None = None
    if interp.brand:
        clean_brand = interp.brand.strip()
        brand_obj = Brand.objects.filter(name__iexact=clean_brand).first()
        if not brand_obj:
            brand_obj = Brand.objects.filter(name__icontains=clean_brand).first()
        if not brand_obj and clean_brand.lower() not in GENERIC_QUERY_STOPWORDS:
            notes.append(f"Brand '{interp.brand}' not recognized; searched as keyword.")
            search_terms.append(clean_brand)

    # 2. Resolve Category
    category_obj: Category | None = None
    if interp.category:
        clean_cat = interp.category.strip()
        category_obj = Category.objects.filter(name__iexact=clean_cat).first()
        if not category_obj:
            category_obj = Category.objects.filter(name__icontains=clean_cat).first()
        if not category_obj and clean_cat.lower() not in GENERIC_QUERY_STOPWORDS:
            notes.append(f"Category '{interp.category}' not recognized; searched as keyword.")
            search_terms.append(clean_cat)

    # 3. Price validation & normalization
    min_price = interp.min_price
    max_price = interp.max_price
    if min_price is not None and max_price is not None and min_price > max_price:
        notes.append(f"Inverted price range ({min_price} > {max_price}) ignored.")
        min_price = None
        max_price = None

    # 4. Map sort order
    sort_mapping = {
        "price_asc": "price",
        "price_desc": "-price",
        "newest": "-created_at",
        "name_asc": "name",
        "relevance": "-created_at",
    }
    ordering = sort_mapping.get(interp.sort_by, "-created_at")

    # 5. Execute via shared ORM selector
    base_qs = visible_products()

    if brand_obj:
        base_qs = base_qs.filter(brand=brand_obj)

    if category_obj:
        base_qs = base_qs.filter(category=category_obj)

    base_qs = apply_price_filter(base_qs, min_price, max_price)
    base_qs = apply_ordering(base_qs, ordering)

    qs = base_qs
    if search_terms:
        qs = apply_search(qs, " ".join(search_terms))

    bounded_limit = min(max(1, limit), 50)
    matched_products = list(qs[:bounded_limit])

    # 6. Production-grade relaxed semantic fallback:
    # If search_terms yielded 0 items, but the shopper's criteria (brand, category, and/or price) has matching products:
    if not matched_products and search_terms and (brand_obj or category_obj or min_price is not None or max_price is not None):
        fallback_products = list(base_qs[:bounded_limit])
        if fallback_products:
            matched_products = fallback_products
            terms_display = ", ".join(f"'{t}'" for t in search_terms)
            scope = brand_obj.name if brand_obj else (category_obj.name if category_obj else "catalog")
            notes.append(
                f"Relaxed keyword search: No exact match for {terms_display}. Showing {scope} products matching your filters."
            )

    if not matched_products:
        notes.append("No exact catalog matches found for the interpreted criteria.")

    return {
        "query": query,
        "interpretation": {
            "search_terms": search_terms,
            "brand": BrandSerializer(brand_obj).data if brand_obj else None,
            "category": CategorySerializer(category_obj).data if category_obj else None,
            "min_price": f"{min_price:.2f}" if min_price is not None else None,
            "max_price": f"{max_price:.2f}" if max_price is not None else None,
            "sort_by": interp.sort_by,
            "notes": notes,
        },
        "count": len(matched_products),
        "results": ProductReadSerializer(matched_products, many=True).data,
    }
