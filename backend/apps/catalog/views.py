from uuid import UUID

from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.filters import ProductFilter
from apps.catalog.models import Brand, Category, Product
from apps.catalog.permissions import IsAuthenticatedOrReadOnly, IsOwnerOrStaffOrReadOnly
from apps.catalog.selectors import (
    apply_ordering,
    apply_price_filter,
    apply_search,
    get_catalog_stats,
    visible_products,
)
from apps.catalog.serializers import (
    BrandCreateSerializer,
    BrandSerializer,
    CatalogStatsSerializer,
    CategoryCreateSerializer,
    CategorySerializer,
    ProductReadSerializer,
    ProductWriteSerializer,
)
from apps.catalog.services import create_product, soft_delete_product, update_product
from apps.core.pagination import StandardResultsSetPagination


class ProductListCreateView(APIView):
    """Lists active products with search/filters/sorting/pagination or creates a new product."""

    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        summary="List active products",
        description="Publicly query the product catalog with multi-term search, category/brand filters, price bounds, sorting, and pagination.",
        parameters=[
            OpenApiParameter(
                "search",
                str,
                description="Search term across name, description, brand, category, and tags",
            ),
            OpenApiParameter(
                "brand", str, description="Filter by brand slug (repeatable)", many=True
            ),
            OpenApiParameter(
                "category", str, description="Filter by category slug (repeatable)", many=True
            ),
            OpenApiParameter("min_price", float, description="Minimum price filter (inclusive)"),
            OpenApiParameter("max_price", float, description="Maximum price filter (inclusive)"),
            OpenApiParameter(
                "ordering",
                str,
                description="Sort order: name, -name, price, -price, created_at, -created_at (default: -created_at)",
            ),
            OpenApiParameter("page", int, description="Page number"),
            OpenApiParameter(
                "page_size", int, description="Items per page (default: 20, max: 100)"
            ),
        ],
        responses={200: ProductReadSerializer(many=True)},
        tags=["Catalog"],
    )
    def get(self, request):
        qs = visible_products()

        # 1. Multi-term search
        search_query = request.query_params.get("search")
        qs = apply_search(qs, search_query)

        # 2. Price filter validation & execution
        min_p = request.query_params.get("min_price")
        max_p = request.query_params.get("max_price")
        qs = apply_price_filter(qs, min_p, max_p)

        # 3. Brand & Category slug filters (repeatable)
        filterset = ProductFilter(request.GET, queryset=qs, request=request)
        if not filterset.is_valid():
            raise exceptions.ValidationError(filterset.errors)
        qs = filterset.qs

        # 4. Ordering with ID tiebreaker
        ordering = request.query_params.get("ordering")
        qs = apply_ordering(qs, ordering)

        # 5. Pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = ProductReadSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        summary="Create product",
        description="Creates a new catalog product. Authenticated user is recorded as creator.",
        request=ProductWriteSerializer,
        responses={
            201: ProductReadSerializer,
            400: OpenApiResponse(description="Validation error"),
        },
        tags=["Catalog"],
    )
    def post(self, request):
        serializer = ProductWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        product = create_product(
            name=data["name"],
            brand=data["brand"],
            category=data["category"],
            price=data["price"],
            stock=data.get("stock", 0),
            description=data.get("description", ""),
            image_url=data.get("image_url", ""),
            tags=data.get("tags", []),
            created_by=request.user,
        )

        read_serializer = ProductReadSerializer(product, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class ProductDetailView(APIView):
    """Retrieves, updates, or soft-deletes a single product by UUID."""

    permission_classes = [IsOwnerOrStaffOrReadOnly]

    def get_object(self, pk: UUID) -> Product:
        try:
            # Active products only
            obj = visible_products().get(pk=pk)
        except (Product.DoesNotExist, ValueError) as exc:
            raise exceptions.NotFound("Product not found.") from exc
        self.check_object_permissions(self.request, obj)
        return obj

    @extend_schema(
        summary="Retrieve product detail",
        description="Public detail view for an active product.",
        responses={
            200: ProductReadSerializer,
            404: OpenApiResponse(description="Product not found"),
        },
        tags=["Catalog"],
    )
    def get(self, request, pk: UUID):
        product = self.get_object(pk)
        return Response(ProductReadSerializer(product, context={"request": request}).data)

    @extend_schema(
        summary="Update product",
        description="Replaces all editable product attributes. Creator or staff only.",
        request=ProductWriteSerializer,
        responses={
            200: ProductReadSerializer,
            403: OpenApiResponse(description="Permission denied"),
        },
        tags=["Catalog"],
    )
    def put(self, request, pk: UUID):
        product = self.get_object(pk)
        serializer = ProductWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        updated = update_product(
            product,
            name=data["name"],
            brand=data["brand"],
            category=data["category"],
            price=data["price"],
            stock=data.get("stock", 0),
            description=data.get("description", ""),
            image_url=data.get("image_url", ""),
            tags=data.get("tags", []),
        )
        return Response(ProductReadSerializer(updated, context={"request": request}).data)

    @extend_schema(
        summary="Partial update product",
        description="Updates specific attributes on an existing product. Creator or staff only.",
        request=ProductWriteSerializer,
        responses={
            200: ProductReadSerializer,
            403: OpenApiResponse(description="Permission denied"),
        },
        tags=["Catalog"],
    )
    def patch(self, request, pk: UUID):
        product = self.get_object(pk)
        serializer = ProductWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        updated = update_product(
            product,
            name=data.get("name"),
            brand=data.get("brand"),
            category=data.get("category"),
            price=data.get("price"),
            stock=data.get("stock"),
            description=data.get("description"),
            image_url=data.get("image_url"),
            tags=data.get("tags"),
        )
        return Response(ProductReadSerializer(updated, context={"request": request}).data)

    @extend_schema(
        summary="Soft delete product",
        description="Soft deletes the product (sets is_active=False). Creator or staff only. Inactive products return 404.",
        responses={204: None, 403: OpenApiResponse(description="Permission denied")},
        tags=["Catalog"],
    )
    def delete(self, request, pk: UUID):
        product = self.get_object(pk)
        soft_delete_product(product)
        return Response(status=status.HTTP_204_NO_CONTENT)


class BrandListCreateView(APIView):
    """Public list and authenticated creation of Brands."""

    permission_classes = [IsAuthenticatedOrReadOnly]

    @extend_schema(
        summary="List all brands",
        description="Public unpaginated list of all product brands sorted alphabetically.",
        responses={200: BrandSerializer(many=True)},
        tags=["Catalog"],
    )
    def get(self, request):
        brands = Brand.objects.all().order_by("name")
        return Response(BrandSerializer(brands, many=True).data)

    @extend_schema(
        summary="Create brand",
        description="Creates a new brand. Authenticated users only.",
        request=BrandCreateSerializer,
        responses={201: BrandSerializer, 400: OpenApiResponse(description="Validation error")},
        tags=["Catalog"],
    )
    def post(self, request):
        serializer = BrandCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        brand = serializer.save()
        return Response(BrandSerializer(brand).data, status=status.HTTP_201_CREATED)


class CategoryListCreateView(APIView):
    """Public list and authenticated creation of Categories."""

    permission_classes = [IsAuthenticatedOrReadOnly]

    @extend_schema(
        summary="List all categories",
        description="Public unpaginated list of all product categories sorted alphabetically.",
        responses={200: CategorySerializer(many=True)},
        tags=["Catalog"],
    )
    def get(self, request):
        categories = Category.objects.all().order_by("name")
        return Response(CategorySerializer(categories, many=True).data)

    @extend_schema(
        summary="Create category",
        description="Creates a new category. Authenticated users only.",
        request=CategoryCreateSerializer,
        responses={201: CategorySerializer, 400: OpenApiResponse(description="Validation error")},
        tags=["Catalog"],
    )
    def post(self, request):
        serializer = CategoryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        return Response(CategorySerializer(category).data, status=status.HTTP_201_CREATED)


class CatalogStatsView(APIView):
    """Retrieves aggregated catalog statistics directly from the database."""

    permission_classes = [IsAuthenticatedOrReadOnly]

    @extend_schema(
        summary="Catalog statistics and aggregated metrics",
        description="Calculates database-aggregated metrics (total products, brand count, category count, average price, AI-tagged count) across the active catalog or filtered subset.",
        parameters=[
            OpenApiParameter(
                "search",
                str,
                description="Search term across name, description, brand, category, and tags",
            ),
            OpenApiParameter(
                "brand", str, description="Filter by brand slug (repeatable)", many=True
            ),
            OpenApiParameter(
                "category", str, description="Filter by category slug (repeatable)", many=True
            ),
            OpenApiParameter("min_price", float, description="Minimum price filter (inclusive)"),
            OpenApiParameter("max_price", float, description="Maximum price filter (inclusive)"),
        ],
        responses={200: CatalogStatsSerializer},
        tags=["Catalog"],
    )
    def get(self, request):
        qs = visible_products()

        # 1. Multi-term search
        search_query = request.query_params.get("search")
        qs = apply_search(qs, search_query)

        # 2. Price filter validation & execution
        min_p = request.query_params.get("min_price")
        max_p = request.query_params.get("max_price")
        qs = apply_price_filter(qs, min_p, max_p)

        # 3. Brand & Category slug filters (repeatable)
        filterset = ProductFilter(request.GET, queryset=qs, request=request)
        if not filterset.is_valid():
            raise exceptions.ValidationError(filterset.errors)
        qs = filterset.qs

        stats = get_catalog_stats(qs)
        return Response(stats, status=status.HTTP_200_OK)
