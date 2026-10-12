from django.db import connection
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthLiveView(APIView):
    """Liveness probe: verifies process is running."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        summary="Liveness probe",
        description="Returns 200 if the backend process is alive.",
        responses={200: dict},
        tags=["Health"],
    )
    def get(self, request):
        return Response({"status": "healthy"}, status=status.HTTP_200_OK)


class HealthReadyView(APIView):
    """Readiness probe: verifies database connection."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        summary="Readiness probe",
        description="Returns 200 if the database is reachable, 503 otherwise.",
        responses={200: dict, 503: dict},
        tags=["Health"],
    )
    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
            return Response({"status": "ready", "database": "connected"}, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response(
                {"status": "unhealthy", "database": "disconnected", "detail": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
