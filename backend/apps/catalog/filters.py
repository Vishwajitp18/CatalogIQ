import django_filters

from apps.catalog.models import Brand, Category, Product


class ProductFilter(django_filters.FilterSet):
    """FilterSet allowing repeatable brand and category slug filters, plus price bounds."""

    brand = django_filters.ModelMultipleChoiceFilter(
        field_name="brand__slug",
        to_field_name="slug",
        queryset=Brand.objects.all(),
    )
    category = django_filters.ModelMultipleChoiceFilter(
        field_name="category__slug",
        to_field_name="slug",
        queryset=Category.objects.all(),
    )
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    class Meta:
        model = Product
        fields = ["brand", "category", "min_price", "max_price"]
