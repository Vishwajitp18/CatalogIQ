from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """Standard paginator: default 20, max 100 per page."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
