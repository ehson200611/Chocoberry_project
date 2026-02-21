from django.core.management.base import BaseCommand
from products.models import Product

class Command(BaseCommand):
    help = 'Очищает несуществующие пути изображений в базе данных'

    def handle(self, *args, **options):
        products = Product.objects.exclude(image__isnull=True).exclude(image='')
        cleared_count = 0
        
        for product in products:
            # Очищаем пути, которые указывают на несуществующие файлы
            if product.image and ('/images/' in str(product.image) or str(product.image).startswith('/images')):
                self.stdout.write(
                    self.style.WARNING(f'Очищен путь изображения для: {product.name} (было: {product.image})')
                )
                product.image = None
                product.save()
                cleared_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Очищено продуктов: {cleared_count}')
        )





