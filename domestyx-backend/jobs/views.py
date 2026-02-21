# jobs/views.py
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Job, Application
from .serializers import JobSerializer, ApplicationSerializer

class EmployerJobListView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Job.objects.filter(employer=self.request.user).order_by('-posted_at')
        
    def perform_create(self, serializer):
        serializer.save(employer=self.request.user)

# 💡 New view for workers to see available jobs
class WorkerJobListView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # We'll add logic here later to filter by worker skills, but for now, we'll return all jobs.
        return Job.objects.filter(status='active').order_by('-posted_at')

    def get_serializer_context(self):
        # 💡 Pass the request to the serializer to check if the user has applied
        context = super().get_serializer_context()
        return context

# 💡 New view to handle job applications
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_to_job(request, job_id):
    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if not request.user.is_worker:
        return Response({'message': 'Only workers can apply to jobs.'}, status=status.HTTP_403_FORBIDDEN)
        
    if Application.objects.filter(worker=request.user, job=job).exists():
        return Response({'message': 'You have already applied for this job.'}, status=status.HTTP_400_BAD_REQUEST)
        
    application = Application.objects.create(job=job, worker=request.user)
    job.applications += 1
    job.save()

    serializer = ApplicationSerializer(application)
    return Response(serializer.data, status=status.HTTP_201_CREATED)