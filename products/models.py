from django.db import models
from django.contrib.auth.models import User

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', null=True, blank=True, verbose_name="Пользователь")
    name = models.CharField(max_length=200, verbose_name="Имя")
    phone = models.CharField(max_length=20, verbose_name="Телефон", unique=True)
    address = models.TextField(verbose_name="Адрес")
    photo = models.ImageField(upload_to='profiles/', blank=True, null=True, verbose_name="Фото профиля")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Профиль пользователя"
        verbose_name_plural = "Профили пользователей"
    
    def __str__(self):
        return f"{self.name} - {self.phone}"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает'),
        ('confirmed', 'Подтвержден'),
        ('preparing', 'Готовится'),
        ('delivering', 'Доставляется'),
        ('completed', 'Завершен'),
        ('cancelled', 'Отменен'),
    ]
    
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='orders', verbose_name="Профиль пользователя")
    items = models.JSONField(verbose_name="Товары")  # Список товаров с количеством
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Общая сумма")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Статус")
    telegram_message_id = models.CharField(max_length=100, blank=True, null=True, verbose_name="ID сообщения в Telegram")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"
    
    def __str__(self):
        return f"Заказ #{self.id} - {self.user_profile.name} - {self.total_price} сомони"


class NewItem(models.Model):
    """Модель для новинок/баннеров в секции новинок"""
    title = models.CharField(max_length=200, verbose_name="Заголовок")
    description = models.TextField(blank=True, null=True, verbose_name="Описание")
    background_image = models.ImageField(upload_to='new_items/', verbose_name="Фоновое изображение")
    order = models.IntegerField(default=0, verbose_name="Порядок отображения")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = "Новинка"
        verbose_name_plural = "Новинки"
    
    def __str__(self):
        return self.title


class EditableContent(models.Model):
    """Модель для редактируемого контента на сайте"""
    key = models.CharField(max_length=200, unique=True, verbose_name="Ключ")
    content = models.TextField(verbose_name="Содержимое")
    page = models.CharField(max_length=100, blank=True, null=True, verbose_name="Страница")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['page', 'key']
        verbose_name = "Редактируемый контент"
        verbose_name_plural = "Редактируемый контент"
    
    def __str__(self):
        return f"{self.page or 'Global'}: {self.key}"
