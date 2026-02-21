from django.utils.deprecation import MiddlewareMixin
from django.views.decorators.csrf import csrf_exempt


class DisableCSRFForAPI(MiddlewareMixin):
    """
    Middleware для отключения CSRF проверки для API запросов
    """
    def process_request(self, request):
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        """
        Отключаем CSRF для API views
        """
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None


