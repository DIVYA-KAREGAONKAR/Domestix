# Render Deployment Checklist (Production)

## 1. Services
- Backend: Render Web Service (Python).
- Frontend: Render Static Site (Vite build output).

## 2. Backend Render Settings
- Build Command: `./build.sh`
- Start Command: `gunicorn domestyx_backend.wsgi:application --bind 0.0.0.0:$PORT`

## 3. Required Backend Environment Variables
- `ENVIRONMENT=production`
- `DEBUG=False`
- `SECRET_KEY=<long-random-secret>`
- `DATABASE_URL=<managed-db-url>` (recommended)
- `ALLOWED_HOSTS=<backend-hostname>`
- `CORS_ALLOWED_ORIGINS=<frontend-url>`
- `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`
- `EMAIL_HOST=<provider-host>`
- `EMAIL_PORT=587`
- `EMAIL_USE_TLS=True`
- `EMAIL_HOST_USER=<smtp-user>`
- `EMAIL_HOST_PASSWORD=<smtp-password-or-api-key>`
- `DEFAULT_FROM_EMAIL=Domestyx <no-reply@yourdomain.com>`
- `OTP_REQUIRE_VERIFIED_EMAIL_ON_REGISTER=True`

## 4. Frontend Environment Variables
- `VITE_API_URL=<backend-public-url>`

## 5. DNS and Mail Security
- Configure SPF, DKIM, and DMARC for your sender domain.
- Use a transactional email provider (SendGrid/SES/Postmark/Mailgun), not personal mailbox credentials.

## 6. After Deploy Validation
- Register with OTP flow (worker + employer).
- Login with the same credentials after logout.
- Check OTP throttling:
  - resend too fast -> 429
  - too many sends per hour -> 429

