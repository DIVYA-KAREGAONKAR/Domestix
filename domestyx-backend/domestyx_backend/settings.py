import os
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_env_file():
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ[key] = value


_load_env_file()


def _csv_env_list(key, default):
    value = os.environ.get(key)
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-insecure-key-change-me")

# DEBUG should be False in production
DEBUG = os.environ.get("DEBUG", "True") == "True"
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development").lower()
IS_PRODUCTION = ENVIRONMENT == "production"

# ALLOWED_HOSTS needs to include Render URL and localhost
# Add your Render URL here
ALLOWED_HOSTS = _csv_env_list(
    "ALLOWED_HOSTS",
    ["domestix.onrender.com", "127.0.0.1", "localhost"],
)
# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',  # Required for React-Django communication
    'rest_framework',
    'rest_framework_simplejwt',
    'users', 
    'jobs',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',      # MUST be at the top
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'domestyx_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'domestyx_backend.wsgi.application'

# domestyx_backend/settings.py

# --- Smart Database Logic ---
if os.environ.get("DATABASE_URL"):
    # This runs on RENDER (Production)
    DATABASES = {
        'default': dj_database_url.config(
            conn_max_age=600,
            # No manual SSL options needed for Atlas
        )
    }
else:
    # This runs on your THINKPAD (Local)
    DATABASES = {
        "default": {
            "ENGINE": os.environ.get("DB_ENGINE", "django.db.backends.mysql"),
            "NAME": os.environ.get("DB_NAME", "domestyx_db"),
            "USER": os.environ.get("DB_USER", "root"),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST", "127.0.0.1"),
            "PORT": os.environ.get("DB_PORT", "3306"),
        }
    }
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- Static & Media Files ---
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Custom Settings ---
AUTH_USER_MODEL = "users.CustomUser"

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

# --- CORS settings ---
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = _csv_env_list(
    "CORS_ALLOWED_ORIGINS",
    [
        "http://localhost:5173",
        "http://localhost:8080",
        "https://domestix-1.onrender.com",
        "https://domestix.onrender.com",
    ],
)

# Add Render hostname to ALLOWED_HOSTS automatically
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# --- Email / OTP delivery settings ---
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True") == "True"
EMAIL_USE_SSL = os.environ.get("EMAIL_USE_SSL", "False") == "True"
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_TIMEOUT = int(os.environ.get("EMAIL_TIMEOUT", "10"))
DEFAULT_FROM_EMAIL = os.environ.get(
    "DEFAULT_FROM_EMAIL",
    EMAIL_HOST_USER or "no-reply@domestyx.com",
)

# --- OTP settings ---
OTP_EXPIRY_SECONDS = int(os.environ.get("OTP_EXPIRY_SECONDS", "300"))
OTP_MAX_ATTEMPTS = int(os.environ.get("OTP_MAX_ATTEMPTS", "5"))
OTP_RESEND_COOLDOWN_SECONDS = int(os.environ.get("OTP_RESEND_COOLDOWN_SECONDS", "30"))
OTP_MAX_SENDS_PER_HOUR = int(os.environ.get("OTP_MAX_SENDS_PER_HOUR", "5"))
OTP_VERIFICATION_WINDOW_SECONDS = int(os.environ.get("OTP_VERIFICATION_WINDOW_SECONDS", "1800"))
OTP_REQUIRE_VERIFIED_EMAIL_ON_REGISTER = (
    os.environ.get("OTP_REQUIRE_VERIFIED_EMAIL_ON_REGISTER", "True") == "True"
)
OTP_REQUIRE_VERIFIED_PHONE_ON_REGISTER = (
    os.environ.get("OTP_REQUIRE_VERIFIED_PHONE_ON_REGISTER", "True") == "True"
)

# --- SMS / Phone OTP provider settings ---
SMS_PROVIDER = os.environ.get("SMS_PROVIDER", "console").strip().lower()
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "").strip()
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "").strip()
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER", "").strip()

if IS_PRODUCTION:
    required_prod_settings = [
        ("SECRET_KEY", SECRET_KEY),
        ("EMAIL_HOST_USER", EMAIL_HOST_USER),
        ("EMAIL_HOST_PASSWORD", EMAIL_HOST_PASSWORD),
    ]
    missing = [key for key, value in required_prod_settings if not value or "change-me" in value]
    if missing:
        raise RuntimeError(
            f"Missing required production settings: {', '.join(missing)}. "
            "Set them in environment variables."
        )
