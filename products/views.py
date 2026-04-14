from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.contrib.auth import login, logout
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.files.storage import default_storage
from django.conf import settings
import os
from datetime import datetime
from .models import Product, UserProfile, Order, NewItem, EditableContent, ChatMessage
from .serializers import (
    ProductSerializer, 
    UserProfileSerializer, 
    OrderSerializer,
    OrderCreateSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    NewItemSerializer,
    EditableContentSerializer
)
from .telegram_service import send_order_to_telegram, update_order_message, answer_callback, set_webhook, notify_admin_new_message, test_support_bot
import json

@method_decorator(csrf_exempt, name='dispatch')
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        """
        Разрешения:
        - GET (list, retrieve): доступно всем
        - POST, PUT, PATCH, DELETE: требуется авторизация
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def partial_update(self, request, *args, **kwargs):
        # Логируем для отладки
        print(f"PATCH request - User: {request.user}, Authenticated: {request.user.is_authenticated}")
        print(f"Session key: {request.session.session_key}")
        return super().partial_update(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def list_all(self, request):
        products = Product.objects.all()
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [AllowAny]  # Разрешаем всем получать профили
    
    def get_permissions(self):
        """Переопределяем разрешения для разных методов"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        """Возвращаем только профиль текущего пользователя для авторизованных"""
        if self.request.user.is_authenticated:
            return UserProfile.objects.filter(user=self.request.user)
        return UserProfile.objects.none()
    
    def retrieve(self, request, *args, **kwargs):
        """Получить профиль текущего пользователя"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Пользователь не авторизован'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            profile = request.user.profile
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Профиль не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Получить профиль текущего пользователя"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Пользователь не авторизован'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            profile = request.user.profile
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Профиль не найден. Пожалуйста, заполните данные профиля.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def partial_update(self, request, *args, **kwargs):
        """Обновление профиля текущего пользователя"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Пользователь не авторизован'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            # Получаем профиль текущего пользователя
            profile = request.user.profile
            
            # Удаляем телефон из данных перед обновлением (телефон нельзя менять)
            data = request.data.copy()
            if 'phone' in data:
                data.pop('phone')
            
            serializer = self.get_serializer(profile, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Профиль не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Ошибка при обновлении профиля: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def by_phone(self, request):
        """Получить профиль по телефону"""
        phone = request.query_params.get('phone', None)
        if not phone:
            return Response(
                {'error': 'Параметр phone обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            profile = UserProfile.objects.get(phone=phone)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Профиль не найден'},
                status=status.HTTP_404_NOT_FOUND
            )


@method_decorator(csrf_exempt, name='dispatch')
class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Возвращаем заказы только текущего пользователя"""
        if self.request.user.is_authenticated:
            try:
                profile = self.request.user.profile
                return Order.objects.filter(user_profile=profile).order_by('-created_at')
            except UserProfile.DoesNotExist:
                pass
        return Order.objects.none()

    def create(self, request, *args, **kwargs):
        # Если пользователь авторизован и имеет профиль, используем данные из профиля
        if request.user.is_authenticated:
            try:
                user_profile = request.user.profile
                # Используем данные из профиля пользователя
                name = user_profile.name
                phone = user_profile.phone
                address = user_profile.address
                
                # Проверяем, что все необходимые данные есть
                if not name or not phone or not address:
                    return Response(
                        {
                            'error': 'В профиле отсутствуют необходимые данные. Пожалуйста, заполните имя, телефон и адрес в профиле.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Валидируем только items и total_price из запроса
                items = request.data.get('items', [])
                total_price = request.data.get('total_price')
                
                if not items:
                    return Response(
                        {'error': 'Корзина пуста'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if not total_price:
                    return Response(
                        {'error': 'Не указана общая сумма заказа'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                created = False
                
            except UserProfile.DoesNotExist:
                # Профиль не существует - возвращаем ошибку
                return Response(
                    {
                        'error': 'Профиль пользователя не найден. Пожалуйста, заполните данные профиля.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Пользователь не авторизован - используем данные из запроса
            serializer = OrderCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            name = serializer.validated_data['name']
            phone = serializer.validated_data['phone']
            address = serializer.validated_data['address']
            items = serializer.validated_data['items']
            total_price = serializer.validated_data['total_price']
            
            # Создаем или получаем профиль пользователя по телефону
            user_profile, created = UserProfile.objects.get_or_create(
                phone=phone,
                defaults={
                    'name': name,
                    'address': address,
                }
            )
            
            # Обновляем профиль, если он уже существовал
            if not created:
                user_profile.name = name
                user_profile.address = address
                user_profile.save()
        
        # Создаем заказ
        try:
            order = Order.objects.create(
                user_profile=user_profile,
                items=items,
                total_price=total_price,
            )
        except Exception as e:
            return Response(
                {'error': f'Ошибка при создании заказа: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Отправляем заказ в Telegram
        try:
            message_id = send_order_to_telegram(order, user_profile)
            if message_id:
                order.telegram_message_id = str(message_id)
                order.save()
        except Exception as e:
            # Не критично, если не удалось отправить в Telegram
            print(f"Ошибка при отправке заказа в Telegram: {str(e)}")
        
        # Возвращаем заказ с информацией о профиле
        response_serializer = OrderSerializer(order)
        response_data = response_serializer.data
        response_data['profile_created'] = created
        response_data['profile_id'] = user_profile.id
        return Response(response_data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    def dispatch(self, request, *args, **kwargs):
        # Отключаем CSRF для всех методов этого ViewSet
        setattr(request, '_dont_enforce_csrf_checks', True)
        return super().dispatch(request, *args, **kwargs)
    
    def get_permissions(self):
        """Переопределяем разрешения для разных методов"""
        if self.action in ['logout', 'me']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Регистрация нового пользователя"""
        serializer = UserRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Сохраняем пользователя (профиль создается в сериализаторе)
            user = serializer.save()
            
            # Проверяем, что профиль создан
            try:
                profile = UserProfile.objects.get(user=user)
            except UserProfile.DoesNotExist:
                # Если профиль не создан, возвращаем ошибку
                user.delete()  # Удаляем пользователя, если профиль не создан
                return Response(
                    {'error': 'Ошибка при создании профиля. Пожалуйста, попробуйте снова.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Автоматически входим после регистрации
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            
            # Сохраняем сессию явно
            request.session.save()
            request.session.modified = True
            
            # Обновляем пользователя и профиль из БД
            user.refresh_from_db()
            profile.refresh_from_db()
            
            # Сериализуем пользователя с профилем
            user_serializer = UserSerializer(user, context={'request': request})
            
            return Response({
                'user': user_serializer.data,
                'message': 'Регистрация успешна'
            }, status=status.HTTP_201_CREATED)
            
        except serializers.ValidationError as e:
            # Ошибка валидации из сериализатора
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import traceback
            error_message = str(e)
            traceback.print_exc()
            return Response(
                {'error': f'Ошибка при регистрации: {error_message}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """Вход пользователя"""
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.validated_data['user']
                # Авторизуем пользователя
                login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                # Обновляем сессию
                request.session.save()
                
                # Получаем обновленные данные пользователя с профилем
                user.refresh_from_db()
                if hasattr(user, 'profile'):
                    user.profile.refresh_from_db()
                
                user_serializer = UserSerializer(user, context={'request': request})
                return Response({
                    'user': user_serializer.data,
                    'message': 'Вход выполнен успешно'
                }, status=status.HTTP_200_OK)
            except Exception as e:
                import traceback
                traceback.print_exc()
                return Response(
                    {'error': f'Ошибка при входе: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        # Обработка ошибок валидации
        error_message = "Неверный номер телефона или пароль"
        if serializer.errors:
            # Если ошибка - словарь
            if isinstance(serializer.errors, dict):
                non_field_errors = serializer.errors.get('non_field_errors', [])
                if non_field_errors:
                    error_message = non_field_errors[0] if isinstance(non_field_errors, list) else str(non_field_errors)
                else:
                    # Берем первую ошибку
                    first_key = list(serializer.errors.keys())[0]
                    first_error = serializer.errors[first_key]
                    if isinstance(first_error, list):
                        error_message = first_error[0]
                    else:
                        error_message = str(first_error)
            else:
                error_message = str(serializer.errors)
        
        return Response({'error': error_message}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """Выход пользователя"""
        logout(request)
        return Response({'message': 'Выход выполнен успешно'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def admin_stats(self, request):
        """Статистика для суперадминов: кол-во пользователей и заказов"""
        if not request.user.is_authenticated or not request.user.is_superuser:
            return Response(
                {'error': 'Доступ запрещён'},
                status=status.HTTP_403_FORBIDDEN
            )
        total_users = User.objects.count()
        total_orders = Order.objects.count()
        return Response({
            'total_users': total_users,
            'total_orders': total_orders,
        })

    @action(detail=False, methods=['get'])
    def admin_all_orders(self, request):
        """Все заказы для суперадмина"""
        if not request.user.is_authenticated or not request.user.is_superuser:
            return Response({'error': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        try:
            from django.db.models import Sum
            orders = Order.objects.select_related('user_profile').order_by('-created_at')
            data = []
            for o in orders:
                try:
                    profile = o.user_profile
                    name    = profile.name    if profile else '—'
                    phone   = profile.phone   if profile else '—'
                    address = profile.address if profile else '—'
                except Exception:
                    name = phone = address = '—'
                try:
                    items = o.items if o.items else []
                except Exception:
                    items = []
                data.append({
                    'id': o.id,
                    'name': name,
                    'phone': phone,
                    'address': address,
                    'items': items,
                    'total_price': str(o.total_price),
                    'status': o.status,
                    'created_at': o.created_at.strftime('%d.%m.%Y %H:%M'),
                })
            total_sum = orders.aggregate(s=Sum('total_price'))['s'] or 0
            return Response({
                'orders': data,
                'total': len(data),
                'total_sum': str(total_sum),
                'pending': orders.filter(status='pending').count(),
                'completed': orders.filter(status='completed').count(),
            })
        except Exception as e:
            return Response({'error': str(e), 'orders': [], 'total': 0, 'total_sum': '0', 'pending': 0, 'completed': 0}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def admin_all_users(self, request):
        """Все пользователи для суперадмина"""
        if not request.user.is_authenticated or not request.user.is_superuser:
            return Response({'error': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        from django.db.models import Sum, Count
        users = User.objects.prefetch_related('profile__orders').order_by('-date_joined')
        data = []
        for u in users:
            try:
                p = u.profile
                orders_count = p.orders.count()
                orders_sum = p.orders.aggregate(s=Sum('total_price'))['s'] or 0
                name = p.name
                phone = p.phone
                address = p.address
                photo_url = request.build_absolute_uri(p.photo.url) if p.photo else None
            except Exception:
                orders_count, orders_sum = 0, 0
                name, phone, address, photo_url = '', '', '', None
            data.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'name': name,
                'phone': phone,
                'address': address,
                'photo_url': photo_url,
                'is_superuser': u.is_superuser,
                'is_active': u.is_active,
                'orders_count': orders_count,
                'orders_sum': str(orders_sum),
                'date_joined': u.date_joined.strftime('%d.%m.%Y'),
            })
        return Response({'users': data, 'total': len(data)})

    @action(detail=False, methods=['patch'])
    def admin_update_order_status(self, request):
        """Обновить статус заказа (только для суперадмина)"""
        if not request.user.is_authenticated or not request.user.is_superuser:
            return Response({'error': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        order_id = request.data.get('order_id')
        new_status = request.data.get('status')
        if not order_id or not new_status:
            return Response({'error': 'order_id и status обязательны'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            order = Order.objects.select_related('user_profile').get(id=order_id)
            order.status = new_status
            order.save()
            # Обновляем сообщение в Telegram
            try:
                update_order_message(order, order.user_profile, new_status)
            except Exception:
                pass
            return Response({'success': True, 'id': order_id, 'status': new_status})
        except Order.DoesNotExist:
            return Response({'error': 'Заказ не найден'}, status=status.HTTP_404_NOT_FOUND)

    # ─── CHAT ──────────────────────────────────────────────────
    @action(detail=False, methods=['get', 'post'])
    def my_chat(self, request):
        """Клиент: получить/отправить сообщения чата"""
        if not request.user.is_authenticated:
            return Response({'error': 'Требуется авторизация'}, status=status.HTTP_401_UNAUTHORIZED)

        if request.method == 'GET':
            # Отмечаем сообщения от admin как прочитанные
            ChatMessage.objects.filter(user=request.user, sender='admin', is_read=False).update(is_read=True)
            msgs = ChatMessage.objects.filter(user=request.user).order_by('created_at')
            data = [{'id': m.id, 'message': m.message, 'sender': m.sender,
                     'created_at': m.created_at.strftime('%H:%M'), 'is_read': m.is_read} for m in msgs]
            return Response({'messages': data})

        # POST — отправить сообщение
        text = (request.data.get('message') or '').strip()
        if not text:
            return Response({'error': 'Сообщение пустое'}, status=status.HTTP_400_BAD_REQUEST)
        msg = ChatMessage.objects.create(user=request.user, message=text, sender='client')
        try:
            notify_admin_new_message(request.user, text)
        except Exception as e:
            print(f"Error sending Telegram notification: {e}")
            import traceback
            traceback.print_exc()
        return Response({'id': msg.id, 'message': msg.message, 'sender': 'client',
                         'created_at': msg.created_at.strftime('%H:%M')})

    @action(detail=False, methods=['get'])
    def chat_unread(self, request):
        """Кол-во непрочитанных сообщений от admin для текущего клиента"""
        if not request.user.is_authenticated:
            return Response({'count': 0})
        count = ChatMessage.objects.filter(user=request.user, sender='admin', is_read=False).count()
        return Response({'count': count})

    @action(detail=False, methods=['get'])
    def admin_chats(self, request):
        """Список всех пользователей с чатами (для суперадмина)"""
        if not request.user.is_authenticated or not request.user.is_superuser:
            return Response({'error': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        from django.db.models import Count, Max, Q
        users = (User.objects
                 .filter(chat_messages__isnull=False)
                 .distinct()
                 .annotate(
                     unread=Count('chat_messages', filter=Q(chat_messages__sender='client', chat_messages__is_read=False)),
                     last_time=Max('chat_messages__created_at'))
                 .order_by('-last_time'))
        data = []
        for u in users:
            last = ChatMessage.objects.filter(user=u).order_by('-created_at').first()
            try:
                name = u.profile.name or u.username
                phone = u.profile.phone or ''
            except Exception:
                name = u.username
                phone = ''
            data.append({
                'user_id': u.id,
                'username': u.username,
                'name': name,
                'phone': phone,
                'unread': u.unread,
                'last_message': last.message[:60] if last else '',
                'last_time': last.created_at.strftime('%H:%M') if last else '',
                'last_sender': last.sender if last else '',
            })
        return Response({'chats': data})

    @action(detail=False, methods=['get', 'post'])
    def admin_chat_messages(self, request):
        """Суперадмин: получить историю / ответить пользователю"""
        if not request.user.is_authenticated or not request.user.is_superuser:
            return Response({'error': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        user_id = request.query_params.get('user_id') or request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id обязателен'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            ChatMessage.objects.filter(user=target, sender='client', is_read=False).update(is_read=True)
            msgs = ChatMessage.objects.filter(user=target).order_by('created_at')
            try:
                name = target.profile.name or target.username
            except Exception:
                name = target.username
            data = [{'id': m.id, 'message': m.message, 'sender': m.sender,
                     'created_at': m.created_at.strftime('%H:%M %d.%m'), 'is_read': m.is_read} for m in msgs]
            return Response({'messages': data, 'user_name': name, 'user_id': target.id})

        # POST — reply
        text = (request.data.get('message') or '').strip()
        if not text:
            return Response({'error': 'Сообщение пустое'}, status=status.HTTP_400_BAD_REQUEST)
        msg = ChatMessage.objects.create(user=target, message=text, sender='admin')
        return Response({'id': msg.id, 'message': msg.message, 'sender': 'admin',
                         'created_at': msg.created_at.strftime('%H:%M %d.%m')})

    # ─── TELEGRAM WEBHOOK ─────────────────────────────────────
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def telegram_webhook(self, request):
        """Webhook от Telegram — обработка нажатий кнопок"""
        try:
            data = request.data if isinstance(request.data, dict) else json.loads(request.body)

            # Обрабатываем callback_query (нажатие кнопки)
            callback = data.get('callback_query')
            if callback:
                callback_id   = callback.get('id')
                callback_data = callback.get('data', '')

                # Формат: order_{order_id}_{status}
                if callback_data.startswith('order_'):
                    parts = callback_data.split('_', 2)
                    if len(parts) == 3:
                        _, order_id_str, new_status = parts
                        try:
                            order = Order.objects.select_related('user_profile').get(id=int(order_id_str))
                            old_status = order.status
                            order.status = new_status
                            order.save()

                            STATUS_LABELS = {
                                'confirmed':  '✅ Одобрен',
                                'preparing':  '🍳 Готовится',
                                'delivering': '🚗 Доставляется',
                                'completed':  '🎉 Завершён',
                                'cancelled':  '❌ Отменён',
                            }
                            label = STATUS_LABELS.get(new_status, new_status)
                            answer_callback(callback_id, f"{label} — Заказ #{order.id}")

                            # Обновляем сообщение в группе
                            update_order_message(order, order.user_profile, new_status)

                        except Order.DoesNotExist:
                            answer_callback(callback_id, "❌ Заказ не найден")
                        except Exception as e:
                            answer_callback(callback_id, "⚠️ Ошибка")
                            print(f"Webhook order update error: {e}")
                    else:
                        answer_callback(callback_id)
                else:
                    answer_callback(callback_id)

            return Response({'ok': True})
        except Exception as e:
            print(f"Webhook error: {e}")
            return Response({'ok': False}, status=200)  # Always 200 for Telegram

    @action(detail=False, methods=['get'])
    def setup_webhook(self, request):
        """Регистрирует webhook у Telegram (только суперадмин)"""
        if not request.user.is_authenticated or not request.user.is_superuser:
            return Response({'error': 'Доступ запрещён'}, status=403)
        webhook_url = request.build_absolute_uri('/api/auth/telegram_webhook/')
        result = set_webhook(webhook_url)
        return Response(result)

    @action(detail=False, methods=['get'])
    def test_support_bot(self, request):
        """Тест бота поддержки (только суперадмин)"""
        if not request.user.is_authenticated or not request.user.is_superuser:
            return Response({'error': 'Доступ запрещён'}, status=403)
        result = test_support_bot()
        return Response(result)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Получить текущего пользователя"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Пользователь не авторизован'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            # Обновляем пользователя из БД
            request.user.refresh_from_db()
            
            # Проверяем наличие профиля
            try:
                profile = request.user.profile
                profile.refresh_from_db()
            except UserProfile.DoesNotExist:
                # Если профиль не существует, возвращаем пользователя без профиля
                # Frontend может создать профиль позже
                user_serializer = UserSerializer(request.user, context={'request': request})
                return Response(user_serializer.data, status=status.HTTP_200_OK)
            
            # Сериализуем пользователя с профилем
            user_serializer = UserSerializer(request.user, context={'request': request})
            return Response(user_serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Ошибка при получении данных пользователя: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class NewItemViewSet(viewsets.ModelViewSet):
    queryset = NewItem.objects.filter(is_active=True)
    serializer_class = NewItemSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        return NewItem.objects.filter(is_active=True).order_by('order', '-created_at')


class EditableContentViewSet(viewsets.ModelViewSet):
    queryset = EditableContent.objects.all()
    serializer_class = EditableContentSerializer
    permission_classes = [AllowAny]  # Чтение доступно всем
    
    def get_permissions(self):
        # Для создания/обновления требуется авторизация
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'bulk_update', 'bulk_create']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def get_queryset(self):
        """Фильтрация по странице, если указана"""
        queryset = EditableContent.objects.all()
        page = self.request.query_params.get('page', None)
        if page:
            queryset = queryset.filter(page=page)
        return queryset.order_by('page', 'key')
    
    @action(detail=False, methods=['get'])
    def by_key(self, request):
        """Получить контент по ключу"""
        key = request.query_params.get('key', None)
        if not key:
            return Response(
                {'error': 'Параметр key обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            content = EditableContent.objects.get(key=key)
            serializer = self.get_serializer(content)
            return Response(serializer.data)
        except EditableContent.DoesNotExist:
            # Возвращаем дефолтное значение
            return Response({
                'key': key,
                'content': '',
                'page': None
            })
    
    @action(detail=False, methods=['get'])
    def by_page(self, request):
        """Получить весь контент для страницы"""
        page = request.query_params.get('page', None)
        if not page:
            return Response(
                {'error': 'Параметр page обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contents = EditableContent.objects.filter(page=page)
        serializer = self.get_serializer(contents, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pages(self, request):
        """Получить список всех страниц с количеством контента"""
        pages = EditableContent.objects.values('page').distinct()
        result = []
        for page_data in pages:
            page = page_data['page'] or 'Global'
            count = EditableContent.objects.filter(page=page_data['page']).count()
            result.append({
                'page': page,
                'content_count': count
            })
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Массовое обновление контента"""
        contents = request.data.get('contents', [])
        if not contents:
            return Response(
                {'error': 'Параметр contents обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated = []
        errors = []
        
        for content_data in contents:
            key = content_data.get('key')
            if not key:
                errors.append({'error': 'Ключ обязателен для каждого элемента'})
                continue
            
            try:
                content, created = EditableContent.objects.get_or_create(
                    key=key,
                    defaults={
                        'content': content_data.get('content', ''),
                        'page': content_data.get('page', None)
                    }
                )
                
                if not created:
                    # Обновляем существующий контент
                    if 'content' in content_data:
                        content.content = content_data['content']
                    if 'page' in content_data:
                        content.page = content_data['page']
                    content.save()
                
                serializer = self.get_serializer(content)
                updated.append(serializer.data)
            except Exception as e:
                errors.append({'key': key, 'error': str(e)})
        
        return Response({
            'updated': updated,
            'errors': errors,
            'total': len(contents),
            'success': len(updated)
        })
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Массовое создание контента"""
        contents = request.data.get('contents', [])
        if not contents:
            return Response(
                {'error': 'Параметр contents обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created = []
        errors = []
        
        for content_data in contents:
            key = content_data.get('key')
            if not key:
                errors.append({'error': 'Ключ обязателен для каждого элемента'})
                continue
            
            try:
                # Проверяем, существует ли уже контент с таким ключом
                if EditableContent.objects.filter(key=key).exists():
                    errors.append({'key': key, 'error': 'Контент с таким ключом уже существует'})
                    continue
                
                content = EditableContent.objects.create(
                    key=key,
                    content=content_data.get('content', ''),
                    page=content_data.get('page', None)
                )
                
                serializer = self.get_serializer(content)
                created.append(serializer.data)
            except Exception as e:
                errors.append({'key': key, 'error': str(e)})
        
        return Response({
            'created': created,
            'errors': errors,
            'total': len(contents),
            'success': len(created)
        })
    
    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """Массовое удаление контента"""
        keys = request.data.get('keys', [])
        if not keys:
            return Response(
                {'error': 'Параметр keys обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deleted_count = EditableContent.objects.filter(key__in=keys).delete()[0]
        
        return Response({
            'deleted': deleted_count,
            'keys': keys
        })
    
    def create(self, request, *args, **kwargs):
        """Создание или обновление контента (upsert)"""
        key = request.data.get('key')
        if key:
            try:
                existing = EditableContent.objects.get(key=key)
                serializer = self.get_serializer(existing, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            except EditableContent.DoesNotExist:
                pass
        
        return super().create(request, *args, **kwargs)
    
    def list(self, request, *args, **kwargs):
        """Список всего контента с группировкой по страницам"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Группируем по страницам для удобства
        grouped = {}
        for item in serializer.data:
            page = item.get('page') or 'Global'
            if page not in grouped:
                grouped[page] = []
            grouped[page].append(item)
        
        return Response({
            'results': serializer.data,
            'grouped': grouped,
            'total': len(serializer.data)
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_blog_image(request):
    """Загрузка изображения для поста блога"""
    if 'image' not in request.FILES:
        return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    image_file = request.FILES['image']
    key = request.data.get('key', 'blog_image')
    
    # Сохраняем файл в media/blog_images/
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    # Очищаем имя файла от специальных символов
    safe_name = ''.join(c for c in image_file.name if c.isalnum() or c in '.-_')
    filename = f'blog_images/{key}_{timestamp}_{safe_name}'
    file_path = default_storage.save(filename, image_file)
    
    # Получаем URL относительно MEDIA_URL
    image_url = f"{settings.MEDIA_URL}{file_path}"
    # Для абсолютного URL используем build_absolute_uri
    absolute_url = request.build_absolute_uri(image_url)
    
    # Сохраняем URL в EditableContent
    try:
        content, created = EditableContent.objects.get_or_create(
            key=key,
            defaults={'content': absolute_url, 'page': request.data.get('page', 'blog')}
        )
        if not created:
            content.content = absolute_url
            content.save()
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({'image_url': absolute_url}, status=status.HTTP_200_OK)
