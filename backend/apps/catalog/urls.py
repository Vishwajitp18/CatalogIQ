from django.urls import path

from apps.catalog.views import (
    BrandListCreateView,
    CatalogStatsView,
    CategoryListCreateView,
    ProductDetailView,
    ProductListCreateView,
)

urlpatterns = [
    path("products/", ProductListCreateView.as_view(), name="product-list-create"),
    path("products/<uuid:pk>/", ProductDetailView.as_view(), name="product-detail"),
    path("brands/", BrandListCreateView.as_view(), name="brand-list-create"),
    path("categories/", CategoryListCreateView.as_view(), name="category-list-create"),
    path("stats/", CatalogStatsView.as_view(), name="catalog-stats"),
]
