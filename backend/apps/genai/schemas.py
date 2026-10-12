from typing import Literal

from pydantic import BaseModel, Field


class ProductDescriptionOutput(BaseModel):
    """Pydantic schema for Feature A: Product description and tag generation."""

    description: str = Field(
        ...,
        min_length=10,
        max_length=1200,
        description="Factual, well-crafted marketing copy for the product.",
    )
    tags: list[str] = Field(
        default_factory=list,
        max_length=8,
        description="List of up to 8 relevant category or feature keywords.",
    )


class SearchInterpretationOutput(BaseModel):
    """Pydantic schema for Feature B: Natural-language query interpretation."""

    search_terms: list[str] = Field(
        default_factory=list,
        max_length=8,
        description="List of core product keywords or attributes extracted from the user query.",
    )
    brand: str | None = Field(
        default=None,
        description="Specific brand name if recognized from available catalog brands.",
    )
    category: str | None = Field(
        default=None,
        description="Specific category name if recognized from available catalog categories.",
    )
    min_price: float | None = Field(
        default=None,
        ge=0,
        description="Lower price bound in catalog currency (INR).",
    )
    max_price: float | None = Field(
        default=None,
        ge=0,
        description="Upper price bound in catalog currency (INR).",
    )
    sort_by: Literal["relevance", "price_asc", "price_desc", "newest", "name_asc"] = Field(
        default="relevance",
        description="Requested ordering direction.",
    )
