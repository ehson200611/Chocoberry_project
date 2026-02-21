from django.core.management.base import BaseCommand
from products.models import Product

INITIAL_PRODUCTS = [
    {
        "name": "Большой бокс с вафлями и фруктами",
        "description": "Мини-вафли, бананы, клубника и шоколадный соус",
        "price": 90.00,
        "image": None,  # Изображение можно загрузить через админ-панель
    },
    {
        "name": "Микс бокс с дубайской ночинки",
        "description": "Вафли с шоколадом, зелёным соусом, киви и клубникой",
        "price": 140.00,
        "image": None,
    },
    {
        "name": "Клубника с дубайский ночинки",
        "description": "Клубника с шоколадом и фисташками в стаканчике",
        "price": 80.00,
        "image": None,
    },
    {
        "name": "Вафли с фруктами",
        "description": "Мини-вафли с бананами и клубникой в шоколаде",
        "price": 30.00,
        "image": None,
    },
    {
        "name": "Гонконгсики вафли фруктовый микс",
        "description": "Большая вафля с клубникой, бананами и шоколадом",
        "price": 45.00,
        "image": None,
    },
    {
        "name": "Трайфл",
        "description": "Шоколадный трайфл с кремом и свежей клубникой",
        "price": 100.00,
        "image": None,
    },
    {
        "name": "Микс бокс",
        "description": "Киви, бананы, манго, клубника и шоколадный соус",
        "price": 90.00,
        "image": None,
    },
    {
        "name": "Клуб-банан (0.3 мл)",
        "description": "Клубника и бананы в стаканчике",
        "price": 30.00,
        "image": None,
    },
    {
        "name": "Клуб-банан (0.4 мл)",
        "description": "Клубника и бананы в большом стаканчике",
        "price": 35.00,
        "image": None,
    },
    {
        "name": "Клубничный (0.3 мл)",
        "description": "Свежая клубника в шоколаде",
        "price": 35.00,
        "image": None,
    },
    {
        "name": "Клубничный (0.4 мл)",
        "description": "Свежая клубника в шоколаде, большой размер",
        "price": 40.00,
        "image": None,
    },
    {
        "name": "Клуб-ананас (0.4 мл)",
        "description": "Клубника и ананас в шоколаде",
        "price": 45.00,
        "image": None,
    },
    {
        "name": "Большой бокс - Клубника",
        "description": "Большая порция свежей клубники",
        "price": 70.00,
        "image": None,
    },
    {
        "name": "Большой бокс - Микс",
        "description": "Большая порция клубники и бананов",
        "price": 70.00,
        "image": None,
    },
]

class Command(BaseCommand):
    help = 'Загружает начальные продукты в базу данных'

    def handle(self, *args, **options):
        created_count = 0
        for product_data in INITIAL_PRODUCTS:
            product, created = Product.objects.get_or_create(
                name=product_data["name"],
                defaults={
                    "description": product_data["description"],
                    "price": product_data["price"],
                    "image": product_data.get("image"),  # Может быть None
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Создан продукт: {product.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⊘ Пропущен (уже существует): {product.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Создано продуктов: {created_count}')
        )

