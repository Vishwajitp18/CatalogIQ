from decimal import Decimal

import factory
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.accounts.models import UserSession
from apps.accounts.services.tokens import generate_refresh_token, hash_token
from apps.catalog.models import Brand, Category, Product

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    full_name = factory.Faker("name")
    is_active = True
    is_staff = False

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop("password", "ValidPassword123!")
        user = super()._create(model_class, *args, **kwargs)
        user.set_password(password)
        user.save()
        return user


class UserSessionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserSession

    user = factory.SubFactory(UserFactory)
    refresh_token_hash = factory.LazyFunction(lambda: hash_token(generate_refresh_token()))
    user_agent = "pytest-test-agent"
    expires_at = factory.LazyFunction(lambda: timezone.now() + timezone.timedelta(days=14))
    absolute_expires_at = factory.LazyFunction(lambda: timezone.now() + timezone.timedelta(days=30))


class BrandFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Brand

    name = factory.Sequence(lambda n: f"Brand {n}")
    slug = factory.Sequence(lambda n: f"brand-{n}")


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category

    name = factory.Sequence(lambda n: f"Category {n}")
    slug = factory.Sequence(lambda n: f"category-{n}")


class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Product

    name = factory.Sequence(lambda n: f"Product {n}")
    brand = factory.SubFactory(BrandFactory)
    category = factory.SubFactory(CategoryFactory)
    description = "Test product description"
    price = Decimal("1999.00")
    image_url = "https://example.com/test.jpg"
    tags = ["test", "demo"]
    stock = 15
    created_by = factory.SubFactory(UserFactory)
    is_active = True
