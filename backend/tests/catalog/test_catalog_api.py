from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.accounts.services.sessions import create_user_session
from apps.catalog.models import Product
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
class TestCatalogAPI:
    def test_public_product_listing(self, client):
        b = BrandFactory(name="Sony", slug="sony")
        c = CategoryFactory(name="Audio", slug="audio")
        ProductFactory.create_batch(5, brand=b, category=c)

        res = client.get("/api/v1/products/")
        assert res.status_code == 200
        data = res.json()
        assert data["count"] == 5
        assert len(data["results"]) == 5
        assert "brand" in data["results"][0]
        assert "category" in data["results"][0]

    def test_search_and_filters(self, client):
        b1 = BrandFactory(name="Apple", slug="apple")
        b2 = BrandFactory(name="Bose", slug="bose")
        cat = CategoryFactory(name="Audio", slug="audio")

        p1 = ProductFactory(
            name="AirPods Pro", brand=b1, category=cat, price=Decimal("20000.00"), tags=["earbuds"]
        )
        p2 = ProductFactory(
            name="Bose QuietComfort",
            brand=b2,
            category=cat,
            price=Decimal("25000.00"),
            tags=["headphones"],
        )

        # Search by term
        res = client.get("/api/v1/products/?search=airpods")
        assert res.status_code == 200
        assert res.json()["count"] == 1
        assert res.json()["results"][0]["id"] == str(p1.id)

        # Filter by brand slug
        res = client.get("/api/v1/products/?brand=bose")
        assert res.status_code == 200
        assert res.json()["count"] == 1
        assert res.json()["results"][0]["id"] == str(p2.id)

        # Filter by price bounds
        res = client.get("/api/v1/products/?min_price=22000&max_price=30000")
        assert res.status_code == 200
        assert res.json()["count"] == 1
        assert res.json()["results"][0]["id"] == str(p2.id)

        # Invalid price range: min > max -> 400
        res = client.get("/api/v1/products/?min_price=30000&max_price=10000")
        assert res.status_code == 400
        assert res.json()["error"]["code"] == "validation_error"

    def test_ordering_allow_list(self, client):
        res = client.get("/api/v1/products/?ordering=price")
        assert res.status_code == 200

        # Invalid ordering
        res = client.get("/api/v1/products/?ordering=unsupported_col")
        assert res.status_code == 400
        assert res.json()["error"]["code"] == "validation_error"

    def test_product_create_and_ownership(self, client):
        user = UserFactory()
        authed_client = auth_client_for(user)

        b = BrandFactory(name="Logitech")
        c = CategoryFactory(name="Accessories")

        payload = {
            "name": "MX Master 3S",
            "brand_id": b.id,
            "category_id": c.id,
            "description": "Ergonomic wireless mouse",
            "price": "8999.00",
            "image_url": "https://example.com/mouse.jpg",
            "tags": ["wireless", "mouse"],
        }

        # Anonymous cannot create
        res_anon = client.post("/api/v1/products/", payload)
        assert res_anon.status_code == 401

        # Authenticated can create
        res = authed_client.post("/api/v1/products/", payload)
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "MX Master 3S"
        assert data["can_edit"] is True

        prod = Product.objects.get(id=data["id"])
        assert prod.created_by == user

    def test_can_edit_flag_semantics(self, client):
        creator = UserFactory()
        other_user = UserFactory()
        staff_user = UserFactory(is_staff=True)

        prod = ProductFactory(created_by=creator)

        # Anonymous
        res = client.get(f"/api/v1/products/{prod.id}/")
        assert res.json()["can_edit"] is False

        # Other user
        res_other = auth_client_for(other_user).get(f"/api/v1/products/{prod.id}/")
        assert res_other.json()["can_edit"] is False

        # Creator
        res_creator = auth_client_for(creator).get(f"/api/v1/products/{prod.id}/")
        assert res_creator.json()["can_edit"] is True

        # Staff
        res_staff = auth_client_for(staff_user).get(f"/api/v1/products/{prod.id}/")
        assert res_staff.json()["can_edit"] is True

    def test_product_update_permissions(self, client):
        creator = UserFactory()
        other_user = UserFactory()
        prod = ProductFactory(created_by=creator, price=Decimal("1000.00"))

        patch_payload = {
            "name": prod.name,
            "brand_id": prod.brand.id,
            "category_id": prod.category.id,
            "price": "1200.00",
        }

        # Other user forbidden
        res_other = auth_client_for(other_user).patch(f"/api/v1/products/{prod.id}/", patch_payload)
        assert res_other.status_code == 403

        # Creator succeeds
        res_creator = auth_client_for(creator).patch(f"/api/v1/products/{prod.id}/", patch_payload)
        assert res_creator.status_code == 200
        assert res_creator.json()["price"] == "1200.00"

    def test_soft_delete(self, client):
        creator = UserFactory()
        prod = ProductFactory(created_by=creator, is_active=True)

        # Creator deletes
        res = auth_client_for(creator).delete(f"/api/v1/products/{prod.id}/")
        assert res.status_code == 204

        # Inactive in DB
        prod.refresh_from_db()
        assert prod.is_active is False

        # Inactive products return 404 in API
        assert client.get(f"/api/v1/products/{prod.id}/").status_code == 404
        assert prod.id not in [p["id"] for p in client.get("/api/v1/products/").json()["results"]]

    def test_brands_and_categories_endpoints(self, client):
        user = UserFactory()
        authed = auth_client_for(user)

        # Public list
        assert client.get("/api/v1/brands/").status_code == 200
        assert client.get("/api/v1/categories/").status_code == 200

        # Authenticated create
        res_b = authed.post("/api/v1/brands/", {"name": "Samsung"})
        assert res_b.status_code == 201
        assert res_b.json()["slug"] == "samsung"

        # Duplicate brand name rejected (case-insensitive)
        res_b_dup = authed.post("/api/v1/brands/", {"name": "SAMSUNG"})
        assert res_b_dup.status_code == 400

        # Create category
        res_c = authed.post("/api/v1/categories/", {"name": "Smartphones"})
        assert res_c.status_code == 201
        assert res_c.json()["slug"] == "smartphones"
