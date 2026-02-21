from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, UserProfileViewSet, OrderViewSet, AuthViewSet, NewItemViewSet, EditableContentViewSet, upload_blog_image

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'new-items', NewItemViewSet)
router.register(r'editable-content', EditableContentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('blog-upload-image/', upload_blog_image, name='upload_blog_image'),
]


