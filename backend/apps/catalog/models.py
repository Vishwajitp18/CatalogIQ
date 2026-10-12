import json
import uuid
from decimal import Decimal

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models.functions import Lower
from django.utils.text import slugify

from apps.core.models import TimeStampedModel


class CompatibleArrayField(ArrayField):
    """Subclass of PostgreSQL ArrayField that safely degrades to JSON/Text on SQLite for fast unit testing."""

    def db_type(self, connection):
        if connection.vendor == "sqlite":
            return "text"
        return super().db_type(connection)

    def cast_db_type(self, connection):
        if connection.vendor == "sqlite":
            return "text"
        return super().cast_db_type(connection)

    def get_placeholder(self, value, compiler, connection):
        if connection.vendor == "sqlite":
            return "%s"
        return super().get_placeholder(value, compiler, connection)

    def get_db_prep_value(self, value, connection, prepared=False):
        if connection.vendor == "sqlite":
            if value is None:
                return None
            return json.dumps(value)
        return super().get_db_prep_value(value, connection, prepared=prepared)

    def from_db_value(self, value, expression, connection):
        if connection.vendor == "sqlite":
            if value is None:
                return []
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except Exception:
                    return [v.strip() for v in value.strip("{}").split(",") if v.strip()]
        return value


class Brand(TimeStampedModel):
    """Product Brand entity with case-insensitive unique name and auto-generated slug."""

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(Lower("name"), name="catalog_brand_name_ci_unq"),
        ]

    def __str__(self) -> str:
        return self.name

    def clean(self):
        super().clean()
        if self.name:
            self.name = self.name.strip()

    def save(self, *args, **kwargs):
        if self.name:
            self.name = self.name.strip()
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Brand.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Category(TimeStampedModel):
    """Product Category entity with case-insensitive unique name and auto-generated slug."""

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Categories"
        constraints = [
            models.UniqueConstraint(Lower("name"), name="catalog_category_name_ci_unq"),
        ]

    def __str__(self) -> str:
        return self.name

    def clean(self):
        super().clean()
        if self.name:
            self.name = self.name.strip()

    def save(self, *args, **kwargs):
        if self.name:
            self.name = self.name.strip()
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Product(TimeStampedModel):
    """Product catalog item with UUID, soft delete, decimal price, and reviewable tags."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name="products")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    image_url = models.URLField(max_length=2048, blank=True, default="")
    tags = CompatibleArrayField(
        models.CharField(max_length=40),
        size=10,
        default=list,
        blank=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_products",
    )
    stock = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Available inventory units",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at", "id"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(price__gte=0),
                name="catalog_product_price_gte_0",
            ),
        ]
        indexes = [
            models.Index(fields=["is_active", "-created_at"], name="prod_active_created_idx"),
            models.Index(fields=["is_active", "price"], name="prod_active_price_idx"),
        ]

    def __str__(self) -> str:
        return self.name

    def clean(self):
        super().clean()
        if self.name:
            self.name = self.name.strip()
        if self.tags:
            # lower-case, deduplicate and trim tags
            cleaned_tags = []
            seen = set()
            for t in self.tags:
                tag = str(t).strip().lower()
                if tag and tag not in seen:
                    seen.add(tag)
                    cleaned_tags.append(tag[:40])
            self.tags = cleaned_tags[:10]
