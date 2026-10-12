from rest_framework import serializers

from apps.catalog.serializers import ProductReadSerializer


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
    tone = serializers.ChoiceField(
        choices=["professional", "friendly", "technical"],
        default="professional",
    )


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
