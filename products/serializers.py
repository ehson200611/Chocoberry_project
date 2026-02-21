from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Product, UserProfile, Order, NewItem, EditableContent

class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'image', 'image_url', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'image_url']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class UserProfileSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()
    phone = serializers.CharField(read_only=True)  # Телефон только для чтения
    photo = serializers.ImageField(required=False, allow_null=True)  # Фото необязательно
    
    class Meta:
        model = UserProfile
        fields = ['id', 'name', 'phone', 'address', 'photo', 'photo_url', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'photo_url', 'phone']
    
    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None
    
    def validate_photo(self, value):
        """Валидация фото"""
        if value:
            print(f"Валидация фото: name={getattr(value, 'name', 'N/A')}, size={getattr(value, 'size', 'N/A')}, content_type={getattr(value, 'content_type', 'unknown')}")
            
            # Проверяем размер файла (макс 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("Размер изображения не должен превышать 10MB")
            
            # Проверяем, что файл не пустой
            if value.size == 0:
                raise serializers.ValidationError("Файл пустой")
            
            # Проверяем тип файла, если доступен
            content_type = getattr(value, 'content_type', None)
            if content_type and not content_type.startswith('image/'):
                raise serializers.ValidationError(f"Файл должен быть изображением. Получен тип: {content_type}")
            
            # Пытаемся открыть изображение через Pillow для проверки (более мягкая проверка)
            try:
                from PIL import Image
                import io
                
                # Сохраняем позицию файла
                if hasattr(value, 'seek'):
                    current_pos = value.tell()
                    value.seek(0)
                else:
                    current_pos = None
                
                # Читаем данные
                if hasattr(value, 'read'):
                    file_data = value.read()
                    value.seek(0) if hasattr(value, 'seek') else None
                else:
                    file_data = value
                
                # Пытаемся открыть как изображение
                img = Image.open(io.BytesIO(file_data) if isinstance(file_data, bytes) else file_data)
                img.verify()  # Проверяем, что файл не поврежден
                
                # Возвращаем позицию обратно
                if hasattr(value, 'seek') and current_pos is not None:
                    value.seek(current_pos)
                    
            except Exception as e:
                print(f"Ошибка при проверке изображения: {str(e)}")
                # Не блокируем загрузку, если это не критичная ошибка
                # Django ImageField сам проверит файл
                pass
        return value


class OrderSerializer(serializers.ModelSerializer):
    user_profile = UserProfileSerializer(read_only=True)
    user_profile_id = serializers.PrimaryKeyRelatedField(
        queryset=UserProfile.objects.all(),
        source='user_profile',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Order
        fields = ['id', 'user_profile', 'user_profile_id', 'items', 'total_price', 'status', 'telegram_message_id', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'status', 'telegram_message_id']


class OrderCreateSerializer(serializers.Serializer):
    """Сериализатор для создания заказа (используется только для неавторизованных пользователей)"""
    name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField()
    items = serializers.ListField(
        child=serializers.DictField(),
        required=True
    )
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    def validate(self, attrs):
        # Проверяем, что все обязательные поля заполнены
        if not attrs.get('items'):
            raise serializers.ValidationError({"items": "Список товаров обязателен"})
        if not attrs.get('total_price'):
            raise serializers.ValidationError({"total_price": "Общая сумма обязательна"})
        if not attrs.get('name'):
            raise serializers.ValidationError({"name": "Имя обязательно"})
        if not attrs.get('phone'):
            raise serializers.ValidationError({"phone": "Телефон обязателен"})
        if not attrs.get('address'):
            raise serializers.ValidationError({"address": "Адрес обязателен"})
        return attrs


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)
    name = serializers.CharField(write_only=True, max_length=200)
    phone = serializers.CharField(write_only=True, max_length=20)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'name', 'phone', 'address']
        # username и email делаем необязательными — будем заполнять автоматически
        extra_kwargs = {
            'username': {'required': False, 'allow_blank': True},
            'email': {'required': False, 'allow_blank': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        
        # Проверяем, существует ли профиль с таким телефоном
        phone = attrs.get('phone')
        if phone:
            existing_profile = UserProfile.objects.filter(phone=phone).first()
            if existing_profile:
                # Если профиль существует, но не привязан к пользователю, привязываем его
                if not existing_profile.user:
                    # Профиль существует без пользователя - можно использовать
                    pass
                else:
                    # Профиль уже привязан к другому пользователю
                    raise serializers.ValidationError({"phone": "Пользователь с таким телефоном уже зарегистрирован"})
        else:
            raise serializers.ValidationError({"phone": "Телефон обязателен"})
        
        # Если username не передан — используем телефон как логин
        if not attrs.get('username'):
            attrs['username'] = phone
        
        return attrs
    
    def create(self, validated_data):
        # Извлекаем данные для профиля
        phone = validated_data['phone']
        name = validated_data['name']
        address = validated_data.get('address', '')
        
        # Проверяем, существует ли профиль с таким телефоном
        existing_profile = None
        try:
            existing_profile = UserProfile.objects.get(phone=phone)
        except UserProfile.DoesNotExist:
            existing_profile = None
        
        # Подготавливаем данные пользователя
        username = validated_data.get('username') or phone
        email = validated_data.get('email', '') or ''
        
        # Создаем пользователя
        user = None
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=validated_data['password']
            )
            
            # Сохраняем пользователя
            user.save()
            
            if existing_profile and not existing_profile.user:
                # Если профиль существует без пользователя, привязываем его к новому пользователю
                existing_profile.user = user
                existing_profile.name = name
                existing_profile.address = address
                existing_profile.save()
                profile = existing_profile
            else:
                # Создаем новый профиль
                profile = UserProfile.objects.create(
                    user=user,
                    name=name,
                    phone=phone,
                    address=address
                )
            
            # Обновляем пользователя из БД, чтобы получить связанный профиль
            user.refresh_from_db()
            
            # Проверяем, что профиль связан с пользователем
            if not hasattr(user, 'profile'):
                # Если профиль не связан, исправляем это
                profile.refresh_from_db()
                if profile.user_id != user.id:
                    profile.user = user
                    profile.save()
                    user.refresh_from_db()
            
            return user
            
        except Exception as e:
            # Если произошла ошибка, удаляем созданного пользователя
            if user and user.id:
                try:
                    user.delete()
                except:
                    pass
            raise serializers.ValidationError({"error": f"Ошибка при создании пользователя: {str(e)}"})


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("Неверное имя пользователя или пароль")
            if not user.is_active:
                raise serializers.ValidationError("Пользователь неактивен")
            attrs['user'] = user
        else:
            raise serializers.ValidationError("Необходимо указать имя пользователя и пароль")
        
        return attrs


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    is_superuser = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile', 'is_superuser']
    
    def get_profile(self, obj):
        """Получить профиль пользователя"""
        try:
            # Проверяем, есть ли у пользователя профиль
            if hasattr(obj, 'profile'):
                profile = obj.profile
                if profile:
                    serializer = UserProfileSerializer(profile, context=self.context)
                    return serializer.data
        except UserProfile.DoesNotExist:
            pass
        except AttributeError:
            pass
        return None


class NewItemSerializer(serializers.ModelSerializer):
    background_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = NewItem
        fields = ['id', 'title', 'description', 'background_image', 'background_image_url', 'order', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'background_image_url']
    
    def get_background_image_url(self, obj):
        if obj.background_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.background_image.url)
            return obj.background_image.url
        return None


class EditableContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EditableContent
        fields = ['id', 'key', 'content', 'page', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
