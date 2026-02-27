# Email OTP Operations Runbook

## 1. Ownership
- Primary owner: DevOps or Platform team.
- Secondary owner: Backend lead.
- Access to email credentials must be restricted and audited.

## 2. Recommended Email Provider
- Use a transactional provider (SendGrid, Postmark, SES, Mailgun).
- Use a domain sender identity (example: `no-reply@yourdomain.com`), not personal email.

## 3. Required Environment Variables
- Copy `.env.example` and set real values in your hosting secrets manager.
- Never commit secrets to git.

## 4. Domain Security
- Configure SPF, DKIM, and DMARC for your sending domain.
- Keep alignment strict (`From` domain == authenticated domain).

## 5. OTP Security Controls Implemented
- OTP codes are stored hashed (`code_hash`) and never stored as plain values.
- Server-side registration requires recent verified OTP.
- Rate limits:
  - resend cooldown
  - max sends per hour
  - max verify attempts per OTP
- OTP expiration is configurable.

## 6. Rotation Policy
- Rotate SMTP/API credentials every 60-90 days.
- Rotate immediately after any suspected leak.
- Keep separate credentials per environment (`dev`, `staging`, `prod`).

## 7. Monitoring
- Track:
  - OTP send success/failure rate
  - 429 rate-limit hits
  - OTP verification success rate
- Alert on unusual failure spikes.

## 8. Incident Response
- If compromised:
  - rotate credentials immediately
  - invalidate active sessions if needed
  - check logs for abuse window
  - increase OTP strictness temporarily

