# jobs/serializers.py
from rest_framework import serializers
from .models import Job, Application

class JobSerializer(serializers.ModelSerializer):
    # 💡 Add a read-only field to check if the current user has applied
    has_applied = serializers.SerializerMethodField()
    employer = serializers.CharField(source='employer.first_name', read_only=True)

    class Meta:
        model = Job
        fields = '__all__'

    def get_has_applied(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            return Application.objects.filter(worker=user, job=obj).exists()
        return False
        
class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ('worker', 'job', 'status')