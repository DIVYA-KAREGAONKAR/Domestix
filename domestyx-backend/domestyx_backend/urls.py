# domestyx_backend/urls.py
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView

# domestyx_backend/urls.py
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('users.urls')),  # 👈 Empty string means no prefix
    path('', include('jobs.urls')),
    # React SPA fallback (serves index.html for client-side routes)
    re_path(r'^(?P<path>.*)/$', TemplateView.as_view(template_name="index.html")),
    path('', TemplateView.as_view(template_name="index.html")),
]
