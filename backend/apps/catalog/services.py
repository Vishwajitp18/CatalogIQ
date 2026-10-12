from decimal import Decimal

from django.contrib.auth.models import AbstractBaseUser

from apps.catalog.models import Brand, Category, Product


def create_product(
    *,
    name: str,
    brand: Brand,
    category: Category,
    price: Decimal,
    stock: int = 0,
    description: str = "",
    image_url: str = "",
    tags: list[str] | None = None,
    created_by: AbstractBaseUser | None = None,
) -> Product:
    """Creates a new catalog product instance."""
    clean_tags = []
    if tags:
        seen = set()
        for t in tags:
            tag = str(t).strip().lower()
            if tag and tag not in seen:
                seen.add(tag)
                clean_tags.append(tag[:40])

    product = Product(
        name=name.strip(),
        brand=brand,
        category=category,
        price=price,
        stock=max(0, int(stock or 0)),
        description=description.strip(),
        image_url=image_url.strip(),
        tags=clean_tags[:10],
        created_by=created_by,
        is_active=True,
    )
    product.full_clean()
    product.save()
    return product


def update_product(
    product: Product,
    *,
    name: str | None = None,
    brand: Brand | None = None,
    category: Category | None = None,
    price: Decimal | None = None,
    stock: int | None = None,
    description: str | None = None,
    image_url: str | None = None,
    tags: list[str] | None = None,
) -> Product:
    """Updates fields on an existing product."""
    if name is not None:
        product.name = name.strip()
    if brand is not None:
        product.brand = brand
    if category is not None:
        product.category = category
    if price is not None:
        product.price = price
    if stock is not None:
        product.stock = max(0, int(stock))
    if description is not None:
        product.description = description.strip()
    if image_url is not None:
        product.image_url = image_url.strip()
    if tags is not None:
        clean_tags = []
        seen = set()
        for t in tags:
            tag = str(t).strip().lower()
            if tag and tag not in seen:
                seen.add(tag)
                clean_tags.append(tag[:40])
        product.tags = clean_tags[:10]

    product.full_clean()
    product.save()
    return product


def soft_delete_product(product: Product) -> None:
    """Performs an idempotent soft delete on the product."""
    if product.is_active:
        product.is_active = False
        product.save(update_fields=["is_active", "updated_at"])
