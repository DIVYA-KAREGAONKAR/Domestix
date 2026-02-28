from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    AgencyWorkerSubmission,
    ComplianceReport,
    GovernmentProfile,
    OTPVerification,
    RecruitmentAgencyProfile,
    SupportServiceProviderProfile,
    SupportServiceMessage,
    SupportServiceRequest,
    WorkerProfile,
)

User = get_user_model()

# users/serializers.py

# users/serializers.py

# users/serializers.py

class WorkerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerProfile
        fields = [
            "gender", "date_of_birth", "marital_status", "nationality",
            "phone", "alternate_phone", "address", "city", "state", "zip_code", "country",
            "bio", "hourly_rate", "experience", "services", "availability", "languages",
            "work_preference", "preferred_work_locations", "willing_to_relocate",
            "expected_salary_full_time", "expected_salary_part_time", "expected_benefits",
            "has_transportation", "has_references", "is_background_checked",
            "passport_number", "passport_expiry_date", "visa_type",
            "domestic_worker_visa_issued_by", "work_permit_status",
            "has_criminal_record", "criminal_record_details", "police_clearance_available",
            "educational_qualification", "health_conditions", "emergency_contact",
            "available_from", "emirates_id_document", "residency_visa_document",
            "medical_fitness_certificate", "police_verification_certificate", "profile_image"
        ]
        read_only_fields = ["user"]
# Register Serializer
# -----------------------------
# users/serializers.py

# users/serializers.py
# users/serializers.py

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    employer_type = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    job_location = serializers.CharField(write_only=True, required=False, allow_blank=True)
    preferred_language = serializers.CharField(write_only=True, required=False, allow_blank=True)
    agency_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    mohre_approval_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    agency_contact_information = serializers.CharField(write_only=True, required=False, allow_blank=True)
    authority_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    credential_reference = serializers.CharField(write_only=True, required=False, allow_blank=True)
    support_company_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    support_service_categories = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    support_contact_information = serializers.CharField(write_only=True, required=False, allow_blank=True)
    nationality = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            'email', 'password', 'password2', 'first_name', 'last_name', 'role',
            'employer_type', 'company_name', 'phone', 'address', 'job_location', 'preferred_language',
            'agency_name', 'mohre_approval_number', 'agency_contact_information',
            'authority_name', 'credential_reference',
            'support_company_name', 'support_service_categories', 'support_contact_information',
            'nationality',
            'terms_accepted', 'privacy_accepted', 'marketing_opt_in',
        )

    def validate(self, attrs):
        # ✅ Standard Django validation for password matching
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password2": "Password fields didn't match."})
        return attrs

    def validate_email(self, value):
        return value.strip().lower()

    def create(self, validated_data):
        # Remove password2 before passing to create_user
        validated_data.pop('password2')
        employer_type = validated_data.pop('employer_type', '')
        company_name = validated_data.pop('company_name', '')
        phone = validated_data.pop('phone', '')
        address = validated_data.pop('address', '')
        job_location = validated_data.pop('job_location', '')
        preferred_language = validated_data.pop('preferred_language', '')
        agency_name = validated_data.pop('agency_name', '')
        mohre_approval_number = validated_data.pop('mohre_approval_number', '')
        agency_contact_information = validated_data.pop('agency_contact_information', '')
        authority_name = validated_data.pop('authority_name', '')
        credential_reference = validated_data.pop('credential_reference', '')
        support_company_name = validated_data.pop('support_company_name', '')
        support_service_categories = validated_data.pop('support_service_categories', [])
        support_contact_information = validated_data.pop('support_contact_information', '')
        nationality = validated_data.pop('nationality', '')
        
        # ✅ Explicitly use create_user to handle hashing and role assignment
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
            role=validated_data.get('role', 'worker'), # Defaults to worker if role is missing
            terms_accepted=validated_data.get('terms_accepted', False),
            privacy_accepted=validated_data.get('privacy_accepted', False),
            marketing_opt_in=validated_data.get('marketing_opt_in', False),
        )

        if user.role == 'employer' and hasattr(user, 'employer_profile'):
            user.employer_profile.employer_type = employer_type
            user.employer_profile.company_name = company_name
            user.employer_profile.phone = phone
            user.employer_profile.address = address
            user.employer_profile.job_location = job_location
            user.employer_profile.preferred_language = preferred_language
            user.employer_profile.save()
        elif user.role == 'worker' and hasattr(user, 'worker_profile'):
            user.worker_profile.phone = phone
            user.worker_profile.nationality = nationality
            if preferred_language:
                existing_languages = list(user.worker_profile.languages or [])
                if preferred_language not in existing_languages:
                    existing_languages.append(preferred_language)
                user.worker_profile.languages = existing_languages
            user.worker_profile.save()
        elif user.role == 'agency' and hasattr(user, 'agency_profile'):
            user.agency_profile.agency_name = agency_name
            user.agency_profile.mohre_approval_number = mohre_approval_number
            user.agency_profile.contact_information = agency_contact_information
            user.agency_profile.save()
        elif user.role == 'government' and hasattr(user, 'government_profile'):
            user.government_profile.authority_name = authority_name
            user.government_profile.credential_reference = credential_reference
            user.government_profile.save()
        elif user.role == 'support_provider' and hasattr(user, 'support_provider_profile'):
            user.support_provider_profile.company_name = support_company_name
            user.support_provider_profile.service_categories = support_service_categories
            user.support_provider_profile.contact_information = support_contact_information
            user.support_provider_profile.save()
        return user
# -----------------------------
# Profile Serializer
# -----------------------------
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'role',
            'terms_accepted', 'terms_accepted_at', 'privacy_accepted',
            'privacy_accepted_at', 'marketing_opt_in',
        )
        read_only_fields = fields

# -----------------------------
# JWT Custom Serializer
# -----------------------------


# ... (WorkerProfileSerializer and RegisterSerializer stay the same)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        attrs["email"] = (attrs.get("email") or "").strip().lower()
        # This is where the 'role' is sent to React
        data = super().validate(attrs)
        user = self.user
        normalized_role = (user.role or "").strip().lower()
        data['user'] = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": normalized_role,  # Keep API role casing/spacing consistent
            "terms_accepted": user.terms_accepted,
            "privacy_accepted": user.privacy_accepted,
        }
        return data


class OTPRequestSerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=OTPVerification.CHANNEL_CHOICES)
    target = serializers.CharField(max_length=255)
    purpose = serializers.ChoiceField(choices=OTPVerification.PURPOSE_CHOICES, required=False, default="registration")

    def validate(self, attrs):
        channel = attrs.get("channel")
        target = (attrs.get("target") or "").strip()
        if channel == "email":
            serializers.EmailField().run_validation(target)
            attrs["target"] = target.lower()
        else:
            if not re.match(r"^\+?[0-9]{8,15}$", target):
                raise serializers.ValidationError({"target": "Phone number must be digits with optional + and 8-15 length."})
            attrs["target"] = target
        return attrs


class OTPVerifySerializer(serializers.Serializer):
    channel = serializers.ChoiceField(choices=OTPVerification.CHANNEL_CHOICES)
    target = serializers.CharField(max_length=255)
    code = serializers.CharField(min_length=4, max_length=6)
    purpose = serializers.ChoiceField(choices=OTPVerification.PURPOSE_CHOICES, required=False, default="registration")

    def validate(self, attrs):
        channel = attrs.get("channel")
        target = (attrs.get("target") or "").strip()
        if channel == "email":
            serializers.EmailField().run_validation(target)
            attrs["target"] = target.lower()
        else:
            if not re.match(r"^\+?[0-9]{8,15}$", target):
                raise serializers.ValidationError({"target": "Phone number must be digits with optional + and 8-15 length."})
            attrs["target"] = target
        attrs["code"] = (attrs.get("code") or "").strip()
        return attrs


class ConsentSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "terms_accepted",
            "privacy_accepted",
            "marketing_opt_in",
            "terms_accepted_at",
            "privacy_accepted_at",
        ]
        read_only_fields = ["terms_accepted_at", "privacy_accepted_at"]


class RecruitmentAgencyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecruitmentAgencyProfile
        fields = ["agency_name", "mohre_approval_number", "contact_information", "verification_document", "is_verified"]
        read_only_fields = ["is_verified"]


class GovernmentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GovernmentProfile
        fields = ["authority_name", "credential_reference", "verification_document", "is_verified"]
        read_only_fields = ["is_verified"]


class SupportServiceProviderProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportServiceProviderProfile
        fields = ["company_name", "service_categories", "contact_information", "is_verified"]
        read_only_fields = ["is_verified"]


class AgencyWorkerSubmissionSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.first_name", read_only=True)

    class Meta:
        model = AgencyWorkerSubmission
        fields = [
            "id", "agency", "worker", "worker_name", "job_role", "experience_summary",
            "verification_document", "notes", "status", "created_at",
        ]
        read_only_fields = ["agency", "status", "created_at"]


class ComplianceReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source="reporter.first_name", read_only=True)
    reported_user_name = serializers.CharField(source="reported_user.first_name", read_only=True)

    class Meta:
        model = ComplianceReport
        fields = [
            "id", "reporter", "reporter_name", "reported_user", "reported_user_name",
            "category", "description", "status", "resolution_notes", "created_at", "updated_at",
        ]
        read_only_fields = ["reporter", "created_at", "updated_at"]


class SupportServiceRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source="requester.first_name", read_only=True)
    provider_name = serializers.CharField(source="provider.first_name", read_only=True)

    class Meta:
        model = SupportServiceRequest
        fields = [
            "id", "requester", "requester_name", "provider", "provider_name",
            "service_type", "details", "status", "created_at", "updated_at",
        ]
        read_only_fields = ["requester", "created_at", "updated_at"]


class SupportServiceMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.first_name", read_only=True)

    class Meta:
        model = SupportServiceMessage
        fields = ["id", "request", "sender", "sender_name", "message", "created_at"]
        read_only_fields = ["sender", "created_at"]
