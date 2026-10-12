from decimal import Decimal, InvalidOperation

from django.db import connection
from django.db.models import Q, QuerySet
from rest_framework import exceptions

from apps.catalog.models import Product

ALLOWED_ORDERINGS = {
    "name",
    "-name",
    "price",
    "-price",
    "created_at",
    "-created_at",
}


def visible_products() -> QuerySet[Product]:
    """Base selector returning active products with brand and category pre-fetched."""
    return Product.objects.filter(is_active=True).select_related("brand", "category")


def apply_search(qs: QuerySet[Product], search_text: str | None) -> QuerySet[Product]:
    """Applies multi-term whitespace-split AND search across name, description, brand, category, tags.
    Sanitizes length: max 200 chars, max 8 terms.
    """
    if not search_text:
        return qs

    clean_text = search_text.strip()[:200]
    terms = [term.strip() for term in clean_text.split() if term.strip()][:8]

    is_sqlite = connection.vendor == "sqlite"
    for term in terms:
        lower_term = term.lower()
        tag_q = Q(tags__icontains=lower_term) if is_sqlite else Q(tags__contains=[lower_term])
        term_q = (
            Q(name__icontains=term)
            | Q(description__icontains=term)
            | Q(brand__name__icontains=term)
            | Q(category__name__icontains=term)
            | tag_q
        )
        qs = qs.filter(term_q)

    return qs


def apply_price_filter(
    qs: QuerySet[Product],
    min_price_val: str | float | Decimal | None = None,
    max_price_val: str | float | Decimal | None = None,
) -> QuerySet[Product]:
    """Applies inclusive price bounds validation and filtering."""
    min_p: Decimal | None = None
    max_p: Decimal | None = None

    if min_price_val is not None and str(min_price_val).strip() != "":
        try:
            min_p = Decimal(str(min_price_val).strip())
            if min_p < 0:
                raise exceptions.ValidationError(
                    {"min_price": ["min_price must be greater than or equal to 0."]}
                )
        except (InvalidOperation, ValueError) as exc:
            raise exceptions.ValidationError({"min_price": ["Invalid decimal number."]}) from exc

    if max_price_val is not None and str(max_price_val).strip() != "":
        try:
            max_p = Decimal(str(max_price_val).strip())
            if max_p < 0:
                raise exceptions.ValidationError(
                    {"max_price": ["max_price must be greater than or equal to 0."]}
                )
        except (InvalidOperation, ValueError) as exc:
            raise exceptions.ValidationError({"max_price": ["Invalid decimal number."]}) from exc

    if min_p is not None and max_p is not None and max_p < min_p:
        raise exceptions.ValidationError(
            {"max_price": ["max_price must be greater than or equal to min_price."]}
        )

    if min_p is not None:
        qs = qs.filter(price__gte=min_p)
    if max_p is not None:
        qs = qs.filter(price__lte=max_p)

    return qs


def apply_ordering(qs: QuerySet[Product], ordering_param: str | None = None) -> QuerySet[Product]:
    """Applies allow-listed ordering with deterministic id tiebreaker."""
    if not ordering_param:
        ordering_param = "-created_at"

    ordering_param = ordering_param.strip()
    if ordering_param not in ALLOWED_ORDERINGS:
        allowed = ", ".join(sorted(ALLOWED_ORDERINGS))
        raise exceptions.ValidationError(
            {"ordering": [f"Invalid ordering '{ordering_param}'. Allowed values: {allowed}."]}
        )

    return qs.order_by(ordering_param, "id")
