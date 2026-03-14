from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponse, HttpResponseNotFound, HttpResponseServerError
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache


@never_cache
def spa_index(request, path: str = "") -> HttpResponse:
    """
    Return the built React entry point for any client route so the SPA router can take over.
    """
    index_path = settings.BASE_DIR / "frontend" / "dist" / "index.html"
    if not index_path.exists():
        return HttpResponseServerError(
            "Frontend build missing; run `npm install && npm run build` inside frontend/."
        )
    try:
        return FileResponse(open(index_path, "rb"), content_type="text/html")
    except OSError as exc:
        return HttpResponse(f"Cannot read SPA entry: {exc}", status=503)
