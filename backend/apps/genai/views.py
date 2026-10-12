from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.exceptions import APIApplicationError
from apps.genai.providers.base import (
    ProviderBadOutput,
    ProviderNotConfigured,
    ProviderUnavailable,
)
from apps.genai.serializers import (
    NaturalLanguageSearchRequestSerializer,
    NaturalLanguageSearchResponseSerializer,
    ProductDescriptionRequestSerializer,
    ProductDescriptionResponseSerializer,
)
from apps.genai.services import (
    generate_description_draft,
    run_natural_language_search,
)


class ProductDescriptionGenerateView(APIView):
    """Generates an editable product description draft and tags from basic product details."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "ai"

    @extend_schema(
        summary="Generate product description & tags draft",
        description="Generates a factual product description and suggested tag keywords. Does not persist to the catalog.",
        request=ProductDescriptionRequestSerializer,
        responses={
            200: ProductDescriptionResponseSerializer,
            400: OpenApiResponse(description="Validation error"),
            502: OpenApiResponse(description="AI output validation failure"),
            503: OpenApiResponse(description="AI provider unavailable or unconfigured"),
        },
        tags=["GenAI"],
    )
    def post(self, request):
        serializer = ProductDescriptionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            result = generate_description_draft(
                name=data["name"],
                brand=data["brand"],
                category=data["category"],
                key_features=data.get("key_features", []),
                tone=data.get("tone", "professional"),
            )
            return Response(result, status=status.HTTP_200_OK)
        except ProviderNotConfigured as exc:
            raise APIApplicationError(
                message=str(exc),
                code="ai_not_configured",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            ) from exc
        except ProviderUnavailable as exc:
            raise APIApplicationError(
                message=str(exc),
                code="ai_unavailable",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            ) from exc
        except ProviderBadOutput as exc:
            raise APIApplicationError(
                message=str(exc),
                code="ai_invalid_output",
                status_code=status.HTTP_502_BAD_GATEWAY,
            ) from exc


class NaturalLanguageSearchView(APIView):
    """Interprets natural language search queries and executes safe parameterized ORM retrieval."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "ai"

    @extend_schema(
        summary="Natural language catalog search",
        description="Translates a natural language user query into validated catalog criteria and returns matched products.",
        request=NaturalLanguageSearchRequestSerializer,
        responses={
            200: NaturalLanguageSearchResponseSerializer,
            400: OpenApiResponse(description="Validation error"),
            502: OpenApiResponse(description="AI output validation failure"),
            503: OpenApiResponse(description="AI provider unavailable or unconfigured"),
        },
        tags=["GenAI"],
    )
    def post(self, request):
        serializer = NaturalLanguageSearchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            result = run_natural_language_search(
                query=data["query"],
                limit=data.get("limit", 20),
            )
            return Response(result, status=status.HTTP_200_OK)
        except ProviderNotConfigured as exc:
            raise APIApplicationError(
                message=str(exc),
                code="ai_not_configured",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            ) from exc
        except ProviderUnavailable as exc:
            raise APIApplicationError(
                message=str(exc),
                code="ai_unavailable",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            ) from exc
        except ProviderBadOutput as exc:
            raise APIApplicationError(
                message=str(exc),
                code="ai_invalid_output",
                status_code=status.HTTP_502_BAD_GATEWAY,
            ) from exc
