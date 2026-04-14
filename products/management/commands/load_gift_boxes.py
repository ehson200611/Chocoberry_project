from django.core.management.base import BaseCommand
from products.models import Product

GIFT_BOXES = [
    {
        "name": "Бокс \"MAMA\"",
        "description": "Клубника в шоколаде, оформленная в форме букв \"MAMA\". Идеальный подарок для мамы с любовью и заботой. Включает 20+ клубник в шоколаде, свежие ягоды и мяту, праздничную упаковку.",
        "price": 180.00,
        "image": None,
    },
    {
        "name": "Бокс \"I LOVE U\"",
        "description": "Романтический подарок в форме \"I LOVE U\" с сердцем. Клубника в шоколаде для особенного человека. Включает 25+ клубник в шоколаде, голубику и декорации, сердечную упаковку.",
        "price": 220.00,
        "image": None,
    },
    {
        "name": "Бокс \"LOVE\"",
        "description": "Элегантный бокс со словом \"LOVE\", где буква \"O\" выполнена в форме сердца. Для выражения чувств. Включает 22+ клубник в шоколаде, свежую мяту и голубику, золотые акценты.",
        "price": 200.00,
        "image": None,
    },
    {
        "name": "Сердце Премиум",
        "description": "Большой чёрный бокс в форме сердца, наполненный клубникой в шоколаде с золотыми бабочками и декорациями. Включает 30+ клубник в шоколаде, золотые бабочки и надписи, премиум упаковку.",
        "price": 280.00,
        "image": None,
    },
    {
        "name": "Красное Сердце",
        "description": "Яркий красный бокс в форме сердца с золотой лентой. Переполнен клубникой в шоколаде и свежими ягодами. Включает 28+ клубник в шоколаде, голубику и малину, золотую ленту.",
        "price": 250.00,
        "image": None,
    },
    {
        "name": "Сердце Классик",
        "description": "Классический бокс в форме сердца с клубникой в шоколаде, голубикой и декоративными элементами. Включает 24+ клубник в шоколаде, свежие ягоды, элегантную упаковку.",
        "price": 190.00,
        "image": None,
    },
]

class Command(BaseCommand):
    help = 'Загружает подарочные боксы в базу данных'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0
        
        for box_data in GIFT_BOXES:
            product, created = Product.objects.get_or_create(
                name=box_data["name"],
                defaults={
                    "description": box_data["description"],
                    "price": box_data["price"],
                    "image": box_data.get("image"),
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Создан подарочный бокс: {product.name} - {product.price} сомони')
                )
            else:
                # Обновляем существующий продукт
                product.description = box_data["description"]
                product.price = box_data["price"]
                product.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'⊘ Обновлен: {product.name} - {product.price} сомони')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Создано подарочных боксов: {created_count}')
        )
        if updated_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'✓ Обновлено подарочных боксов: {updated_count}')
            )










