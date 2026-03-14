# domestyx_backend/urls.py
from django.contrib import admin
from django.urls import include, path, re_path

from .views import spa_index


# domestyx_backend/urls.py
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('users.urls')),  # 👈 Empty string means no prefix
    path('', include('jobs.urls')),
    re_path(r'^(?P<path>.*)/$', spa_index),
    path('', spa_index),
]
