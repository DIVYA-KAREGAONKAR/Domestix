from django.urls import path
from .views import (
    RegisterView, ProfileView, CustomTokenObtainPairView,
    worker_profile, upload_worker_image
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("token/", CustomTokenObtainPairView.as_view(), name="token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", ProfileView.as_view(), name="profile"),  # general user profile
    path("worker/profile/", worker_profile, name="worker-profile"),
    path("worker/profile/upload-image/", upload_worker_image, name="worker-upload-image"),
]
