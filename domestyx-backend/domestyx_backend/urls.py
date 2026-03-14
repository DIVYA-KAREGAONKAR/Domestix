# domestyx_backend/urls.py
from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path, re_path
from django.views.decorators.cache import never_cache

from django.conf import settings


@never_cache
def spa_index(request, path=None):
    index_path = settings.BASE_DIR / "frontend" / "dist" / "index.html"
    try:
        with open(index_path, "rb") as fh:
            return HttpResponse(fh.read(), content_type="text/html")
    except FileNotFoundError:
        return HttpResponse("Frontend build not found. Run `npm run build`.", status=503)

# domestyx_backend/urls.py
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('users.urls')),  # 👈 Empty string means no prefix
    path('', include('jobs.urls')),
    # React SPA fallback (serves index.html for client-side routes)
    re_path(r'^(?P<path>.*)/$', spa_index),
    path('', spa_index),
]
