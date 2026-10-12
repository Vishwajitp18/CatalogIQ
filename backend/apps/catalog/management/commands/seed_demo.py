from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.models import Brand, Category, Product

User = get_user_model()

ADMIN_USER_EMAIL = "admin@catalogiq.com"
ADMIN_USER_PASSWORD = "AdminPass123!"

DEMO_USER_EMAIL = "demo@catalogiq.com"
DEMO_USER_PASSWORD = "DemoPass123!"

STANDARD_USER_EMAIL = "user@catalogiq.com"
STANDARD_USER_PASSWORD = "UserPass123!"


BRANDS_DATA = [
    "Sony",
    "Apple",
    "Samsung",
    "Bose",
    "Dell",
    "Logitech",
    "Nike",
]

CATEGORIES_DATA = [
    "Audio",
    "Electronics",
    "Computers & Accessories",
    "Wearables",
    "Apparel & Footwear",
]

PRODUCTS_DATA = [
    # Audio
    {
        "name": "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
        "brand": "Sony",
        "category": "Audio",
        "description": "Industry-leading noise canceling with two processors and 8 microphones. Exceptional sound quality with Hi-Res Audio support and up to 30 hours of battery life.",
        "price": Decimal("26990.00"),
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
        "tags": ["wireless", "noise-canceling", "bluetooth", "over-ear", "premium"],
    },
    {
        "name": "Bose QuietComfort 45 Bluetooth Headphones",
        "brand": "Bose",
        "category": "Audio",
        "description": "Iconic quiet, comfort, and sound. TriPort acoustic architecture delivers deep, full audio. Quiet and Aware modes let you choose how much outside world you hear.",
        "price": Decimal("24900.00"),
        "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
        "tags": ["wireless", "noise-canceling", "bluetooth", "travel", "comfortable"],
    },
    {
        "name": "Apple AirPods Pro (2nd Generation)",
        "brand": "Apple",
        "category": "Audio",
        "description": "Up to 2x more Active Noise Cancellation. Adaptive Audio tailors noise control to your environment. Personalized Spatial Audio with dynamic head tracking.",
        "price": Decimal("20990.00"),
        "image_url": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800",
        "tags": ["wireless", "earbuds", "noise-canceling", "apple", "portable"],
    },
    {
        "name": "Sony WF-1000XM5 Truly Wireless Earbuds",
        "brand": "Sony",
        "category": "Audio",
        "description": "Astonishing sound quality and the best noise-canceling performance in an earbud. Dual feedback microphones and comfortable ergonomic fit.",
        "price": Decimal("21990.00"),
        "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800",
        "tags": ["wireless", "earbuds", "noise-canceling", "bluetooth"],
    },
    {
        "name": "Bose SoundLink Flex Bluetooth Speaker",
        "brand": "Bose",
        "category": "Audio",
        "description": "Waterproof portable outdoor speaker with positionIQ technology that automatically detects orientation to optimize sound. Rugged IP67 rating.",
        "price": Decimal("13900.00"),
        "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800",
        "tags": ["portable", "bluetooth", "speaker", "waterproof", "outdoor"],
    },
    # Electronics & Wearables
    {
        "name": "Apple Watch Series 9 GPS 45mm",
        "brand": "Apple",
        "category": "Wearables",
        "description": "Powerful S9 chip with double tap gesture control. Advanced health sensors including blood oxygen and ECG tracking. Bright always-on Retina display.",
        "price": Decimal("41900.00"),
        "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
        "tags": ["smartwatch", "fitness", "health", "wearable", "apple"],
    },
    {
        "name": "Samsung Galaxy Watch 6 Classic",
        "brand": "Samsung",
        "category": "Wearables",
        "description": "Rotating physical bezel with sapphire crystal glass display. Advanced sleep coaching, heart rhythm notifications, and custom workout zones.",
        "price": Decimal("33999.00"),
        "image_url": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800",
        "tags": ["smartwatch", "fitness", "android", "wearable", "classic"],
    },
    {
        "name": "Apple iPad Air M2 11-inch",
        "brand": "Apple",
        "category": "Electronics",
        "description": "Supercharged by the blazing-fast M2 chip. Stunning Liquid Retina display, landscape front camera, and ultra-fast Wi-Fi 6E connectivity.",
        "price": Decimal("59900.00"),
        "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
        "tags": ["tablet", "apple", "m2", "productivity", "portable"],
    },
    {
        "name": "Samsung Galaxy Tab S9 FE",
        "brand": "Samsung",
        "category": "Electronics",
        "description": "10.9-inch smooth 90Hz display with inbox S Pen included. IP68 water and dust resistance, perfect for work and entertainment on the go.",
        "price": Decimal("36999.00"),
        "image_url": "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800",
        "tags": ["tablet", "android", "s-pen", "student", "drawing"],
    },
    # Computers & Accessories
    {
        "name": "Dell XPS 15 9530 Laptop",
        "brand": "Dell",
        "category": "Computers & Accessories",
        "description": "15.6-inch OLED 3.5K display powered by 13th Gen Intel Core i7 and NVIDIA GeForce RTX 4060. Precision crafted CNC machined aluminum body.",
        "price": Decimal("189990.00"),
        "image_url": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800",
        "tags": ["laptop", "ultrabook", "creator", "oled", "intel"],
    },
    {
        "name": "Apple MacBook Air 13-inch M3",
        "brand": "Apple",
        "category": "Computers & Accessories",
        "description": "Incredibly thin and fast laptop with up to 18 hours of battery life. Liquid Retina display and 1080p FaceTime HD camera in a sleek midnight aluminum finish.",
        "price": Decimal("104900.00"),
        "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
        "tags": ["laptop", "macbook", "m3", "portable", "battery-life"],
    },
    {
        "name": "Logitech MX Master 3S Wireless Mouse",
        "brand": "Logitech",
        "category": "Computers & Accessories",
        "description": "Performance wireless mouse with 8000 DPI track-on-glass sensor and quiet clicks. MagSpeed electromagnetic scrolling wheel with cross-computer control.",
        "price": Decimal("8995.00"),
        "image_url": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800",
        "tags": ["mouse", "wireless", "ergonomic", "productivity", "bluetooth"],
    },
    {
        "name": "Logitech MX Mechanical Wireless Keyboard",
        "brand": "Logitech",
        "category": "Computers & Accessories",
        "description": "Low profile mechanical tactile switches with smart illumination backlighting. Multi-device Bluetooth and Logi Bolt connectivity.",
        "price": Decimal("14995.00"),
        "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
        "tags": ["keyboard", "mechanical", "wireless", "bluetooth", "tactile"],
    },
    {
        "name": "Dell UltraSharp 27 4K USB-C Hub Monitor (U2723QE)",
        "brand": "Dell",
        "category": "Computers & Accessories",
        "description": "IPS Black technology with 2000:1 contrast ratio and 98% DCI-P3 color gamut. Built-in RJ45 and USB-C 90W power delivery hub.",
        "price": Decimal("54990.00"),
        "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
        "tags": ["monitor", "4k", "ips", "usb-c", "productivity"],
    },
    # Budget / Everyday items
    {
        "name": "Sony WI-C100 Wireless In-Ear Bluetooth Headphones",
        "brand": "Sony",
        "category": "Audio",
        "description": "Budget-friendly neckband style wireless headphones with up to 25 hours battery life, splash-proof IPX4 design, and built-in mic.",
        "price": Decimal("1699.00"),
        "image_url": "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800",
        "tags": ["budget", "wireless", "neckband", "water-resistant", "bluetooth"],
    },
    {
        "name": "Logitech B100 Optical USB Mouse",
        "brand": "Logitech",
        "category": "Computers & Accessories",
        "description": "Comfortable ambidextrous corded mouse with 800 DPI precise optical tracking and simple plug-and-play USB connection.",
        "price": Decimal("399.00"),
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800",
        "tags": ["budget", "mouse", "wired", "office", "basic"],
    },
    {
        "name": "Logitech K120 Wired Keyboard",
        "brand": "Logitech",
        "category": "Computers & Accessories",
        "description": "Reliable and durable spill-resistant design with thin profile, standard layout and full-size F-keys and number pad.",
        "price": Decimal("649.00"),
        "image_url": "https://images.unsplash.com/photo-1560762484-813fc97650a0?w=800",
        "tags": ["budget", "keyboard", "wired", "office", "durable"],
    },
    # Apparel & Footwear
    {
        "name": "Nike Air Zoom Pegasus 40 Running Shoes",
        "brand": "Nike",
        "category": "Apparel & Footwear",
        "description": "Responsive everyday running shoe with dual Zoom Air units and React foam cushioning for a comfortable springy ride.",
        "price": Decimal("10495.00"),
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
        "tags": ["running", "shoes", "cushioned", "breathable", "sports"],
    },
    {
        "name": "Nike Dri-FIT Legend Fitness T-Shirt",
        "brand": "Nike",
        "category": "Apparel & Footwear",
        "description": "Lightweight sweat-wicking fabric with anti-odor treatment designed to keep you cool and dry during intense training sessions.",
        "price": Decimal("1495.00"),
        "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
        "tags": ["apparel", "fitness", "workout", "dri-fit", "training"],
    },
    {
        "name": "Nike Club Fleece Pullover Hoodie",
        "brand": "Nike",
        "category": "Apparel & Footwear",
        "description": "Brushed-back fleece for a soft, warm feel. Classic ribbed cuffs and kangaroo front pocket in standard comfortable fit.",
        "price": Decimal("3295.00"),
        "image_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800",
        "tags": ["hoodie", "fleece", "casual", "streetwear", "warm"],
    },
]


class Command(BaseCommand):
    help = "Seed database idempotently with demo brands, categories, products, and a demo user."

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")

        with transaction.atomic():
            # 1. Admin User (Role: admin, full system rights)
            admin_user, admin_created = User.objects.get_or_create(
                email=ADMIN_USER_EMAIL,
                defaults={
                    "full_name": "CatalogIQ Administrator",
                    "is_active": True,
                    "is_staff": True,
                    "is_superuser": True,
                },
            )
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.set_password(ADMIN_USER_PASSWORD)
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"Configured Admin user: {ADMIN_USER_EMAIL}"))

            # 2. Demo User (Role: admin, convenience reviewer)
            demo_user, _ = User.objects.get_or_create(
                email=DEMO_USER_EMAIL,
                defaults={
                    "full_name": "Demo Reviewer",
                    "is_active": True,
                    "is_staff": True,
                },
            )
            demo_user.is_staff = True
            demo_user.set_password(DEMO_USER_PASSWORD)
            demo_user.save()

            # 3. Standard User (Role: user, owner-isolated rights)
            std_user, _ = User.objects.get_or_create(
                email=STANDARD_USER_EMAIL,
                defaults={
                    "full_name": "Standard Shopper",
                    "is_active": True,
                    "is_staff": False,
                    "is_superuser": False,
                },
            )
            std_user.is_staff = False
            std_user.is_superuser = False
            std_user.set_password(STANDARD_USER_PASSWORD)
            std_user.save()
            self.stdout.write(self.style.SUCCESS(f"Configured Standard user: {STANDARD_USER_EMAIL}"))


            # 2. Brands
            brand_map = {}
            for name in BRANDS_DATA:
                brand, _ = Brand.objects.get_or_create(name=name)
                brand_map[name] = brand
            self.stdout.write(self.style.SUCCESS(f"Verified {len(brand_map)} brands."))

            # 3. Categories
            category_map = {}
            for name in CATEGORIES_DATA:
                category, _ = Category.objects.get_or_create(name=name)
                category_map[name] = category
            self.stdout.write(self.style.SUCCESS(f"Verified {len(category_map)} categories."))

            # 4. Products
            created_count = 0
            for item in PRODUCTS_DATA:
                brand = brand_map[item["brand"]]
                category = category_map[item["category"]]
                item_stock = item.get("stock", 25)
                product = Product.objects.filter(name=item["name"]).first()
                if not product:
                    product = Product.objects.create(
                        name=item["name"],
                        brand=brand,
                        category=category,
                        description=item["description"],
                        price=item["price"],
                        stock=item_stock,
                        image_url=item["image_url"],
                        tags=item["tags"],
                        created_by=admin_user,
                        is_active=True,
                    )
                    created_count += 1
                else:
                    update_fields = []
                    if product.created_by is None:
                        product.created_by = admin_user
                        update_fields.append("created_by")
                    if product.stock == 0:
                        product.stock = item_stock
                        update_fields.append("stock")
                    if update_fields:
                        product.save(update_fields=update_fields)

            # Ensure any other products in DB that have 0 stock get realistic stock
            Product.objects.filter(stock=0).update(stock=18)


            self.stdout.write(
                self.style.SUCCESS(
                    f"Created {created_count} new products (Total active: {Product.objects.count()})."
                )
            )
            self.stdout.write(self.style.SUCCESS("Demo database seed complete!"))
