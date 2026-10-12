from decimal import Decimal
from urllib.parse import urlparse

from rest_framework import serializers

from apps.catalog.models import Brand, Category, Product


class BrandSerializer(serializers.ModelSerializer):
    """Read representation of Brand."""

    class Meta:
        model = Brand
        fields = ["id", "name", "slug"]
        read_only_fields = fields


class BrandCreateSerializer(serializers.Serializer):
    """Write representation for creating a brand."""

    name = serializers.CharField(max_length=120)

    def validate_name(self, value: str) -> str:
        clean_name = value.strip()
        if not clean_name:
            raise serializers.ValidationError("Brand name cannot be blank.")
        if Brand.objects.filter(name__iexact=clean_name).exists():
            raise serializers.ValidationError("A brand with this name already exists.")
        return clean_name

    def create(self, validated_data):
        return Brand.objects.create(name=validated_data["name"])


class CategorySerializer(serializers.ModelSerializer):
    """Read representation of Category."""

    class Meta:
        model = Category
        fields = ["id", "name", "slug"]
        read_only_fields = fields


class CategoryCreateSerializer(serializers.Serializer):
    """Write representation for creating a category."""

    name = serializers.CharField(max_length=120)

    def validate_name(self, value: str) -> str:
        clean_name = value.strip()
        if not clean_name:
            raise serializers.ValidationError("Category name cannot be blank.")
        if Category.objects.filter(name__iexact=clean_name).exists():
            raise serializers.ValidationError("A category with this name already exists.")
        return clean_name

    def create(self, validated_data):
        return Category.objects.create(name=validated_data["name"])


class ProductReadSerializer(serializers.ModelSerializer):
    """Full read representation of Product with nested Brand/Category, creator email, and can_edit flag."""

    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    price = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=True)
    can_edit = serializers.SerializerMethodField()
    created_by_email = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "brand",
            "category",
            "description",
            "price",
            "stock",
            "image_url",
            "tags",
            "is_active",
            "can_edit",
            "created_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_can_edit(self, obj: Product) -> bool:
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return bool(
            request.user.is_staff or request.user.is_superuser or (obj.created_by_id == request.user.id)
        )

    def get_created_by_email(self, obj: Product) -> str:
        return obj.created_by.email if obj.created_by else "admin@catalogiq.com"



class ProductWriteSerializer(serializers.Serializer):
    """Write representation for creating and updating Products."""

    name = serializers.CharField(max_length=200)
    brand_id = serializers.PrimaryKeyRelatedField(queryset=Brand.objects.all(), source="brand")
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category"
    )
    description = serializers.CharField(required=False, allow_blank=True, default="")
    price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.00"))
    stock = serializers.IntegerField(required=False, default=0, min_value=0)
    image_url = serializers.CharField(required=False, allow_blank=True, default="", max_length=2048)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=40),
        required=False,
        default=list,
        max_length=10,
    )

    def validate_name(self, value: str) -> str:
        clean_name = value.strip()
        if not clean_name:
            raise serializers.ValidationError("Product name cannot be blank.")
        return clean_name

    def validate_image_url(self, value: str) -> str:
        clean_url = value.strip()
        if clean_url:
            parsed = urlparse(clean_url)
            if parsed.scheme not in ("http", "https") or not parsed.netloc:
                raise serializers.ValidationError("image_url must be a valid http or https URL.")
        return clean_url

    def validate_tags(self, value: list) -> list[str]:
        cleaned = []
        seen = set()
        for t in value:
            tag = str(t).strip().lower()
            if tag and tag not in seen:
                seen.add(tag)
                cleaned.append(tag[:40])
        return cleaned[:10]
