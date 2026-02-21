from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.utils.html import format_html
from django.db.models import Count
from .models import Product, UserProfile, Order, NewItem, EditableContent

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'price', 'image_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    readonly_fields = ['image_preview', 'created_at', 'updated_at']
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'description', 'price')
        }),
        ('Изображение', {
            'fields': ('image', 'image_preview')
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 100px; border-radius: 4px;" />',
                obj.image.url
            )
        return "Нет изображения"
    image_preview.short_description = "Превью"




@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_profile', 'total_price', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user_profile__name', 'user_profile__phone']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'telegram_message_id']
    
    fieldsets = (
        ('Информация о заказе', {
            'fields': ('user_profile', 'items', 'total_price', 'status')
        }),
        ('Telegram', {
            'fields': ('telegram_message_id',)
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(NewItem)
class NewItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'order', 'is_active', 'background_image_preview', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['order', '-created_at']
    readonly_fields = ['background_image_preview', 'created_at', 'updated_at']
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'description', 'order', 'is_active')
        }),
        ('Изображение', {
            'fields': ('background_image', 'background_image_preview')
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def background_image_preview(self, obj):
        if obj.background_image:
            return format_html(
                '<img src="{}" style="max-height: 150px; max-width: 200px; border-radius: 8px; object-fit: cover;" />',
                obj.background_image.url
            )
        return "Нет изображения"
    background_image_preview.short_description = "Превью"


@admin.register(EditableContent)
class EditableContentAdmin(admin.ModelAdmin):
    list_display = ['id', 'key', 'page', 'content_preview', 'updated_at']
    list_filter = ['page', 'updated_at', 'created_at']
    search_fields = ['key', 'content', 'page']
    ordering = ['page', 'key']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['page']  # Позволяет быстро менять страницу
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('key', 'page', 'content')
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def content_preview(self, obj):
        preview = obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
        return preview
    content_preview.short_description = "Превью"
    
    actions = ['duplicate_content']
    
    def duplicate_content(self, request, queryset):
        """Дублировать выбранный контент"""
        for content in queryset:
            EditableContent.objects.create(
                key=f"{content.key}_copy",
                content=content.content,
                page=content.page
            )
        self.message_user(request, f"Дублировано {queryset.count()} элементов")
    duplicate_content.short_description = "Дублировать выбранные элементы"


# Кастомизация админки User для отображения количества пользователей
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Профиль'
    fk_name = 'user'


class CustomUserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = BaseUserAdmin.list_display + ('user_count_display', 'profile_link')
    
    def user_count_display(self, obj):
        """Отображает общее количество пользователей"""
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        return format_html(
            '<strong>Всего: {}</strong><br><span style="color: green;">Активных: {}</span>',
            total_users,
            active_users
        )
    user_count_display.short_description = "Статистика пользователей"
    
    def profile_link(self, obj):
        """Ссылка на профиль пользователя"""
        try:
            profile = obj.profile
            return format_html(
                '<a href="/admin/products/userprofile/{}/change/">Профиль</a>',
                profile.id
            )
        except UserProfile.DoesNotExist:
            return "Нет профиля"
    profile_link.short_description = "Профиль"
    
    def get_inline_instances(self, request, obj=None):
        if not obj:
            return list()
        return super().get_inline_instances(request, obj)


# Перерегистрируем UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


# Добавляем статистику пользователей в другие админки
@admin.register(UserProfile)
class UserProfileAdminWithStats(admin.ModelAdmin):
    list_display = ['id', 'name', 'phone', 'photo_preview', 'user_count_display', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'phone', 'address']
    ordering = ['-created_at']
    readonly_fields = ['photo_preview', 'created_at', 'updated_at', 'user_count_display']
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'phone', 'address')
        }),
        ('Фото профиля', {
            'fields': ('photo', 'photo_preview')
        }),
        ('Статистика', {
            'fields': ('user_count_display',),
            'classes': ('collapse',)
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def photo_preview(self, obj):
        if obj.photo:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 100px; border-radius: 50%; object-fit: cover;" />',
                obj.photo.url
            )
        return "Нет фото"
    photo_preview.short_description = "Фото"
    
    def user_count_display(self, obj):
        """Отображает общее количество пользователей"""
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        total_profiles = UserProfile.objects.count()
        return format_html(
            '<div style="padding: 10px; background: #f0f0f0; border-radius: 5px;">'
            '<strong>Всего пользователей: {}</strong><br>'
            '<span style="color: green;">Активных: {}</span><br>'
            '<span style="color: blue;">Профилей: {}</span>'
            '</div>',
            total_users,
            active_users,
            total_profiles
        )
    user_count_display.short_description = "Статистика пользователей"
