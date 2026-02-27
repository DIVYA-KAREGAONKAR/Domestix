from django.urls import path
from . import views

urlpatterns = [
    # Worker Endpoints
    path('jobs/public/', views.public_jobs, name='public-jobs'),
    path('worker/available-jobs/', views.available_jobs, name='available_jobs'),
    path('worker/my-applications/', views.my_applications, name='my_applications'),
    path('worker/notifications/', views.worker_notifications, name='worker-notifications'),
    path('worker/saved-jobs/', views.worker_saved_jobs, name='worker-saved-jobs'),
    path('worker/compare-jobs/', views.compare_jobs, name='compare-jobs'),
    path('worker/recommended-jobs/', views.recommended_jobs, name='recommended-jobs'),
    
    # Employer Endpoints
    path('employer/jobs/', views.EmployerJobListView.as_view(), name='employer-jobs'),
    path('employer/jobs/<int:job_id>/applications/', views.employer_job_applications, name='employer-job-applications'),
    path('employer/jobs/<int:job_id>/status/', views.employer_job_status, name='employer-job-status'),
    path('employer/jobs/<int:job_id>/delete/', views.employer_delete_job, name='employer-delete-job'),
    path('employer/offers/', views.employer_offers, name='employer-offers'),
    path('worker/offers/', views.worker_offers, name='worker-offers'),
    path('worker/offers/<int:offer_id>/respond/', views.worker_respond_offer, name='worker-respond-offer'),
    path('offers/<int:offer_id>/sign/', views.sign_offer, name='sign-offer'),
    path('employer/jobs/<int:job_id>/recommended-workers/', views.recommended_workers, name='recommended-workers'),
    path('employer/workers/<int:worker_id>/shortlist/', views.shortlist_worker, name='shortlist-worker'),
    path('employer/shortlisted-workers/', views.shortlisted_workers, name='shortlisted-workers'),
    path('employer/compare-workers/', views.compare_workers, name='compare-workers'),
    path('employer/application-history/', views.employer_application_history, name='employer-history'),
    path('agency/employers/', views.agency_employers, name='agency-employers'),
    path('agency/jobs/create-for-employer/', views.agency_post_job_for_employer, name='agency-job-create-for-employer'),
    path('reports/job-reviews/', views.government_job_reviews, name='government-job-reviews'),
    path('reports/job-reviews/<int:job_id>/', views.government_update_job_review, name='government-update-job-review'),
    path('reviews/', views.worker_reviews, name='worker-reviews'),
    path('chat/threads/', views.chat_threads, name='chat-threads'),
    path('chat/threads/<int:thread_id>/messages/', views.chat_messages, name='chat-messages'),
    path('chat/threads/<int:thread_id>/calls/', views.chat_calls, name='chat-calls'),
    
    # Shared/Action Endpoints
    path('jobs/<int:job_id>/apply/', views.apply_to_job, name='apply-to-job'),
    path('applications/<int:pk>/status/', views.update_application_status, name='update-status'),
]
