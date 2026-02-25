# domestyx_backend/urls.py
from django.contrib import admin
from django.urls import path, include

# domestyx_backend/urls.py
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('users.urls')),  # 👈 Empty string means no prefix
    path('', include('jobs.urls')),
]