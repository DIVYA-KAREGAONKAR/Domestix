from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Job, Application
from .serializers import JobSerializer, ApplicationSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_jobs(request):
    search_query = request.query_params.get('search', '')
    category = request.query_params.get('category', '')
    jobs = Job.objects.filter(status='active').order_by('-posted_at')
    
    if search_query:
        jobs = jobs.filter(
            Q(title__icontains=search_query) | 
            Q(location__icontains=search_query) |
            Q(description__icontains=search_query)
        )
    if category and category != 'all':
        jobs = jobs.filter(job_type__icontains=category)
        
    serializer = JobSerializer(jobs, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_applications(request):
    applications = Application.objects.filter(worker=request.user).order_by('-applied_at')
    serializer = ApplicationSerializer(applications, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_to_job(request, job_id):
    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.user.role != 'worker':
        return Response({'message': 'Only workers can apply.'}, status=status.HTTP_403_FORBIDDEN)
        
    if Application.objects.filter(worker=request.user, job=job).exists():
        return Response({'message': 'Already applied.'}, status=status.HTTP_400_BAD_REQUEST)
        
    application = Application.objects.create(job=job, worker=request.user, status='applied')
    return Response(ApplicationSerializer(application).data, status=status.HTTP_201_CREATED)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_application_status(request, pk):
    try:
        application = Application.objects.get(pk=pk, job__employer=request.user)
    except Application.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status == 'accepted':
        application.status = 'hired'
    elif new_status == 'rejected':
        application.status = 'rejected'
    
    application.save()
    return Response(ApplicationSerializer(application).data)

class EmployerJobListView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Job.objects.filter(employer=self.request.user).order_by('-posted_at')
        
    def perform_create(self, serializer):
        serializer.save(employer=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employer_application_history(request):
    history = Application.objects.filter(
        job__employer=request.user
    ).exclude(status='applied').order_by('-applied_at')
    
    serializer = ApplicationSerializer(history, many=True)
    return Response(serializer.data)