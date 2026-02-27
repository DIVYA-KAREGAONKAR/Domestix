# users/models.py
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.conf import settings
from django.utils import timezone


class EmployerProfile(models.Model):
    EMPLOYER_TYPE_CHOICES = (
        ("individual", "Individual"),
        ("business", "Business"),
        ("company", "Company"),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employer_profile')
    employer_type = models.CharField(max_length=20, choices=EMPLOYER_TYPE_CHOICES, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    company_name = models.CharField(max_length=100, blank=True)
    job_location = models.CharField(max_length=120, blank=True)
    preferred_language = models.CharField(max_length=50, blank=True)
    id_proof_document = models.FileField(upload_to="employer_documents/", blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} Employer Profile"


class RecruitmentAgencyProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="agency_profile")
    agency_name = models.CharField(max_length=150, blank=True)
    mohre_approval_number = models.CharField(max_length=80, blank=True)
    contact_information = models.CharField(max_length=255, blank=True)
    verification_document = models.FileField(upload_to="agency_documents/", blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email} Agency Profile"


class GovernmentProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="government_profile")
    authority_name = models.CharField(max_length=150, blank=True)
    credential_reference = models.CharField(max_length=120, blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email} Government Profile"


class SupportServiceProviderProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="support_provider_profile")
    company_name = models.CharField(max_length=150, blank=True)
    service_categories = models.JSONField(default=list, blank=True)
    contact_information = models.CharField(max_length=255, blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email} Support Provider Profile"

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email.strip()).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        # ✅ ensure role is set only once
        if 'role' not in extra_fields:
            extra_fields['role'] = 'employer'

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('worker', 'Worker'),
        ('employer', 'Employer'),
        ('agency', 'Recruitment Agency'),
        ('government', 'Government/Regulatory'),
        ('support_provider', 'Support Service Provider'),
    )

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='worker')

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    terms_accepted = models.BooleanField(default=False)
    terms_accepted_at = models.DateTimeField(blank=True, null=True)
    privacy_accepted = models.BooleanField(default=False)
    privacy_accepted_at = models.DateTimeField(blank=True, null=True)
    marketing_opt_in = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']

    objects = CustomUserManager()

    def __str__(self):
        return self.email

class WorkerProfile(models.Model):
    GENDER_CHOICES = (
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
    )
    MARITAL_STATUS_CHOICES = (
        ("single", "Single"),
        ("married", "Married"),
        ("divorced", "Divorced"),
        ("widowed", "Widowed"),
    )
    VISA_TYPE_CHOICES = (
        ("employment", "Employment Visa"),
        ("visit", "Visit Visa"),
        ("none", "No Visa"),
    )
    WORK_PERMIT_STATUS_CHOICES = (
        ("not_applied", "Not Applied"),
        ("applied", "Applied"),
        ("approved", "Approved"),
    )
    WORK_PREFERENCE_CHOICES = (
        ("full_time", "Full-Time"),
        ("part_time", "Part-Time"),
        ("hourly", "Hourly Basis"),
        ("live_in", "Live-In"),
        ("live_out", "Live-Out"),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='worker_profile')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    marital_status = models.CharField(max_length=10, choices=MARITAL_STATUS_CHOICES, blank=True)
    nationality = models.CharField(max_length=80, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    alternate_phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=50, blank=True)
    state = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=50, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    bio = models.TextField(blank=True)
    hourly_rate = models.DecimalField(max_digits=7, decimal_places=2, blank=True, null=True)
    experience = models.CharField(max_length=20, blank=True)
    services = models.JSONField(default=list, blank=True)
    availability = models.JSONField(default=list, blank=True)
    languages = models.JSONField(default=list, blank=True)
    work_preference = models.CharField(max_length=20, choices=WORK_PREFERENCE_CHOICES, blank=True)
    preferred_work_locations = models.JSONField(default=list, blank=True)
    willing_to_relocate = models.BooleanField(default=False)
    expected_salary_full_time = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    expected_salary_part_time = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    expected_benefits = models.JSONField(default=list, blank=True)
    has_transportation = models.BooleanField(default=False)
    has_references = models.BooleanField(default=False)
    is_background_checked = models.BooleanField(default=False)
    passport_number = models.CharField(max_length=60, blank=True)
    passport_expiry_date = models.DateField(blank=True, null=True)
    visa_type = models.CharField(max_length=20, choices=VISA_TYPE_CHOICES, blank=True)
    domestic_worker_visa_issued_by = models.CharField(max_length=20, blank=True)
    work_permit_status = models.CharField(max_length=20, choices=WORK_PERMIT_STATUS_CHOICES, blank=True)
    has_criminal_record = models.BooleanField(default=False)
    criminal_record_details = models.TextField(blank=True)
    police_clearance_available = models.BooleanField(default=False)
    educational_qualification = models.CharField(max_length=120, blank=True)
    health_conditions = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=255, blank=True)
    available_from = models.DateField(blank=True, null=True)
    emirates_id_document = models.FileField(upload_to="worker_documents/", blank=True, null=True)
    residency_visa_document = models.FileField(upload_to="worker_documents/", blank=True, null=True)
    medical_fitness_certificate = models.FileField(upload_to="worker_documents/", blank=True, null=True)
    police_verification_certificate = models.FileField(upload_to="worker_documents/", blank=True, null=True)
    profile_image = models.ImageField(upload_to='worker_profiles/', blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} Profile"


class AgencyWorkerSubmission(models.Model):
    STATUS_CHOICES = (
        ("submitted", "Submitted"),
        ("verified", "Verified"),
        ("rejected", "Rejected"),
    )

    agency = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="agency_worker_submissions",
    )
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submitted_by_agencies",
    )
    job_role = models.CharField(max_length=120, blank=True)
    experience_summary = models.CharField(max_length=255, blank=True)
    verification_document = models.FileField(upload_to="agency_worker_submissions/", blank=True, null=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="submitted")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("agency", "worker")

    def __str__(self):
        return f"{self.agency.email} -> {self.worker.email} ({self.status})"


class ComplianceReport(models.Model):
    STATUS_CHOICES = (
        ("open", "Open"),
        ("in_review", "In Review"),
        ("resolved", "Resolved"),
        ("dismissed", "Dismissed"),
    )

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="compliance_reports_filed",
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="compliance_reports_against",
    )
    category = models.CharField(max_length=80)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    resolution_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report {self.id} ({self.status})"


class SupportServiceRequest(models.Model):
    STATUS_CHOICES = (
        ("open", "Open"),
        ("accepted", "Accepted"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )

    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_requests_created",
    )
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_requests_assigned",
    )
    service_type = models.CharField(max_length=120)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request {self.id} ({self.status})"


class SupportServiceMessage(models.Model):
    request = models.ForeignKey(
        SupportServiceRequest,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_messages_sent",
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SupportMessage {self.id} ({self.request_id})"


class OTPVerification(models.Model):
    CHANNEL_CHOICES = (
        ("email", "Email"),
        ("phone", "Phone"),
    )

    PURPOSE_CHOICES = (
        ("registration", "Registration"),
        ("login", "Login"),
        ("contact", "Contact Verification"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="otp_verifications",
        blank=True,
        null=True,
    )
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    target = models.CharField(max_length=255)
    purpose = models.CharField(max_length=30, choices=PURPOSE_CHOICES, default="registration")
    code_hash = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)
    is_used = models.BooleanField(default=False)
    verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["target", "channel", "is_used", "created_at"]),
        ]

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.channel}:{self.target} ({self.purpose})"


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'worker':
            WorkerProfile.objects.create(user=instance)
        elif instance.role == 'employer':
            EmployerProfile.objects.create(user=instance)
        elif instance.role == 'agency':
            RecruitmentAgencyProfile.objects.create(user=instance)
        elif instance.role == 'government':
            GovernmentProfile.objects.create(user=instance)
        elif instance.role == 'support_provider':
            SupportServiceProviderProfile.objects.create(user=instance)

@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    if instance.role == 'worker' and hasattr(instance, 'worker_profile'):
        instance.worker_profile.save()
    elif instance.role == 'employer' and hasattr(instance, 'employer_profile'):
        instance.employer_profile.save()
    elif instance.role == 'agency' and hasattr(instance, 'agency_profile'):
        instance.agency_profile.save()
    elif instance.role == 'government' and hasattr(instance, 'government_profile'):
        instance.government_profile.save()
    elif instance.role == 'support_provider' and hasattr(instance, 'support_provider_profile'):
        instance.support_provider_profile.save()
