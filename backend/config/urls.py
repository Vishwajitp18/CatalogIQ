from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # Health check endpoints
    path("api/health/", include("apps.core.urls")),
    # API Documentation (drf-spectacular OpenAPI)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    # API v1 namespaces
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/ai/", include("apps.genai.urls")),
    path("api/v1/catalog/", include("apps.catalog.urls")),
    path("api/v1/", include("apps.catalog.urls")),
]
