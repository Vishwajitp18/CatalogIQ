from django.contrib import admin

from apps.catalog.models import Brand, Category, Product


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name", "slug")
    readonly_fields = ("slug", "created_at", "updated_at")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name", "slug")
    readonly_fields = ("slug", "created_at", "updated_at")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "brand", "category", "price", "is_active", "created_by", "created_at")
    list_filter = ("is_active", "brand", "category", "created_at")
    search_fields = ("name", "description", "brand__name", "category__name")
    readonly_fields = ("id", "created_at", "updated_at")
    actions = ["restore_deleted_products", "soft_delete_products"]

    @admin.action(description="Restore soft-deleted products")
    def restore_deleted_products(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f"{count} products restored.")

    @admin.action(description="Soft delete selected products")
    def soft_delete_products(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f"{count} products deactivated.")
