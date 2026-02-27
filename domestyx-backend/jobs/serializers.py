from rest_framework import serializers
from .models import Application, CallSession, ChatMessage, ChatThread, Job, JobOffer, SavedJob, ShortlistedWorker, WorkerReview

class ApplicationSerializer(serializers.ModelSerializer):
    job_details = serializers.SerializerMethodField()
    worker_details = serializers.SerializerMethodField()

    class Meta:
        model = Application
        # ✅ Include applied_at so the frontend can show the date
        fields = ['id', 'worker', 'job', 'cover_note', 'supporting_document', 'status', 'applied_at', 'job_details', 'worker_details']
        read_only_fields = ('worker', 'job', 'applied_at')

    def get_job_details(self, obj):
        return {
            "title": obj.job.title,
            "location": obj.job.location,
            "salary": obj.job.salary
        }

    def get_worker_details(self, obj):
        worker = obj.worker
        # getattr(worker, 'worker_profile', None) prevents an error 
        # if the worker hasn't filled out their profile yet.
        profile = getattr(worker, 'worker_profile', None)
        
        return {
            "name": f"{worker.first_name} {worker.last_name}",
            "email": worker.email,
            "phone": profile.phone if profile else "",
            "profile_image": profile.profile_image.url if profile and profile.profile_image else None,
            "bio": profile.bio if profile else "No profile bio.",
            "experience": profile.experience if profile else "N/A",
        }

class JobSerializer(serializers.ModelSerializer):
    has_applied = serializers.SerializerMethodField()
    employer_name = serializers.CharField(source='employer.first_name', read_only=True)
    applicants = ApplicationSerializer(source='job_applications', many=True, read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'salary', 'location',
            'job_type', 'preferred_gender', 'preferred_age_range',
            'language_requirements', 'experience_required', 'skills_required',
            'workplace_type', 'accommodation_provided', 'food_provided', 'work_schedule',
            'full_time_salary', 'part_time_salary', 'hourly_wage', 'additional_benefits',
            'contract_type', 'recruitment_method', 'work_permit_sponsorship',
            'background_verification_required', 'preferred_nationality',
            'police_clearance_required', 'specific_expectations',
            'work_environment_description', 'emergency_contact_name_number',
            'application_instructions', 'contact_person_name', 'contact_phone', 'contact_email',
            'status', 'review_status', 'review_notes', 'reviewed_at',
            'posted_at', 'employer_name', 'has_applied', 'applicants'
        ]
        read_only_fields = ('status', 'review_status', 'review_notes', 'reviewed_at', 'posted_at')

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return Application.objects.filter(worker=request.user, job=obj).exists()
        return False


class ShortlistedWorkerSerializer(serializers.ModelSerializer):
    worker_details = serializers.SerializerMethodField()
    job_details = serializers.SerializerMethodField()

    class Meta:
        model = ShortlistedWorker
        fields = [
            "id", "employer", "worker", "job", "notes", "created_at",
            "worker_details", "job_details",
        ]
        read_only_fields = ["employer", "created_at"]

    def get_worker_details(self, obj):
        worker = obj.worker
        profile = getattr(worker, "worker_profile", None)
        return {
            "id": worker.id,
            "name": f"{worker.first_name} {worker.last_name}".strip(),
            "email": worker.email,
            "phone": profile.phone if profile else "",
            "experience": profile.experience if profile else "",
            "services": profile.services if profile else [],
            "languages": profile.languages if profile else [],
            "bio": profile.bio if profile else "",
            "profile_image": profile.profile_image.url if profile and profile.profile_image else None,
            "location": {
                "city": profile.city if profile else "",
                "state": profile.state if profile else "",
                "country": profile.country if profile else "",
            },
        }

    def get_job_details(self, obj):
        if not obj.job:
            return None
        return {
            "id": obj.job.id,
            "title": obj.job.title,
            "location": obj.job.location,
            "job_type": obj.job.job_type,
            "status": obj.job.status,
        }


class WorkerReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.first_name", read_only=True)
    worker_name = serializers.CharField(source="worker.first_name", read_only=True)
    job_title = serializers.CharField(source="job.title", read_only=True)

    class Meta:
        model = WorkerReview
        fields = [
            "id", "reviewer", "reviewer_name", "worker", "worker_name",
            "job", "job_title", "rating", "comment", "created_at",
        ]
        read_only_fields = ["reviewer", "created_at"]


class ChatThreadSerializer(serializers.ModelSerializer):
    employer_name = serializers.CharField(source="employer.first_name", read_only=True)
    worker_name = serializers.CharField(source="worker.first_name", read_only=True)
    job_title = serializers.CharField(source="job.title", read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatThread
        fields = [
            "id", "employer", "employer_name", "worker", "worker_name",
            "job", "job_title", "created_at", "last_message", "unread_count",
        ]
        read_only_fields = ["created_at"]

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        if not msg:
            return None
        return {
            "sender_id": msg.sender_id,
            "message": msg.message,
            "created_at": msg.created_at,
        }

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        return obj.messages.exclude(sender=request.user).filter(is_read=False).count()


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.first_name", read_only=True)

    class Meta:
        model = ChatMessage
        fields = ["id", "thread", "sender", "sender_name", "message", "is_read", "created_at"]
        read_only_fields = ["sender", "is_read", "created_at"]


class CallSessionSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source="requester.first_name", read_only=True)
    receiver_name = serializers.CharField(source="receiver.first_name", read_only=True)

    class Meta:
        model = CallSession
        fields = [
            "id", "thread", "requester", "requester_name", "receiver", "receiver_name",
            "status", "started_at", "ended_at", "notes",
        ]
        read_only_fields = ["requester", "receiver", "started_at", "ended_at"]


class SavedJobSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source="job", read_only=True)

    class Meta:
        model = SavedJob
        fields = ["id", "worker", "job", "created_at", "job_details"]
        read_only_fields = ["worker", "created_at"]


class JobOfferSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source="job.title", read_only=True)
    worker_name = serializers.CharField(source="worker.first_name", read_only=True)
    employer_name = serializers.CharField(source="employer.first_name", read_only=True)

    class Meta:
        model = JobOffer
        fields = [
            "id", "application", "job", "job_title", "employer", "employer_name",
            "worker", "worker_name", "message", "contract_text", "status",
            "employer_signature_name", "worker_signature_name",
            "employer_signed_at", "worker_signed_at",
            "created_at", "responded_at",
        ]
        read_only_fields = ["employer", "worker", "job", "created_at", "responded_at"]
