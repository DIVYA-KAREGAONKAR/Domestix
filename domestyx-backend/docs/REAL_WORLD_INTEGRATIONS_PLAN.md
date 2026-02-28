# Real-World Required Integrations Plan

This document lists only **required** third-party systems for a production deployment of DomestyX (Render + Aiven MySQL), with short purpose notes and an execution plan.

## Required Integrations (No Optional Tools)

1. **Render** (web app hosting, API runtime, worker process)
2. **Aiven MySQL** (primary relational database)
3. **Redis (Upstash Redis or Redis Cloud)** (OTP TTL store, rate-limit counters, background job broker)
4. **Email Provider (Resend)** (email OTP delivery, transactional mails)
5. **SMS Provider (Twilio)** (phone OTP delivery)
6. **Cloudflare Turnstile** (bot abuse protection on signup/login/OTP endpoints)
7. **Object Storage (Cloudflare R2 or AWS S3)** (user document uploads, verification files)
8. **Error Monitoring (Sentry)** (production exception tracking and release diagnostics)
9. **Uptime + Alerting (Better Stack or UptimeRobot)** (API availability monitoring and incident alerts)

## Why These Are Mandatory

- The platform currently requires both email and phone OTP verification, so both an email gateway and SMS gateway are mandatory.
- OTP + auth endpoints need anti-abuse controls, so CAPTCHA + rate limiting + temporary counters are mandatory.
- Production reliability requires monitoring and alerting; without these, outages and failures are not actionable.
- If workers/employers upload identity or compliance documents, external object storage is mandatory (not local filesystem).

## Production Rollout Plan

## Phase 1: Core Runtime and Data

1. Deploy backend/frontend on Render.
2. Connect Render services to Aiven MySQL with SSL.
3. Add managed Redis and wire it to OTP/rate-limits/background tasks.
4. Configure secure environment variables in Render (never hardcode secrets).

Exit criteria:
- App boots in production.
- Database migrations run successfully.
- Redis connectivity check passes.

## Phase 2: Authentication and Abuse Protection

1. Integrate Resend for all transactional email OTP and system mails.
2. Integrate Twilio for phone OTP.
3. Add Turnstile challenge on register/login/OTP send endpoints.
4. Enforce API rate limits using Redis (IP + user + endpoint windows).

Exit criteria:
- Email OTP deliverability confirmed.
- SMS OTP deliverability confirmed.
- Abuse spikes are throttled and logged.

## Phase 3: File Handling and Compliance Safety

1. Integrate R2/S3 for document uploads.
2. Store only object URLs/keys in MySQL; never store large files in DB.
3. Enforce MIME/size validation and access control for private documents.
4. Add retention policy for sensitive documents.

Exit criteria:
- Upload/download works from production.
- Unauthorized access to private files is blocked.

## Phase 4: Observability and Operations

1. Add Sentry SDK to backend and frontend.
2. Configure uptime checks for public endpoints.
3. Configure alert channels (email/SMS/Slack) for downtime and 5xx spikes.
4. Add backup/restore drill for Aiven MySQL and object storage.

Exit criteria:
- Errors are visible in Sentry with stack traces.
- Uptime alerts trigger within expected SLA window.
- Recovery process tested and documented.

## Minimum Environment Variable Checklist

- `DATABASE_URL` (Aiven MySQL)
- `REDIS_URL`
- `RESEND_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `STORAGE_BUCKET_NAME`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`
- `STORAGE_REGION`
- `SENTRY_DSN_BACKEND`
- `SENTRY_DSN_FRONTEND`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `SECRET_KEY`
- `JWT_SIGNING_KEY`

## Go-Live Gate (Must Pass)

1. OTP flow works for both email and phone in production.
2. Rate limiting + Turnstile block scripted abuse.
3. Sentry captures backend and frontend exceptions.
4. Uptime alerts are active and tested.
5. DB backup and restore verification completed.
6. Document upload path is private and access-controlled.

---

Owner note: For this project, these are the baseline integrations expected in a normal real-world deployment; additional tools can be added later but are not required for initial production readiness.
