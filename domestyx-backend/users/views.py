import random
import json
from datetime import timedelta
import logging
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    RegisterSerializer, ProfileSerializer,
    ConsentSerializer, CustomTokenObtainPairSerializer, OTPRequestSerializer,
    OTPVerifySerializer, WorkerProfileSerializer, RecruitmentAgencyProfileSerializer,
    GovernmentProfileSerializer,
    SupportServiceProviderProfileSerializer, AgencyWorkerSubmissionSerializer,
    ComplianceReportSerializer, SupportServiceMessageSerializer, SupportServiceRequestSerializer,
)
from .models import (
    OTPVerification,
    WorkerProfile,
    RecruitmentAgencyProfile,
    GovernmentProfile,
    SupportServiceProviderProfile,
    SupportServiceMessage,
    AgencyWorkerSubmission,
    ComplianceReport,
    SupportServiceRequest,
)
from jobs.models import Application, ChatMessage, ChatThread, EmployerReview, Job, WorkerReview

logger = logging.getLogger(__name__)
User = get_user_model()


def _user_role(user):
    return (getattr(user, "role", "") or "").strip().lower()


def _mask_target(target):
    if "@" in target:
        name, domain = target.split("@", 1)
        if len(name) <= 2:
            return f"{name[0]}***@{domain}"
        return f"{name[:2]}***@{domain}"
    if len(target) <= 4:
        return "*" * len(target)
    return "*" * (len(target) - 4) + target[-4:]


def _send_phone_otp(phone_number, code):
    provider = (getattr(settings, "SMS_PROVIDER", "console") or "console").strip().lower()
    if provider == "twilio":
        account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "")
        auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", "")
        from_number = getattr(settings, "TWILIO_FROM_NUMBER", "")
        if not account_sid or not auth_token or not from_number:
            raise RuntimeError("Twilio SMS credentials are not configured.")
        body = urlencode(
            {
                "From": from_number,
                "To": phone_number,
                "Body": f"Your Domestyx OTP code is {code}. It expires in 5 minutes.",
            }
        ).encode()
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        request = Request(url=url, data=body, method="POST")
        request.add_header("Content-Type", "application/x-www-form-urlencoded")
        auth_bytes = f"{account_sid}:{auth_token}".encode("utf-8")
        import base64
        request.add_header("Authorization", f"Basic {base64.b64encode(auth_bytes).decode('ascii')}")
        with urlopen(request, timeout=10) as response:
            if response.status < 200 or response.status >= 300:
                raise RuntimeError(f"Twilio send failed with status {response.status}")
        return
    if provider == "console":
        logger.info("SMS OTP (console provider) to %s -> %s", _mask_target(phone_number), code)
        return
    raise RuntimeError(f"Unsupported SMS provider: {provider}")


def _send_email_otp(email, code):
    provider = (getattr(settings, "EMAIL_PROVIDER", "smtp") or "smtp").strip().lower()
    if provider == "resend":
        api_key = getattr(settings, "RESEND_API_KEY", "")
        api_url = getattr(settings, "RESEND_API_URL", "https://api.resend.com/emails")
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@domestyx.com")
        if not api_key or not from_email:
            raise RuntimeError("Resend API settings are not configured.")
        body = json.dumps(
            {
                "from": from_email,
                "to": [email],
                "subject": "Domestyx OTP Verification Code",
                "text": f"Your OTP code is {code}. It expires in 5 minutes.",
            }
        ).encode("utf-8")
        request = Request(url=api_url, data=body, method="POST")
        request.add_header("Authorization", f"Bearer {api_key}")
        request.add_header("Content-Type", "application/json")
        try:
            with urlopen(request, timeout=10) as response:
                if response.status < 200 or response.status >= 300:
                    raise RuntimeError(f"Resend API send failed with status {response.status}")
        except HTTPError as exc:
            err_body = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Resend API failed with status {exc.code}: {err_body[:300]}") from exc
        return
    if provider == "smtp":
        send_mail(
            subject="Domestyx OTP Verification Code",
            message=f"Your OTP code is {code}. It expires in 5 minutes.",
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@domestyx.com"),
            recipient_list=[email],
            fail_silently=False,
        )
        return
    if provider == "console":
        logger.info("Email OTP (console provider) to %s -> %s", _mask_target(email), code)
        return
    raise RuntimeError(f"Unsupported email provider: {provider}")


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def public_workers(request):
    search = (request.query_params.get("search") or "").strip()
    role_filter = (request.query_params.get("job_role") or "").strip().lower()
    location_filter = (request.query_params.get("location") or "").strip().lower()
    experience_filter = (request.query_params.get("experience") or "").strip().lower()
    availability_filter = (request.query_params.get("availability") or "").strip().lower()

    queryset = WorkerProfile.objects.select_related("user").filter(user__role="worker", user__is_active=True)
    results = []
    for profile in queryset:
        name = f"{profile.user.first_name} {profile.user.last_name}".strip() or "Worker"
        services = [str(item) for item in (profile.services or [])]
        availability = [str(item) for item in (profile.availability or [])]
        blob = " ".join(
            [
                name.lower(),
                profile.bio.lower(),
                profile.city.lower(),
                profile.state.lower(),
                profile.country.lower(),
                " ".join(s.lower() for s in services),
                " ".join(a.lower() for a in availability),
                (profile.experience or "").lower(),
            ]
        )
        if search and search.lower() not in blob:
            continue
        if role_filter and all(role_filter not in item.lower() for item in services):
            continue
        if location_filter and location_filter not in f"{profile.city} {profile.state} {profile.country}".lower():
            continue
        if experience_filter and experience_filter not in (profile.experience or "").lower():
            continue
        if availability_filter and all(availability_filter not in item.lower() for item in availability):
            continue

        results.append(
            {
                "id": profile.user_id,
                "name": name,
                "services": services,
                "experience": profile.experience,
                "availability": availability,
                "city": profile.city,
                "state": profile.state,
                "country": profile.country,
                "expected_salary_full_time": str(profile.expected_salary_full_time) if profile.expected_salary_full_time else "",
                "expected_salary_part_time": str(profile.expected_salary_part_time) if profile.expected_salary_part_time else "",
                "hourly_rate": str(profile.hourly_rate) if profile.hourly_rate else "",
                "is_verified": bool(profile.is_background_checked or profile.has_references),
                "profile_image": profile.profile_image.url if profile.profile_image else None,
            }
        )
    return Response(results)

# -----------------------------
# Register User
# -----------------------------
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        target_email = (request.data.get("email") or "").strip().lower()
        target_phone = (request.data.get("phone") or "").strip()
        if settings.OTP_REQUIRE_VERIFIED_EMAIL_ON_REGISTER:
            verification_window_start = timezone.now() - timedelta(
                seconds=settings.OTP_VERIFICATION_WINDOW_SECONDS
            )
            verified_otp_exists = OTPVerification.objects.filter(
                channel="email",
                target=target_email,
                purpose="registration",
                verified_at__isnull=False,
                verified_at__gte=verification_window_start,
            ).exists()
            if not verified_otp_exists:
                return Response(
                    {"error": "Email OTP verification is required before registration."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        if settings.OTP_REQUIRE_VERIFIED_PHONE_ON_REGISTER:
            verification_window_start = timezone.now() - timedelta(
                seconds=settings.OTP_VERIFICATION_WINDOW_SECONDS
            )
            verified_phone_otp_exists = OTPVerification.objects.filter(
                channel="phone",
                target=target_phone,
                purpose="registration",
                verified_at__isnull=False,
                verified_at__gte=verification_window_start,
            ).exists()
            if not verified_phone_otp_exists:
                return Response(
                    {"error": "Phone OTP verification is required before registration."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        now = timezone.now()
        update_fields = []
        if user.terms_accepted and not user.terms_accepted_at:
            user.terms_accepted_at = now
            update_fields.append("terms_accepted_at")
        if user.privacy_accepted and not user.privacy_accepted_at:
            user.privacy_accepted_at = now
            update_fields.append("privacy_accepted_at")
        if update_fields:
            user.save(update_fields=update_fields)
        return Response(ProfileSerializer(user).data)

# -----------------------------
# JWT Login
# -----------------------------
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# -----------------------------
# General Profile
# -----------------------------
class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def deactivate_account(request):
    request.user.is_active = False
    request.user.deactivated_at = timezone.now()
    request.user.save(update_fields=["is_active", "deactivated_at"])
    return Response({"message": "Account deactivated successfully."}, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def delete_account(request):
    request.user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# -----------------------------
# Worker Profile
# -----------------------------
# users/views.py


# users/views.py


@api_view(["GET", "PUT"])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser]) # <--- Add JSONParser here
def worker_profile(request):
    # This line ensures the profile exists in MySQL before we try to edit it
    profile, _ = WorkerProfile.objects.get_or_create(user=request.user)

    if request.method == "PUT":
        # partial=True allows us to update just one field (like bio) 
        # without needing to send the whole form.
        serializer = WorkerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        # If there is a validation error, we send it to the React Toast
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # GET request logic
    serializer = WorkerProfileSerializer(profile)
    return Response(serializer.data)

# Optional separate endpoint for image upload (if you want dedicated endpoint)
@api_view(["PUT"])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_worker_image(request):
    profile, _ = WorkerProfile.objects.get_or_create(user=request.user)
    image = request.FILES.get('profile_image')  # key must match serializer field

    if not image:
        return Response({"error": "No image file provided"}, status=400)

    profile.profile_image = image
    profile.save()
    return Response({
        "message": "Image uploaded successfully",
        "image_url": profile.profile_image.url
    })


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def send_otp(request):
    serializer = OTPRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload = serializer.validated_data
    target = payload["target"].strip().lower() if payload["channel"] == "email" else payload["target"].strip()
    now = timezone.now()

    latest_sent = OTPVerification.objects.filter(
        channel=payload["channel"],
        target=target,
        purpose=payload["purpose"],
    ).order_by("-created_at").first()
    if latest_sent:
        min_next_send = latest_sent.created_at + timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS)
        if now < min_next_send:
            retry_after = int((min_next_send - now).total_seconds())
            logger.warning("otp_rate_limited_cooldown channel=%s target=%s retry_after=%s", payload["channel"], _mask_target(target), retry_after)
            return Response(
                {"error": f"Please wait {retry_after} seconds before requesting another OTP."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

    sends_last_hour = OTPVerification.objects.filter(
        channel=payload["channel"],
        target=target,
        purpose=payload["purpose"],
        created_at__gte=now - timedelta(hours=1),
    ).count()
    if sends_last_hour >= settings.OTP_MAX_SENDS_PER_HOUR:
        logger.warning("otp_rate_limited_hourly channel=%s target=%s count=%s", payload["channel"], _mask_target(target), sends_last_hour)
        return Response(
            {"error": "Too many OTP requests. Please try again later."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    OTPVerification.objects.filter(
        channel=payload["channel"],
        target=target,
        purpose=payload["purpose"],
        is_used=False,
    ).update(is_used=True)

    code = str(random.randint(100000, 999999))
    otp = OTPVerification.objects.create(
        user=request.user if request.user.is_authenticated else None,
        channel=payload["channel"],
        target=target,
        purpose=payload["purpose"],
        code_hash=make_password(code),
        expires_at=now + timedelta(seconds=settings.OTP_EXPIRY_SECONDS),
        max_attempts=settings.OTP_MAX_ATTEMPTS,
    )

    data = {
        "message": "OTP sent successfully.",
        "channel": otp.channel,
        "target": _mask_target(otp.target),
        "expires_in_seconds": settings.OTP_EXPIRY_SECONDS,
    }
    if otp.channel == "email":
        try:
            _send_email_otp(otp.target, code)
            logger.info("otp_send_success channel=email target=%s", _mask_target(otp.target))
        except Exception:
            logger.exception("Failed sending OTP email to %s", _mask_target(otp.target))
            if settings.DEBUG:
                data["otp"] = code
                data["delivery"] = "Email sending failed, using debug OTP fallback."
            else:
                return Response(
                    {"error": "Unable to send OTP email right now. Please try again."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
    else:
        try:
            _send_phone_otp(otp.target, code)
            data["delivery"] = "Phone OTP sent."
            if settings.DEBUG:
                data["otp"] = code
            logger.info("otp_send_success channel=phone target=%s", _mask_target(otp.target))
        except Exception:
            logger.exception("Failed sending OTP SMS to %s", _mask_target(otp.target))
            if settings.DEBUG:
                data["otp"] = code
                data["delivery"] = "SMS sending failed, using debug OTP fallback."
            else:
                return Response(
                    {"error": "Unable to send OTP SMS right now. Please try again."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

    if settings.DEBUG and "otp" not in data:
        data["otp"] = code
    return Response(data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def verify_otp(request):
    serializer = OTPVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload = serializer.validated_data

    target = payload["target"].strip().lower()
    otp = OTPVerification.objects.filter(
        channel=payload["channel"],
        target=target,
        purpose=payload["purpose"],
        is_used=False,
    ).order_by("-created_at").first()
    if not otp:
        logger.info("otp_verify_not_found channel=%s target=%s", payload["channel"], _mask_target(target))
        return Response({"error": "OTP not found."}, status=status.HTTP_404_NOT_FOUND)

    if otp.is_expired():
        otp.is_used = True
        otp.save(update_fields=["is_used"])
        logger.info("otp_verify_expired channel=%s target=%s", payload["channel"], _mask_target(target))
        return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)

    if otp.attempts >= otp.max_attempts:
        otp.is_used = True
        otp.save(update_fields=["is_used"])
        logger.warning("otp_verify_max_attempts channel=%s target=%s", payload["channel"], _mask_target(target))
        return Response({"error": "Maximum verification attempts exceeded."}, status=status.HTTP_400_BAD_REQUEST)

    if not check_password(payload["code"], otp.code_hash):
        otp.attempts += 1
        otp.save(update_fields=["attempts"])
        logger.info("otp_verify_invalid channel=%s target=%s attempts=%s", payload["channel"], _mask_target(target), otp.attempts)
        return Response({"error": "Invalid OTP code."}, status=status.HTTP_400_BAD_REQUEST)

    otp.is_used = True
    otp.verified_at = timezone.now()
    if request.user.is_authenticated and otp.user_id is None:
        otp.user = request.user
        otp.save(update_fields=["is_used", "verified_at", "user"])
    else:
        otp.save(update_fields=["is_used", "verified_at"])

    logger.info("otp_verify_success channel=%s target=%s", payload["channel"], _mask_target(target))
    return Response({"message": "OTP verified successfully.", "verified": True})


@api_view(["GET", "PATCH"])
@permission_classes([permissions.IsAuthenticated])
def user_consent(request):
    user = request.user
    if request.method == "GET":
        serializer = ConsentSerializer(user)
        return Response(serializer.data)

    serializer = ConsentSerializer(user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    if "terms_accepted" in serializer.validated_data:
        if serializer.validated_data["terms_accepted"]:
            user.terms_accepted_at = timezone.now()
        else:
            user.terms_accepted_at = None
    if "privacy_accepted" in serializer.validated_data:
        if serializer.validated_data["privacy_accepted"]:
            user.privacy_accepted_at = timezone.now()
        else:
            user.privacy_accepted_at = None

    serializer.save()
    return Response(ConsentSerializer(user).data)


@api_view(["GET", "PUT"])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def agency_profile(request):
    if _user_role(request.user) != "agency":
        return Response({"message": "Only agencies can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
    profile, _ = RecruitmentAgencyProfile.objects.get_or_create(user=request.user)
    if request.method == "PUT":
        serializer = RecruitmentAgencyProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(RecruitmentAgencyProfileSerializer(profile).data)


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def agency_worker_submissions(request):
    if _user_role(request.user) != "agency":
        return Response({"message": "Only agencies can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
    if request.method == "GET":
        queryset = AgencyWorkerSubmission.objects.filter(agency=request.user).select_related("worker").order_by("-created_at")
        return Response(AgencyWorkerSubmissionSerializer(queryset, many=True).data)

    serializer = AgencyWorkerSubmissionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    worker = serializer.validated_data["worker"]
    if _user_role(worker) != "worker":
        return Response({"error": "Only worker users can be submitted."}, status=status.HTTP_400_BAD_REQUEST)
    submission, _ = AgencyWorkerSubmission.objects.get_or_create(
        agency=request.user,
        worker=worker,
        defaults={
            "job_role": serializer.validated_data.get("job_role", ""),
            "experience_summary": serializer.validated_data.get("experience_summary", ""),
            "notes": serializer.validated_data.get("notes", ""),
            "verification_document": serializer.validated_data.get("verification_document"),
        },
    )
    update_fields = []
    for field in ["job_role", "experience_summary", "notes", "verification_document"]:
        if field in serializer.validated_data:
            setattr(submission, field, serializer.validated_data.get(field))
            update_fields.append(field)
    if update_fields:
        submission.save(update_fields=update_fields)
    return Response(AgencyWorkerSubmissionSerializer(submission).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def update_agency_worker_submission(request, submission_id):
    role = _user_role(request.user)
    if role not in {"agency", "government"}:
        return Response({"message": "Only agency or government users can update submission status."}, status=status.HTTP_403_FORBIDDEN)
    try:
        submission = AgencyWorkerSubmission.objects.get(id=submission_id)
    except AgencyWorkerSubmission.DoesNotExist:
        return Response({"error": "Submission not found."}, status=status.HTTP_404_NOT_FOUND)

    if role == "agency" and submission.agency_id != request.user.id:
        return Response({"message": "Not allowed to update this submission."}, status=status.HTTP_403_FORBIDDEN)

    new_status = (request.data.get("status") or "").strip().lower()
    allowed_status = {"submitted", "verified", "rejected"}
    if new_status and new_status not in allowed_status:
        return Response({"error": "Invalid status value."}, status=status.HTTP_400_BAD_REQUEST)
    if new_status:
        submission.status = new_status

    if "notes" in request.data:
        submission.notes = (request.data.get("notes") or "").strip()
    submission.save()
    return Response(AgencyWorkerSubmissionSerializer(submission).data)


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def compliance_reports(request):
    role = _user_role(request.user)
    if request.method == "GET":
        if role == "government":
            queryset = ComplianceReport.objects.select_related("reporter", "reported_user").order_by("-created_at")
        else:
            queryset = ComplianceReport.objects.filter(reporter=request.user).select_related("reporter", "reported_user").order_by("-created_at")
        return Response(ComplianceReportSerializer(queryset, many=True).data)

    reported_user_id = request.data.get("reported_user")
    if not reported_user_id:
        return Response({"error": "reported_user is required."}, status=status.HTTP_400_BAD_REQUEST)
    serializer = ComplianceReportSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(reporter=request.user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def update_compliance_report(request, report_id):
    if _user_role(request.user) != "government":
        return Response({"message": "Only government users can update report status."}, status=status.HTTP_403_FORBIDDEN)
    try:
        report = ComplianceReport.objects.get(id=report_id)
    except ComplianceReport.DoesNotExist:
        return Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

    allowed_status = {"open", "in_review", "resolved", "dismissed"}
    new_status = (request.data.get("status") or "").strip().lower()
    if new_status and new_status not in allowed_status:
        return Response({"error": "Invalid status value."}, status=status.HTTP_400_BAD_REQUEST)
    if new_status:
        report.status = new_status
    if "resolution_notes" in request.data:
        report.resolution_notes = (request.data.get("resolution_notes") or "").strip()
    action = (request.data.get("action") or "").strip().lower()
    if action in {"suspend_user", "activate_user"}:
        target = report.reported_user
        target.is_active = action != "suspend_user"
        target.save(update_fields=["is_active"])
    report.save()
    return Response(ComplianceReportSerializer(report).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def government_analytics(request):
    if _user_role(request.user) != "government":
        return Response({"message": "Only government users can access analytics."}, status=status.HTTP_403_FORBIDDEN)

    now = timezone.now()
    last_30 = now - timedelta(days=30)

    jobs_daily = (
        Job.objects.filter(posted_at__gte=last_30)
        .annotate(day=TruncDate("posted_at"))
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )
    applications_daily = (
        Application.objects.filter(applied_at__gte=last_30)
        .annotate(day=TruncDate("applied_at"))
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )

    return Response(
        {
            "totals": {
                "users": {
                    "worker": User.objects.filter(role="worker").count(),
                    "employer": User.objects.filter(role="employer").count(),
                    "agency": User.objects.filter(role="agency").count(),
                    "government": User.objects.filter(role="government").count(),
                    "support_provider": User.objects.filter(role="support_provider").count(),
                },
                "jobs": Job.objects.count(),
                "applications": Application.objects.count(),
                "hired": Application.objects.filter(status="hired").count(),
                "chat_threads": ChatThread.objects.count(),
                "chat_messages": ChatMessage.objects.count(),
                "reviews": WorkerReview.objects.count() + EmployerReview.objects.count(),
                "compliance_reports_open": ComplianceReport.objects.filter(status__in=["open", "in_review"]).count(),
            },
            "last_30_days": {
                "jobs_daily": list(jobs_daily),
                "applications_daily": list(applications_daily),
            },
        }
    )


@api_view(["GET", "PUT"])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def government_profile(request):
    if _user_role(request.user) != "government":
        return Response({"message": "Only government users can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
    profile, _ = GovernmentProfile.objects.get_or_create(user=request.user)
    if request.method == "PUT":
        serializer = GovernmentProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(GovernmentProfileSerializer(profile).data)


@api_view(["GET", "PUT"])
@permission_classes([permissions.IsAuthenticated])
def support_provider_profile(request):
    if _user_role(request.user) != "support_provider":
        return Response({"message": "Only support providers can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
    profile, _ = SupportServiceProviderProfile.objects.get_or_create(user=request.user)
    if request.method == "PUT":
        serializer = SupportServiceProviderProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(SupportServiceProviderProfileSerializer(profile).data)


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def support_service_requests(request):
    role = _user_role(request.user)
    if request.method == "GET":
        if role == "support_provider":
            queryset = SupportServiceRequest.objects.filter(provider=request.user).select_related("requester", "provider").order_by("-created_at")
        else:
            queryset = SupportServiceRequest.objects.filter(requester=request.user).select_related("requester", "provider").order_by("-created_at")
        return Response(SupportServiceRequestSerializer(queryset, many=True).data)

    serializer = SupportServiceRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    provider = serializer.validated_data["provider"]
    if _user_role(provider) != "support_provider":
        return Response({"error": "provider must be a support_provider user."}, status=status.HTTP_400_BAD_REQUEST)
    serializer.save(requester=request.user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def support_providers(request):
    queryset = User.objects.filter(role="support_provider", is_active=True).select_related("support_provider_profile")
    payload = []
    for user in queryset:
        profile = getattr(user, "support_provider_profile", None)
        payload.append(
            {
                "id": user.id,
                "name": f"{user.first_name} {user.last_name}".strip() or user.email,
                "email": user.email,
                "company_name": profile.company_name if profile else "",
                "service_categories": profile.service_categories if profile else [],
                "contact_information": profile.contact_information if profile else "",
                "is_verified": bool(profile and profile.is_verified),
            }
        )
    return Response(payload)


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def update_support_service_request(request, request_id):
    try:
        obj = SupportServiceRequest.objects.get(id=request_id)
    except SupportServiceRequest.DoesNotExist:
        return Response({"error": "Service request not found."}, status=status.HTTP_404_NOT_FOUND)

    role = _user_role(request.user)
    if role == "support_provider":
        if obj.provider_id != request.user.id:
            return Response({"message": "Not allowed to update this request."}, status=status.HTTP_403_FORBIDDEN)
    elif obj.requester_id != request.user.id:
        return Response({"message": "Not allowed to update this request."}, status=status.HTTP_403_FORBIDDEN)

    allowed_status = {"open", "accepted", "completed", "cancelled"}
    new_status = (request.data.get("status") or "").strip().lower()
    if new_status and new_status not in allowed_status:
        return Response({"error": "Invalid status value."}, status=status.HTTP_400_BAD_REQUEST)
    if new_status:
        obj.status = new_status
    if "details" in request.data:
        obj.details = request.data.get("details") or ""
    obj.save()
    return Response(SupportServiceRequestSerializer(obj).data)


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def support_service_messages(request, request_id):
    try:
        obj = SupportServiceRequest.objects.select_related("requester", "provider").get(id=request_id)
    except SupportServiceRequest.DoesNotExist:
        return Response({"error": "Service request not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.user.id not in {obj.requester_id, obj.provider_id}:
        return Response({"message": "Not allowed to access this request chat."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        queryset = obj.messages.select_related("sender").order_by("created_at")
        return Response(SupportServiceMessageSerializer(queryset, many=True).data)

    text = (request.data.get("message") or "").strip()
    if not text:
        return Response({"error": "message is required."}, status=status.HTTP_400_BAD_REQUEST)
    msg = SupportServiceMessage.objects.create(request=obj, sender=request.user, message=text)
    return Response(SupportServiceMessageSerializer(msg).data, status=status.HTTP_201_CREATED)
