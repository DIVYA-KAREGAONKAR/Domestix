from rest_framework import serializers
from .models import Job, Application

class ApplicationSerializer(serializers.ModelSerializer):
    job_details = serializers.SerializerMethodField()
    worker_details = serializers.SerializerMethodField()

    class Meta:
        model = Application
        # ✅ Include applied_at so the frontend can show the date
        fields = ['id', 'worker', 'job', 'status', 'applied_at', 'job_details', 'worker_details']
        read_only_fields = ('worker', 'job', 'applied_at')

    def get_job_details(self, obj):
        return {
            "title": obj.job.title,
            "location": obj.job.location,
            "salary": obj.job.salary
        }

    def get_worker_details(self, obj):
        worker = obj.worker
        if hasattr(worker, 'worker_profile'):
            profile = worker.worker_profile
            return {
                "name": f"{worker.first_name} {worker.last_name}",
                "profile_image": profile.profile_image.url if profile.profile_image else None,
                "bio": profile.bio,
                "experience": profile.experience,
            }
        return {"name": f"{worker.first_name} {worker.last_name}", "bio": "No profile created."}

class JobSerializer(serializers.ModelSerializer):
    has_applied = serializers.SerializerMethodField()
    employer_name = serializers.CharField(source='employer.first_name', read_only=True)
    applicants = ApplicationSerializer(source='job_applications', many=True, read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'salary', 'location', 
            'job_type', 'status', 'posted_at', 'employer_name', 'has_applied', 'applicants'
        ]
        read_only_fields = ('status', 'posted_at')

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return Application.objects.filter(worker=request.user, job=obj).exists()
        return False