from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from apps.accounts.services.sessions import create_user_session
from apps.catalog.models import Product
from apps.genai.providers.base import (
    ProviderBadOutput,
    ProviderNotConfigured,
    ProviderUnavailable,
)
from tests.factories import BrandFactory, CategoryFactory, ProductFactory, UserFactory


@pytest.fixture
def client():
    return APIClient()


def auth_client_for(user):
    c = APIClient()
    session, access, _ = create_user_session(user)
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    return c


@pytest.mark.django_db
class TestGenAIFeatures:
    def test_description_generator_draft_success(self, client):
        user = UserFactory()
        authed = auth_client_for(user)

        initial_count = Product.objects.count()
        payload = {
            "name": "Wireless Over-Ear Headphones",
            "brand": "Sony",
            "category": "Audio",
            "key_features": ["30 hour battery", "Active noise cancellation"],
            "tone": "professional",
        }

        # Anonymous rejected
        assert client.post("/api/v1/ai/product-description/", payload).status_code == 401

        # Authenticated succeeds
        res = authed.post("/api/v1/ai/product-description/", payload)
        assert res.status_code == 200
        data = res.json()
        assert "description" in data
        assert "tags" in data
        assert isinstance(data["tags"], list)
        assert len(data["description"]) > 10

        # AI draft does NOT persist to DB
        assert Product.objects.count() == initial_count

    def test_description_generator_all_supported_tones(self, client):
        user = UserFactory()
        authed = auth_client_for(user)

        for tone_name in ["professional", "Friendly", "TECHNICAL", "Energetic", "minimalist", "luxury"]:
            payload = {
                "name": "Wireless Over-Ear Headphones",
                "brand": "Sony",
                "category": "Audio",
                "key_features": ["30 hour battery", "Active noise cancellation"],
                "tone": tone_name,
            }
            res = authed.post("/api/v1/ai/product-description/", payload)
            assert res.status_code == 200, f"Failed for tone {tone_name}: {res.json()}"
            data = res.json()
            assert "description" in data
            assert "tags" in data

    def test_description_generator_bullet_points_parsing(self, client):
        user = UserFactory()
        authed = auth_client_for(user)

        payload = {
            "name": "Wireless Over-Ear Headphones",
            "brand": "Sony",
            "category": "Audio",
            "bullet_points": "30-hour battery\n• Active noise cancellation\n* Lightweight foldable frame",
            "tone": "luxury",
        }
        res = authed.post("/api/v1/ai/product-description/", payload)
        assert res.status_code == 200
        data = res.json()
        assert "description" in data
        assert "tags" in data

    def test_description_generator_validation_error(self, client):
        user = UserFactory()
        authed = auth_client_for(user)

        # Bad tone enum
        res = authed.post(
            "/api/v1/ai/product-description/",
            {"name": "Headphones", "brand": "Sony", "category": "Audio", "tone": "invalid_tone"},
        )
        assert res.status_code == 400
        assert res.json()["error"]["code"] == "validation_error"

    def test_natural_language_search_success(self, client):
        user = UserFactory()
        authed = auth_client_for(user)

        b = BrandFactory(name="Sony", slug="sony")
        c = CategoryFactory(name="Audio", slug="audio")
        ProductFactory(
            name="Sony Noise Canceling Headphones", brand=b, category=c, tags=["wireless"]
        )

        # Anonymous rejected
        assert (
            client.post("/api/v1/ai/search/", {"query": "wireless headphones"}).status_code == 401
        )

        # Authenticated succeeds
        res = authed.post(
            "/api/v1/ai/search/", {"query": "wireless headphones under 5000", "limit": 10}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["query"] == "wireless headphones under 5000"
        assert "interpretation" in data
        assert "results" in data
        assert "notes" in data["interpretation"]

    def test_natural_language_search_generic_stopwords_and_fallback(self, client):
        user = UserFactory()
        authed = auth_client_for(user)

        b = BrandFactory(name="Apple", slug="apple")
        c = CategoryFactory(name="Wearables", slug="wearables")
        ProductFactory(
            name="Apple Watch Series 9 GPS 45mm",
            brand=b,
            category=c,
            price=41900.00,
            tags=["smartwatch", "fitness"],
        )

        # Mock provider returning generic stopword 'gadgets' in search_terms
        with patch("apps.genai.services.get_provider") as mock_prov:
            mock_prov.return_value.generate_json.return_value = {
                "search_terms": ["gadgets"],
                "brand": "Apple",
                "category": None,
                "min_price": None,
                "max_price": 50000.0,
                "sort_by": "relevance",
            }
            res = authed.post(
                "/api/v1/ai/search/", {"query": "Apple gadgets under 50000", "limit": 10}
            )
            assert res.status_code == 200
            data = res.json()
            assert data["count"] == 1
            assert data["results"][0]["name"] == "Apple Watch Series 9 GPS 45mm"
            # gadgets should have been stripped from search_terms
            assert "gadgets" not in data["interpretation"]["search_terms"]

        # Mock provider returning a non-matching keyword, verifying relaxed fallback
        with patch("apps.genai.services.get_provider") as mock_prov:
            mock_prov.return_value.generate_json.return_value = {
                "search_terms": ["unobtainable_keyword_xyz"],
                "brand": "Apple",
                "category": None,
                "min_price": None,
                "max_price": 50000.0,
                "sort_by": "relevance",
            }
            res = authed.post(
                "/api/v1/ai/search/", {"query": "Apple unobtainable_keyword_xyz under 50000"}
            )
            assert res.status_code == 200
            data = res.json()
            # Relaxed fallback returns Apple product under 50000
            assert data["count"] == 1
            assert data["results"][0]["name"] == "Apple Watch Series 9 GPS 45mm"
            assert any("Relaxed keyword search" in note for note in data["interpretation"]["notes"])


    def test_ai_provider_error_translation(self, client):
        user = UserFactory()
        authed = auth_client_for(user)
        payload = {"name": "Test", "brand": "TestBrand", "category": "TestCat"}

        # 503 ProviderNotConfigured
        with patch("apps.genai.services.get_provider") as mock_prov:
            mock_prov.return_value.generate_json.side_effect = ProviderNotConfigured(
                "API key missing"
            )
            res = authed.post("/api/v1/ai/product-description/", payload)
            assert res.status_code == 503
            assert res.json()["error"]["code"] == "ai_not_configured"

        # 503 ProviderUnavailable (Timeout / 5xx)
        with patch("apps.genai.services.get_provider") as mock_prov:
            mock_prov.return_value.generate_json.side_effect = ProviderUnavailable("Groq timeout")
            res = authed.post("/api/v1/ai/product-description/", payload)
            assert res.status_code == 503
            assert res.json()["error"]["code"] == "ai_unavailable"

        # 502 ProviderBadOutput
        with patch("apps.genai.services.get_provider") as mock_prov:
            mock_prov.return_value.generate_json.side_effect = ProviderBadOutput("Invalid json")
            res = authed.post("/api/v1/ai/product-description/", payload)
            assert res.status_code == 502
            assert res.json()["error"]["code"] == "ai_invalid_output"
