import django_filters
from django.db.models import Q

from apps.catalog.models import Product


class ProductFilter(django_filters.FilterSet):
    """FilterSet allowing repeatable brand and category slug, name, or ID filters, plus price bounds."""

    brand = django_filters.CharFilter(method="filter_brand")
    category = django_filters.CharFilter(method="filter_category")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    is_active = django_filters.BooleanFilter(field_name="is_active")

    def filter_brand(self, queryset, name, value):
        raw = (
            self.request.GET.getlist("brand")
            if hasattr(self, "request") and self.request
            else [value]
        )
        vals = []
        for r in raw:
            vals.extend([v.strip() for v in str(r).split(",") if v.strip()])
        if not vals:
            return queryset
        lower_vals = [v.lower() for v in vals]
        q = Q(brand__slug__in=lower_vals) | Q(brand__slug__in=vals) | Q(brand__name__in=vals)
        for lv in lower_vals:
            q |= Q(brand__name__iexact=lv)
        ids = [int(v) for v in vals if v.isdigit()]
        if ids:
            q |= Q(brand__id__in=ids)
        return queryset.filter(q)

    def filter_category(self, queryset, name, value):
        raw = (
            self.request.GET.getlist("category")
            if hasattr(self, "request") and self.request
            else [value]
        )
        vals = []
        for r in raw:
            vals.extend([v.strip() for v in str(r).split(",") if v.strip()])
        if not vals:
            return queryset
        lower_vals = [v.lower() for v in vals]
        q = Q(category__slug__in=lower_vals) | Q(category__slug__in=vals) | Q(category__name__in=vals)
        for lv in lower_vals:
            q |= Q(category__name__iexact=lv)
        ids = [int(v) for v in vals if v.isdigit()]
        if ids:
            q |= Q(category__id__in=ids)
        return queryset.filter(q)

    class Meta:
        model = Product
        fields = ["brand", "category", "min_price", "max_price", "is_active"]

