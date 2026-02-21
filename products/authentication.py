from rest_framework.authentication import SessionAuthentication


class NoCSRFSessionAuthentication(SessionAuthentication):
    """
    Кастомный класс аутентификации, который отключает CSRF проверку
    для API запросов (только для разработки!)
    """
    def enforce_csrf(self, request):
        # Отключаем CSRF проверку для всех API запросов
        return  # Не проверяем CSRF







