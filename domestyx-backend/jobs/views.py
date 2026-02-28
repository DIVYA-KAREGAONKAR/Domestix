from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, F, Q
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.response import Response

from django.utils import timezone

from .models import (
    Application,
    CallSession,
    ChatMessage,
    ChatThread,
    EmployerReview,
    Job,
    JobOffer,
    SavedJob,
    ShortlistedWorker,
    WorkerReview,
)
from .serializers import (
    ApplicationSerializer,
    CallSessionSerializer,
    ChatMessageSerializer,
    ChatThreadSerializer,
    EmployerReviewSerializer,
    JobSerializer,
    JobOfferSerializer,
    SavedJobSerializer,
    ShortlistedWorkerSerializer,
    WorkerReviewSerializer,
)

User = get_user_model()


def _user_role(user):
    return (getattr(user, "role", "") or "").strip().lower()


def _normalize_list(value):
    if isinstance(value, list):
        return [str(item).strip().lower() for item in value if str(item).strip()]
    if isinstance(value, str):
        return [item.strip().lower() for item in value.split(",") if item.strip()]
    return []


def _score_worker_for_job(job, worker_profile):
    score = 0
    job_text = f"{job.title} {job.description}".lower()
    worker_services = set(_normalize_list(worker_profile.services))
    worker_languages = set(_normalize_list(worker_profile.languages))
    required_skills = set(_normalize_list(getattr(job, "skills_required", [])))
    required_languages = set(_normalize_list(getattr(job, "language_requirements", [])))

    score += sum(1 for service in worker_services if service in job_text)
    score += min(sum(1 for language in worker_languages if language in job_text), 2)
    score += sum(2 for skill in worker_services if skill in required_skills)
    score += sum(1 for language in worker_languages if language in required_languages)

    preferred_nationality = (getattr(job, "preferred_nationality", "") or "").strip().lower()
    worker_nationality = (getattr(worker_profile, "nationality", "") or "").strip().lower()
    if preferred_nationality and worker_nationality and preferred_nationality == worker_nationality:
        score += 2

    job_location = (job.location or "").lower()
    location_parts = {
        (worker_profile.city or "").lower(),
        (worker_profile.state or "").lower(),
        (worker_profile.country or "").lower(),
    }
    if any(part and part in job_location for part in location_parts):
        score += 2

    return score


def _score_job_for_worker(job, worker_profile):
    return _score_worker_for_job(job, worker_profile)


def _worker_snapshot(worker):
    profile = getattr(worker, 'worker_profile', None)
    services = profile.services if profile else []
    availability = profile.availability if profile else []
    is_verified = bool(profile and (profile.is_background_checked or profile.has_references))
    return {
        'id': worker.id,
        'name': f'{worker.first_name} {worker.last_name}'.strip(),
        'email': worker.email,
        'phone': profile.phone if profile else '',
        'experience': profile.experience if profile else '',
        'gender': profile.gender if profile else '',
        'nationality': profile.nationality if profile else '',
        'services': services,
        'job_roles': services,
        'languages': profile.languages if profile else [],
        'availability': availability,
        'work_preference': profile.work_preference if profile else '',
        'preferred_work_locations': profile.preferred_work_locations if profile else [],
        'willing_to_relocate': bool(profile and profile.willing_to_relocate),
        'bio': profile.bio if profile else '',
        'expected_salary_hourly': str(profile.hourly_rate) if profile and profile.hourly_rate is not None else '',
        'expected_salary_full_time': str(profile.expected_salary_full_time) if profile and profile.expected_salary_full_time is not None else '',
        'expected_salary_part_time': str(profile.expected_salary_part_time) if profile and profile.expected_salary_part_time is not None else '',
        'expected_benefits': profile.expected_benefits if profile else [],
        'available_from': str(profile.available_from) if profile and profile.available_from else '',
        'is_verified': is_verified,
        'is_background_checked': bool(profile and profile.is_background_checked),
        'has_references': bool(profile and profile.has_references),
        'visa_type': profile.visa_type if profile else '',
        'work_permit_status': profile.work_permit_status if profile else '',
        'police_clearance_available': bool(profile and profile.police_clearance_available),
        'has_criminal_record': bool(profile and profile.has_criminal_record),
        'profile_image': profile.profile_image.url if profile and profile.profile_image else None,
        'location': {
            'city': profile.city if profile else '',
            'state': profile.state if profile else '',
            'country': profile.country if profile else '',
        },
    }


# 1. Browse Jobs (for Workers)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_jobs(request):
    search_query = request.query_params.get('search', '') or request.query_params.get('q', '')
    category = request.query_params.get('category', '') or request.query_params.get('job_type', '')
    location = request.query_params.get('location', '')
    min_salary = request.query_params.get('min_salary', '')
    max_salary = request.query_params.get('max_salary', '')
    jobs = Job.objects.filter(status='active', review_status='approved').order_by('-posted_at')
    
    if search_query:
        jobs = jobs.filter(
            Q(title__icontains=search_query) | 
            Q(location__icontains=search_query) |
            Q(description__icontains=search_query)
        )
    if category and category != 'all':
        jobs = jobs.filter(job_type__icontains=category)
    if location:
        jobs = jobs.filter(location__icontains=location)
    try:
        if min_salary != "":
            min_val = float(min_salary)
            jobs = jobs.filter(
                Q(full_time_salary__gte=min_val) |
                Q(part_time_salary__gte=min_val) |
                Q(hourly_wage__gte=min_val)
            )
        if max_salary != "":
            max_val = float(max_salary)
            jobs = jobs.filter(
                Q(full_time_salary__lte=max_val) |
                Q(part_time_salary__lte=max_val) |
                Q(hourly_wage__lte=max_val)
            )
    except ValueError:
        return Response({"error": "min_salary/max_salary must be numeric."}, status=status.HTTP_400_BAD_REQUEST)
        
    serializer = JobSerializer(jobs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_jobs(request):
    search_query = request.query_params.get('search', '') or request.query_params.get('q', '')
    category = request.query_params.get('category', '') or request.query_params.get('job_type', '')
    location = request.query_params.get('location', '')
    min_salary = request.query_params.get('min_salary', '')
    max_salary = request.query_params.get('max_salary', '')
    jobs = Job.objects.filter(status='active', review_status='approved').order_by('-posted_at')
    
    if search_query:
        jobs = jobs.filter(
            Q(title__icontains=search_query) | 
            Q(location__icontains=search_query) |
            Q(description__icontains=search_query)
        )
    if category and category != 'all':
        jobs = jobs.filter(job_type__icontains=category)
    if location:
        jobs = jobs.filter(location__icontains=location)
    try:
        if min_salary != "":
            min_val = float(min_salary)
            jobs = jobs.filter(
                Q(full_time_salary__gte=min_val) |
                Q(part_time_salary__gte=min_val) |
                Q(hourly_wage__gte=min_val)
            )
        if max_salary != "":
            max_val = float(max_salary)
            jobs = jobs.filter(
                Q(full_time_salary__lte=max_val) |
                Q(part_time_salary__lte=max_val) |
                Q(hourly_wage__lte=max_val)
            )
    except ValueError:
        return Response({"error": "min_salary/max_salary must be numeric."}, status=status.HTTP_400_BAD_REQUEST)
        
    serializer = JobSerializer(jobs, many=True)
    return Response(serializer.data)

# 2. Employer's Posted Jobs (The missing class that caused the Build Error)
class EmployerJobListView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if _user_role(self.request.user) != 'employer':
            return Job.objects.none()
        return Job.objects.filter(employer=self.request.user).order_by('-posted_at')
        
    def perform_create(self, serializer):
        if _user_role(self.request.user) != 'employer':
            raise PermissionDenied('Only employers can post jobs.')
        serializer.save(employer=self.request.user, review_status="pending")


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def employer_job_status(request, job_id):
    if _user_role(request.user) != "employer":
        return Response({"message": "Only employers can update job status."}, status=status.HTTP_403_FORBIDDEN)
    try:
        job = Job.objects.get(id=job_id, employer=request.user)
    except Job.DoesNotExist:
        return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

    new_status = (request.data.get("status") or "").strip().lower()
    allowed = {"active", "filled", "closed"}
    if new_status not in allowed:
        return Response({"error": "Invalid status. Use active, filled, or closed."}, status=status.HTTP_400_BAD_REQUEST)
    job.status = new_status
    job.save(update_fields=["status"])
    return Response(JobSerializer(job, context={"request": request}).data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def employer_delete_job(request, job_id):
    if _user_role(request.user) != "employer":
        return Response({"message": "Only employers can delete jobs."}, status=status.HTTP_403_FORBIDDEN)
    try:
        job = Job.objects.get(id=job_id, employer=request.user)
    except Job.DoesNotExist:
        return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)
    job.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def agency_employers(request):
    if _user_role(request.user) != "agency":
        return Response({"message": "Only agencies can access employers list."}, status=status.HTTP_403_FORBIDDEN)

    employers = User.objects.filter(role="employer").select_related("employer_profile").order_by("first_name", "last_name")
    payload = []
    for employer in employers:
        profile = getattr(employer, "employer_profile", None)
        payload.append(
            {
                "id": employer.id,
                "name": f"{employer.first_name} {employer.last_name}".strip() or employer.email,
                "email": employer.email,
                "company_name": profile.company_name if profile else "",
            }
        )
    return Response(payload)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def agency_post_job_for_employer(request):
    if _user_role(request.user) != "agency":
        return Response({"message": "Only agencies can create jobs for employers."}, status=status.HTTP_403_FORBIDDEN)

    employer_id = request.data.get("employer_id")
    if not employer_id:
        return Response({"error": "employer_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        employer = User.objects.get(id=employer_id, role="employer")
    except User.DoesNotExist:
        return Response({"error": "Employer not found."}, status=status.HTTP_404_NOT_FOUND)

    payload = request.data.copy()
    payload.pop("employer_id", None)
    serializer = JobSerializer(data=payload, context={"request": request})
    serializer.is_valid(raise_exception=True)
    job = serializer.save(employer=employer, review_status="pending")
    return Response(JobSerializer(job, context={"request": request}).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def government_job_reviews(request):
    if _user_role(request.user) != "government":
        return Response({"message": "Only government users can review jobs."}, status=status.HTTP_403_FORBIDDEN)

    status_filter = (request.query_params.get("status") or "").strip().lower()
    queryset = Job.objects.select_related("employer").order_by("-posted_at")
    if status_filter:
        queryset = queryset.filter(review_status=status_filter)
    return Response(JobSerializer(queryset, many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def government_update_job_review(request, job_id):
    if _user_role(request.user) != "government":
        return Response({"message": "Only government users can update job reviews."}, status=status.HTTP_403_FORBIDDEN)
    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

    review_status = (request.data.get("review_status") or "").strip().lower()
    if review_status not in {"approved", "rejected", "pending"}:
        return Response({"error": "Invalid review_status. Use approved, rejected, or pending."}, status=status.HTTP_400_BAD_REQUEST)

    job.review_status = review_status
    if "review_notes" in request.data:
        job.review_notes = (request.data.get("review_notes") or "").strip()
    job.reviewed_at = timezone.now()
    job.save(update_fields=["review_status", "review_notes", "reviewed_at"])
    return Response(JobSerializer(job).data)

# 3. Worker's Applications
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_applications(request):
    if _user_role(request.user) != 'worker':
        return Response({'message': 'Only workers can view applications.'}, status=status.HTTP_403_FORBIDDEN)

    applications = Application.objects.filter(worker=request.user).order_by('-applied_at')
    serializer = ApplicationSerializer(applications, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def worker_notifications(request):
    if _user_role(request.user) != "worker":
        return Response({"message": "Only workers can view notifications."}, status=status.HTTP_403_FORBIDDEN)

    applications = (
        Application.objects.filter(worker=request.user)
        .exclude(status="applied")
        .select_related("job", "job__employer")
        .order_by("-applied_at")[:50]
    )
    payload = [
        {
            "id": app.id,
            "job_id": app.job_id,
            "job_title": app.job.title,
            "employer_name": f"{app.job.employer.first_name} {app.job.employer.last_name}".strip() or app.job.employer.email,
            "status": app.status,
            "updated_at": app.applied_at,
            "message": f"Your application for {app.job.title} is now {app.status}.",
        }
        for app in applications
    ]
    offers = JobOffer.objects.filter(worker=request.user).select_related("job", "employer").order_by("-created_at")[:50]
    payload.extend(
        [
            {
                "id": 100000 + offer.id,
                "job_id": offer.job_id,
                "job_title": offer.job.title,
                "employer_name": f"{offer.employer.first_name} {offer.employer.last_name}".strip() or offer.employer.email,
                "status": offer.status,
                "updated_at": offer.responded_at or offer.created_at,
                "message": f"Offer for {offer.job.title}: {offer.status}.",
            }
            for offer in offers
        ]
    )
    return Response(payload)


@api_view(["GET", "POST", "DELETE"])
@permission_classes([IsAuthenticated])
def worker_saved_jobs(request):
    if _user_role(request.user) != "worker":
        return Response({"message": "Only workers can manage saved jobs."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        queryset = SavedJob.objects.filter(worker=request.user).select_related("job", "job__employer").order_by("-created_at")
        serializer = SavedJobSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    job_id = request.data.get("job_id") if request.method == "POST" else request.query_params.get("job_id")
    if not job_id:
        return Response({"error": "job_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "POST":
        saved, created = SavedJob.objects.get_or_create(worker=request.user, job=job)
        serializer = SavedJobSerializer(saved, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    deleted_count, _ = SavedJob.objects.filter(worker=request.user, job=job).delete()
    if deleted_count == 0:
        return Response({"message": "Saved job not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def compare_jobs(request):
    if _user_role(request.user) != "worker":
        return Response({"message": "Only workers can compare jobs."}, status=status.HTTP_403_FORBIDDEN)

    job_ids = (request.query_params.get("job_ids") or "").strip()
    if not job_ids:
        return Response({"error": "job_ids query param is required."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        id_list = [int(pk) for pk in job_ids.split(",") if pk.strip()]
    except ValueError:
        return Response({"error": "job_ids must be comma-separated integers."}, status=status.HTTP_400_BAD_REQUEST)

    jobs = Job.objects.filter(id__in=id_list, status="active", review_status="approved").select_related("employer")
    jobs_map = {job.id: job for job in jobs}
    ordered_jobs = [jobs_map[job_id] for job_id in id_list if job_id in jobs_map]
    serializer = JobSerializer(ordered_jobs, many=True, context={"request": request})
    return Response(serializer.data)

# 4. Apply to Job
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def apply_to_job(request, job_id):
    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({'message': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if _user_role(request.user) != 'worker':
        return Response(
            {'message': 'Only workers can apply to jobs.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    if job.status != 'active':
        return Response({'message': 'This job is no longer accepting applications.'}, status=status.HTTP_400_BAD_REQUEST)
    if job.review_status != "approved":
        return Response({'message': 'This job is pending review and not open for applications.'}, status=status.HTTP_400_BAD_REQUEST)
        
    if Application.objects.filter(worker=request.user, job=job).exists():
        return Response({'message': 'Already applied for this job.'}, status=status.HTTP_400_BAD_REQUEST)
        
    application = Application.objects.create(
        job=job, 
        worker=request.user, 
        cover_note=(request.data.get("cover_note") or "").strip(),
        supporting_document=request.FILES.get("supporting_document"),
        status='applied'
    )
    Job.objects.filter(id=job.id).update(applications=F('applications') + 1)
    
    return Response(ApplicationSerializer(application).data, status=status.HTTP_201_CREATED)

# 5. Update Application Status (Hire/Reject)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_application_status(request, pk):
    if _user_role(request.user) != 'employer':
        return Response({'message': 'Only employers can update application status.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        application = Application.objects.get(pk=pk, job__employer=request.user)
    except Application.DoesNotExist:
        return Response({"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND)

    new_status = (request.data.get('status') or '').strip().lower()
    status_map = {
        'accepted': 'hired',
        'hired': 'hired',
        'interview': 'interview',
        'rejected': 'rejected',
    }
    resolved_status = status_map.get(new_status)
    if not resolved_status:
        return Response(
            {'error': "Invalid status. Use one of: interview, hired, accepted, rejected."},
            status=status.HTTP_400_BAD_REQUEST
        )

    application.status = resolved_status
    if resolved_status == 'hired':
        job = application.job
        job.status = 'filled'
        job.save(update_fields=['status'])
    
    application.save()
    return Response(ApplicationSerializer(application).data)

# 6. Employer Application History
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employer_application_history(request):
    if _user_role(request.user) != 'employer':
        return Response({'message': 'Only employers can view application history.'}, status=status.HTTP_403_FORBIDDEN)

    history = Application.objects.filter(
        job__employer=request.user
    ).select_related('job', 'worker').exclude(status='applied').order_by('-applied_at')
    
    serializer = ApplicationSerializer(history, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employer_job_applications(request, job_id):
    if _user_role(request.user) != 'employer':
        return Response({'message': 'Only employers can view job applications.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        job = Job.objects.get(id=job_id, employer=request.user)
    except Job.DoesNotExist:
        return Response({'message': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    status_filter = (request.query_params.get('status') or '').strip().lower()
    applications = Application.objects.filter(job=job).order_by('-applied_at')
    if status_filter:
        applications = applications.filter(status=status_filter)

    serializer = ApplicationSerializer(applications, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommended_jobs(request):
    if _user_role(request.user) != 'worker':
        return Response({'message': 'Only workers can get job recommendations.'}, status=status.HTTP_403_FORBIDDEN)

    profile = getattr(request.user, 'worker_profile', None)
    if not profile:
        return Response([], status=status.HTTP_200_OK)

    scored_jobs = []
    for job in Job.objects.filter(status='active', review_status='approved').order_by('-posted_at'):
        score = _score_job_for_worker(job, profile)
        if score > 0:
            scored_jobs.append((score, job))

    scored_jobs.sort(key=lambda item: (item[0], item[1].posted_at), reverse=True)
    jobs = [job for _, job in scored_jobs[:20]]
    scores = {job.id: score for score, job in scored_jobs[:20]}

    serializer = JobSerializer(jobs, many=True, context={'request': request})
    data = serializer.data
    for item in data:
        item['match_score'] = scores.get(item['id'], 0)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommended_workers(request, job_id):
    if _user_role(request.user) != 'employer':
        return Response({'message': 'Only employers can get worker recommendations.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        job = Job.objects.get(id=job_id, employer=request.user)
    except Job.DoesNotExist:
        return Response({'message': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    workers = User.objects.filter(role='worker').select_related('worker_profile')
    recommendations = []
    for worker in workers:
        profile = getattr(worker, 'worker_profile', None)
        if not profile:
            continue
        score = _score_worker_for_job(job, profile)
        if score <= 0:
            continue
        recommendations.append({
            'worker_id': worker.id,
            'name': f'{worker.first_name} {worker.last_name}'.strip(),
            'email': worker.email,
            'phone': profile.phone,
            'experience': profile.experience,
            'services': profile.services,
            'languages': profile.languages,
            'location': {
                'city': profile.city,
                'state': profile.state,
                'country': profile.country,
            },
            'profile_image': profile.profile_image.url if profile.profile_image else None,
            'match_score': score,
        })

    recommendations.sort(key=lambda item: item['match_score'], reverse=True)
    return Response(recommendations[:30])


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def shortlist_worker(request, worker_id):
    if _user_role(request.user) != 'employer':
        return Response({'message': 'Only employers can manage shortlists.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        worker = User.objects.get(id=worker_id, role='worker')
    except User.DoesNotExist:
        return Response({'message': 'Worker not found.'}, status=status.HTTP_404_NOT_FOUND)

    job_id = request.data.get('job_id') if request.method == 'POST' else request.query_params.get('job_id')
    job = None
    if job_id:
        try:
            job = Job.objects.get(id=job_id, employer=request.user)
        except Job.DoesNotExist:
            return Response({'message': 'Job not found for this employer.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        shortlist, created = ShortlistedWorker.objects.get_or_create(
            employer=request.user,
            worker=worker,
            job=job,
            defaults={'notes': request.data.get('notes', '').strip()},
        )
        if not created and 'notes' in request.data:
            shortlist.notes = request.data.get('notes', '').strip()
            shortlist.save(update_fields=['notes'])
        serializer = ShortlistedWorkerSerializer(shortlist)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    queryset = ShortlistedWorker.objects.filter(employer=request.user, worker=worker)
    if job is not None:
        queryset = queryset.filter(job=job)

    deleted_count, _ = queryset.delete()
    if deleted_count == 0:
        return Response({'message': 'Shortlist entry not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shortlisted_workers(request):
    if _user_role(request.user) != 'employer':
        return Response({'message': 'Only employers can view shortlists.'}, status=status.HTTP_403_FORBIDDEN)

    queryset = ShortlistedWorker.objects.filter(employer=request.user).select_related('worker', 'worker__worker_profile', 'job')
    job_id = request.query_params.get('job_id')
    if job_id:
        queryset = queryset.filter(job_id=job_id)

    serializer = ShortlistedWorkerSerializer(queryset.order_by('-created_at'), many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def compare_workers(request):
    if _user_role(request.user) != 'employer':
        return Response({'message': 'Only employers can compare workers.'}, status=status.HTTP_403_FORBIDDEN)

    worker_ids = request.query_params.get('worker_ids', '').strip()
    if not worker_ids:
        return Response({'error': 'worker_ids query param is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        id_list = [int(pk) for pk in worker_ids.split(',') if pk.strip()]
    except ValueError:
        return Response({'error': 'worker_ids must be comma-separated integers.'}, status=status.HTTP_400_BAD_REQUEST)

    if not id_list:
        return Response({'error': 'No valid worker IDs provided.'}, status=status.HTTP_400_BAD_REQUEST)

    workers = User.objects.filter(id__in=id_list, role='worker').select_related('worker_profile')
    worker_map = {worker.id: worker for worker in workers}
    comparison = []
    for worker_id in id_list:
        worker = worker_map.get(worker_id)
        if not worker:
            continue
        item = _worker_snapshot(worker)
        item['total_applications'] = Application.objects.filter(worker=worker).count()
        item['total_hired'] = Application.objects.filter(worker=worker, status='hired').count()
        review_agg = WorkerReview.objects.filter(worker=worker).aggregate(avg=Avg("rating"), count=Count("id"))
        item['average_rating'] = round(float(review_agg["avg"]), 2) if review_agg["avg"] is not None else None
        item['total_reviews'] = review_agg["count"] or 0
        comparison.append(item)

    return Response(comparison)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def worker_reviews(request):
    role = _user_role(request.user)
    if request.method == "GET":
        if role == "employer":
            queryset = WorkerReview.objects.filter(reviewer=request.user).select_related("worker", "job")
        elif role == "worker":
            queryset = WorkerReview.objects.filter(worker=request.user).select_related("reviewer", "job")
        else:
            queryset = WorkerReview.objects.none()
        serializer = WorkerReviewSerializer(queryset.order_by("-created_at"), many=True)
        return Response(serializer.data)

    if role != "employer":
        return Response({"message": "Only employers can submit worker feedback."}, status=status.HTTP_403_FORBIDDEN)

    worker_id = request.data.get("worker_id")
    rating = request.data.get("rating")
    if not worker_id or not rating:
        return Response({"error": "worker_id and rating are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        worker = User.objects.get(id=worker_id, role="worker")
    except User.DoesNotExist:
        return Response({"error": "Worker not found."}, status=status.HTTP_404_NOT_FOUND)

    try:
        rating_int = int(rating)
    except (TypeError, ValueError):
        return Response({"error": "rating must be an integer between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
    if rating_int < 1 or rating_int > 5:
        return Response({"error": "rating must be between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)

    job = None
    job_id = request.data.get("job_id")
    if job_id:
        try:
            job = Job.objects.get(id=job_id, employer=request.user)
        except Job.DoesNotExist:
            return Response({"error": "Job not found for this employer."}, status=status.HTTP_404_NOT_FOUND)
        hired_exists = Application.objects.filter(job=job, worker=worker, status="hired").exists()
    else:
        hired_exists = Application.objects.filter(job__employer=request.user, worker=worker, status="hired").exists()

    if not hired_exists:
        return Response({"error": "Feedback is allowed only for hired workers."}, status=status.HTTP_400_BAD_REQUEST)

    review, _ = WorkerReview.objects.update_or_create(
        reviewer=request.user,
        worker=worker,
        job=job,
        defaults={
            "rating": rating_int,
            "comment": (request.data.get("comment") or "").strip(),
        },
    )
    serializer = WorkerReviewSerializer(review)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def employer_reviews(request):
    role = _user_role(request.user)
    if request.method == "GET":
        if role == "worker":
            queryset = EmployerReview.objects.filter(reviewer=request.user).select_related("employer", "job")
        elif role == "employer":
            queryset = EmployerReview.objects.filter(employer=request.user).select_related("reviewer", "job")
        else:
            queryset = EmployerReview.objects.none()
        serializer = EmployerReviewSerializer(queryset.order_by("-created_at"), many=True)
        return Response(serializer.data)

    if role != "worker":
        return Response({"message": "Only workers can submit employer feedback."}, status=status.HTTP_403_FORBIDDEN)

    employer_id = request.data.get("employer_id")
    rating = request.data.get("rating")
    if not employer_id or not rating:
        return Response({"error": "employer_id and rating are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        employer = User.objects.get(id=employer_id, role="employer")
    except User.DoesNotExist:
        return Response({"error": "Employer not found."}, status=status.HTTP_404_NOT_FOUND)

    try:
        rating_int = int(rating)
    except (TypeError, ValueError):
        return Response({"error": "rating must be an integer between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
    if rating_int < 1 or rating_int > 5:
        return Response({"error": "rating must be between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)

    job = None
    job_id = request.data.get("job_id")
    if job_id:
        try:
            job = Job.objects.get(id=job_id, employer=employer)
        except Job.DoesNotExist:
            return Response({"error": "Job not found for this employer."}, status=status.HTTP_404_NOT_FOUND)
        hired_exists = Application.objects.filter(job=job, worker=request.user, status="hired").exists()
    else:
        hired_exists = Application.objects.filter(job__employer=employer, worker=request.user, status="hired").exists()

    if not hired_exists:
        return Response({"error": "Feedback is allowed only after being hired by this employer."}, status=status.HTTP_400_BAD_REQUEST)

    review, _ = EmployerReview.objects.update_or_create(
        reviewer=request.user,
        employer=employer,
        job=job,
        defaults={
            "rating": rating_int,
            "comment": (request.data.get("comment") or "").strip(),
        },
    )
    serializer = EmployerReviewSerializer(review)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


def _thread_queryset_for_user(user):
    if _user_role(user) == "employer":
        return ChatThread.objects.filter(employer=user)
    if _user_role(user) == "worker":
        return ChatThread.objects.filter(worker=user)
    return ChatThread.objects.none()


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def chat_threads(request):
    role = _user_role(request.user)
    if request.method == "GET":
        queryset = _thread_queryset_for_user(request.user).select_related("employer", "worker", "job").order_by("-created_at")
        serializer = ChatThreadSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    job = None
    job_id = request.data.get("job_id")
    if job_id:
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

    if role == "employer":
        worker_id = request.data.get("worker_id")
        if not worker_id:
            return Response({"error": "worker_id is required for employers."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            worker = User.objects.get(id=worker_id, role="worker")
        except User.DoesNotExist:
            return Response({"error": "Worker not found."}, status=status.HTTP_404_NOT_FOUND)
        employer = request.user
    elif role == "worker":
        employer_id = request.data.get("employer_id")
        if not employer_id:
            return Response({"error": "employer_id is required for workers."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            employer = User.objects.get(id=employer_id, role="employer")
        except User.DoesNotExist:
            return Response({"error": "Employer not found."}, status=status.HTTP_404_NOT_FOUND)
        worker = request.user
    else:
        return Response({"message": "Unsupported role for chat."}, status=status.HTTP_403_FORBIDDEN)

    thread, _ = ChatThread.objects.get_or_create(employer=employer, worker=worker, job=job)
    serializer = ChatThreadSerializer(thread, context={"request": request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def chat_messages(request, thread_id):
    try:
        thread = ChatThread.objects.select_related("employer", "worker").get(id=thread_id)
    except ChatThread.DoesNotExist:
        return Response({"error": "Thread not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.user.id not in {thread.employer_id, thread.worker_id}:
        return Response({"message": "Not allowed to access this thread."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        messages = thread.messages.select_related("sender").order_by("created_at")
        thread.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    text = (request.data.get("message") or "").strip()
    if not text:
        return Response({"error": "message is required."}, status=status.HTTP_400_BAD_REQUEST)

    message = ChatMessage.objects.create(
        thread=thread,
        sender=request.user,
        message=text,
    )
    serializer = ChatMessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST", "PATCH"])
@permission_classes([IsAuthenticated])
def chat_calls(request, thread_id):
    try:
        thread = ChatThread.objects.select_related("employer", "worker").get(id=thread_id)
    except ChatThread.DoesNotExist:
        return Response({"error": "Thread not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.user.id not in {thread.employer_id, thread.worker_id}:
        return Response({"message": "Not allowed to access this thread."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        queryset = thread.call_sessions.order_by("-started_at")
        return Response(CallSessionSerializer(queryset, many=True).data)

    if request.method == "POST":
        receiver_id = thread.worker_id if request.user.id == thread.employer_id else thread.employer_id
        active_exists = thread.call_sessions.filter(status__in=["requested", "accepted"]).exists()
        if active_exists:
            return Response({"error": "An active/pending call already exists for this thread."}, status=status.HTTP_400_BAD_REQUEST)
        call = CallSession.objects.create(
            thread=thread,
            requester=request.user,
            receiver_id=receiver_id,
            status="requested",
            notes=(request.data.get("notes") or "").strip(),
        )
        return Response(CallSessionSerializer(call).data, status=status.HTTP_201_CREATED)

    call_id = request.data.get("call_id")
    action = (request.data.get("action") or "").strip().lower()
    if not call_id or action not in {"accept", "reject", "end"}:
        return Response({"error": "call_id and valid action (accept|reject|end) are required."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        call = thread.call_sessions.get(id=call_id)
    except CallSession.DoesNotExist:
        return Response({"error": "Call not found."}, status=status.HTTP_404_NOT_FOUND)

    if action in {"accept", "reject"} and request.user.id != call.receiver_id:
        return Response({"message": "Only receiver can accept/reject this call."}, status=status.HTTP_403_FORBIDDEN)
    if action == "end" and request.user.id not in {call.requester_id, call.receiver_id}:
        return Response({"message": "Only call participants can end this call."}, status=status.HTTP_403_FORBIDDEN)

    if action == "accept":
        call.status = "accepted"
    elif action == "reject":
        call.status = "rejected"
        call.ended_at = timezone.now()
    elif action == "end":
        call.status = "ended"
        call.ended_at = timezone.now()
    call.save(update_fields=["status", "ended_at"] if call.ended_at else ["status"])
    return Response(CallSessionSerializer(call).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def employer_offers(request):
    if _user_role(request.user) != "employer":
        return Response({"message": "Only employers can manage offers."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        queryset = JobOffer.objects.filter(employer=request.user).select_related("job", "worker", "application").order_by("-created_at")
        return Response(JobOfferSerializer(queryset, many=True).data)

    application_id = request.data.get("application_id")
    if not application_id:
        return Response({"error": "application_id is required."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        application = Application.objects.select_related("job", "worker").get(id=application_id, job__employer=request.user)
    except Application.DoesNotExist:
        return Response({"error": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

    offer = JobOffer.objects.create(
        application=application,
        job=application.job,
        employer=request.user,
        worker=application.worker,
        message=(request.data.get("message") or "").strip(),
        contract_text=(request.data.get("contract_text") or "").strip(),
    )
    return Response(JobOfferSerializer(offer).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def worker_offers(request):
    if _user_role(request.user) != "worker":
        return Response({"message": "Only workers can view offers."}, status=status.HTTP_403_FORBIDDEN)
    queryset = JobOffer.objects.filter(worker=request.user).select_related("job", "employer", "application").order_by("-created_at")
    return Response(JobOfferSerializer(queryset, many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def worker_respond_offer(request, offer_id):
    if _user_role(request.user) != "worker":
        return Response({"message": "Only workers can respond to offers."}, status=status.HTTP_403_FORBIDDEN)
    try:
        offer = JobOffer.objects.select_related("application", "job").get(id=offer_id, worker=request.user)
    except JobOffer.DoesNotExist:
        return Response({"error": "Offer not found."}, status=status.HTTP_404_NOT_FOUND)

    action = (request.data.get("status") or "").strip().lower()
    if action not in {"accepted", "rejected"}:
        return Response({"error": "status must be accepted or rejected."}, status=status.HTTP_400_BAD_REQUEST)
    offer.status = action
    offer.responded_at = timezone.now()
    offer.save(update_fields=["status", "responded_at"])

    if action == "accepted":
        application = offer.application
        application.status = "hired"
        application.save(update_fields=["status"])
        offer.job.status = "filled"
        offer.job.save(update_fields=["status"])

    return Response(JobOfferSerializer(offer).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def sign_offer(request, offer_id):
    try:
        offer = JobOffer.objects.get(id=offer_id)
    except JobOffer.DoesNotExist:
        return Response({"error": "Offer not found."}, status=status.HTTP_404_NOT_FOUND)

    role = _user_role(request.user)
    signature_name = (request.data.get("signature_name") or "").strip()
    if not signature_name:
        return Response({"error": "signature_name is required."}, status=status.HTTP_400_BAD_REQUEST)

    if role == "employer" and request.user.id == offer.employer_id:
        offer.employer_signature_name = signature_name
        offer.employer_signed_at = timezone.now()
        offer.save(update_fields=["employer_signature_name", "employer_signed_at"])
        return Response(JobOfferSerializer(offer).data)

    if role == "worker" and request.user.id == offer.worker_id:
        offer.worker_signature_name = signature_name
        offer.worker_signed_at = timezone.now()
        offer.save(update_fields=["worker_signature_name", "worker_signed_at"])
        return Response(JobOfferSerializer(offer).data)

    return Response({"message": "Not allowed to sign this offer."}, status=status.HTTP_403_FORBIDDEN)
