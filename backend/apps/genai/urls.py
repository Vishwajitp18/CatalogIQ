from django.urls import path

from apps.genai.views import (
    NaturalLanguageSearchView,
    ProductDescriptionGenerateView,
)

urlpatterns = [
    path(
        "product-description/",
        ProductDescriptionGenerateView.as_view(),
        name="ai-product-description",
    ),
    path("search/", NaturalLanguageSearchView.as_view(), name="ai-search"),
]
