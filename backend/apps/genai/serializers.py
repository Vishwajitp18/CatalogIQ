from rest_framework import serializers

from apps.catalog.serializers import ProductReadSerializer


SUPPORTED_TONES = [
    "professional",
    "friendly",
    "technical",
    "energetic",
    "minimalist",
    "luxury",
]


class ProductDescriptionRequestSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    brand = serializers.CharField(max_length=120)
    category = serializers.CharField(max_length=120)
    key_features = serializers.ListField(
        child=serializers.CharField(max_length=120),
        max_length=10,
        required=False,
        default=list,
    )
    bullet_points = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=1000,
    )
    tone = serializers.CharField(
        default="professional",
        max_length=30,
    )

    def validate_tone(self, value: str) -> str:
        clean = (value or "professional").strip().lower()
        if clean not in SUPPORTED_TONES:
            raise serializers.ValidationError(
                f"Invalid tone '{value}'. Must be one of: {', '.join(SUPPORTED_TONES)}."
            )
        return clean

    def validate(self, attrs):
        # If bullet_points was provided but key_features is empty, parse bullet_points
        if not attrs.get("key_features") and attrs.get("bullet_points"):
            raw = attrs["bullet_points"]
            lines = [line.strip("-•* \t\r") for line in raw.split("\n") if line.strip()]
            if not lines and "," in raw:
                lines = [part.strip() for part in raw.split(",") if part.strip()]
            attrs["key_features"] = [l[:120] for l in lines[:10]]
        return attrs


class ProductDescriptionResponseSerializer(serializers.Serializer):
    description = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField())


class NaturalLanguageSearchRequestSerializer(serializers.Serializer):
    query = serializers.CharField(min_length=1, max_length=300)
    limit = serializers.IntegerField(min_value=1, max_value=50, default=20)


class SearchInterpretationDetailSerializer(serializers.Serializer):
    search_terms = serializers.ListField(child=serializers.CharField())
    brand = serializers.DictField(allow_null=True)
    category = serializers.DictField(allow_null=True)
    min_price = serializers.CharField(allow_null=True)
    max_price = serializers.CharField(allow_null=True)
    sort_by = serializers.CharField()
    notes = serializers.ListField(child=serializers.CharField())


class NaturalLanguageSearchResponseSerializer(serializers.Serializer):
    query = serializers.CharField()
    interpretation = SearchInterpretationDetailSerializer()
    count = serializers.IntegerField()
    results = ProductReadSerializer(many=True)
