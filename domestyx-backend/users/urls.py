from django.urls import path
from .views import (
    RegisterView, ProfileView, CustomTokenObtainPairView,
    worker_profile, upload_worker_image
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView
)

urlpatterns = [
    # Auth Endpoints
    path("register/", RegisterView.as_view(), name="register"),
    
    # ✅ Using your Custom view instead of the default one to include user roles
    path("token/", CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    
    # Profile Endpoints
    path("profile/", ProfileView.as_view(), name="profile"),  # General user profile
    path("worker/profile/", worker_profile, name="worker-profile"),
    path("worker/profile/upload-image/", upload_worker_image, name="worker-upload-image"),
]