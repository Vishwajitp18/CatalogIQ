from decimal import Decimal, InvalidOperation
from typing import Any

from django.db import connection
from django.db.models import Avg, Count, Max, Min, Q, QuerySet
from rest_framework import exceptions

from apps.catalog.models import Brand, Category, Product

ALLOWED_ORDERINGS = {
    "name",
    "-name",
    "price",
    "-price",
    "created_at",
    "-created_at",
}


def visible_products() -> QuerySet[Product]:
    """Base selector returning active products with brand, category, and creator pre-fetched."""
    return Product.objects.filter(is_active=True).select_related("brand", "category", "created_by")



COMMON_SYNONYMS: dict[str, list[str]] = {
    "laptop": ["notebook"],
    "laptops": ["notebooks"],
    "notebook": ["laptop"],
    "notebooks": ["laptops"],
    "sneaker": ["shoe", "running", "footwear"],
    "sneakers": ["shoes", "running", "footwear"],
    "shoe": ["sneaker", "footwear"],
    "shoes": ["sneakers", "footwear"],
    "earphone": ["earbud"],
    "earphones": ["earbuds"],
    "earbud": ["earphone"],
    "earbuds": ["earphones"],
    "headphone": ["headset"],
    "headphones": ["headsets"],
    "watch": ["smartwatch"],
    "watches": ["smartwatches"],
    "smartwatch": ["watch"],
    "smartwatches": ["watches"],
    "mouse": ["mice"],
    "mice": ["mouse"],
    "keyboard": ["keypad"],
    "keyboards": ["keypads"],
    "hoodie": ["pullover", "sweatshirt"],
    "hoodies": ["pullovers", "sweatshirts"],
    "tee": ["t-shirt", "tshirt", "shirt"],
    "tees": ["t-shirt", "tshirt", "shirts"],
    "shirt": ["t-shirt", "tshirt", "tee"],
    "shirts": ["t-shirt", "tshirt", "tees"],
}


def get_term_variants(term: str) -> set[str]:
    """Generates singular/plural and synonym variants for a search term."""
    lower = term.lower().strip()
    variants = {term, lower}
    if lower.endswith("ies") and len(lower) > 4:
        variants.add(lower[:-3] + "y")
    elif lower.endswith("es") and len(lower) > 3:
        variants.add(lower[:-2])
    elif lower.endswith("s") and len(lower) > 2 and not lower.endswith("ss"):
        variants.add(lower[:-1])
    else:
        variants.add(lower + "s")

    for v in list(variants):
        if v in COMMON_SYNONYMS:
            variants.update(COMMON_SYNONYMS[v])

    return {v for v in variants if v}


def _build_term_q(term: str, is_sqlite: bool) -> Q:
    variants = get_term_variants(term)
    combined = Q()
    for v in variants:
        tag_q = Q(tags__icontains=v) if is_sqlite else Q(tags__contains=[v])
        combined |= (
            Q(name__icontains=v)
            | Q(description__icontains=v)
            | Q(brand__name__icontains=v)
            | Q(category__name__icontains=v)
            | tag_q
        )
    return combined


def apply_search(qs: QuerySet[Product], search_text: str | None) -> QuerySet[Product]:
    """Applies multi-term search with variant and synonym expansion across name, description, brand, category, tags.
    If strict AND across all terms yields 0 results, gracefully relaxes to an OR search across terms.
    Sanitizes length: max 200 chars, max 8 terms.
    """
    if not search_text:
        return qs

    clean_text = search_text.strip()[:200]
    terms = [term.strip() for term in clean_text.split() if term.strip()][:8]
    if not terms:
        return qs

    is_sqlite = connection.vendor == "sqlite"

    # 1. Try conjunction (AND) across all terms
    and_qs = qs
    for term in terms:
        and_qs = and_qs.filter(_build_term_q(term, is_sqlite))

    if and_qs.exists() or len(terms) == 1:
        return and_qs

    # 2. If multi-term AND returns 0 (e.g. 'mouse and keyboard'), relax to disjunction (OR)
    or_q = Q()
    for term in terms:
        or_q |= _build_term_q(term, is_sqlite)

    return qs.filter(or_q)


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
 
 
def get_catalog_stats(qs: QuerySet[Product] | None = None) -> dict[str, Any]:
    """Aggregates catalog statistics directly from the database using SQL aggregations.
    Computes total products, brand count, category count, average price, min/max price,
    and count of AI-tagged products.
    """
    if qs is None:
        qs = visible_products()

    is_sqlite = connection.vendor == "sqlite"
    tag_q = Q(tags__icontains='"') if is_sqlite else (~Q(tags=[]) & ~Q(tags__isnull=True))

    agg = qs.aggregate(
        total_products=Count("id"),
        avg_price=Avg("price"),
        min_price=Min("price"),
        max_price=Max("price"),
        ai_tagged_count=Count("id", filter=tag_q),
    )

    total_products = agg["total_products"] or 0
    total_brands = qs.values("brand").distinct().count() if total_products > 0 else 0
    total_categories = qs.values("category").distinct().count() if total_products > 0 else 0

    avg_p = round(float(agg["avg_price"]), 2) if agg["avg_price"] is not None else 0.0
    min_p = round(float(agg["min_price"]), 2) if agg["min_price"] is not None else 0.0
    max_p = round(float(agg["max_price"]), 2) if agg["max_price"] is not None else 0.0

    return {
        "total_products": total_products,
        "total_brands": total_brands,
        "total_categories": total_categories,
        "avg_price": avg_p,
        "min_price": min_p,
        "max_price": max_p,
        "ai_tagged_count": agg["ai_tagged_count"] or 0,
        "catalog_total_products": Product.objects.filter(is_active=True).count(),
        "catalog_total_brands": Brand.objects.count(),
        "catalog_total_categories": Category.objects.count(),
    }
