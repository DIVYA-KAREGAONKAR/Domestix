from django.urls import path
from . import views

urlpatterns = [
    # Worker Endpoints
    path('worker/available-jobs/', views.available_jobs, name='available_jobs'),
    path('worker/my-applications/', views.my_applications, name='my_applications'),
    
    # Employer Endpoints
    path('employer/jobs/', views.EmployerJobListView.as_view(), name='employer-jobs'),
    path('employer/application-history/', views.employer_application_history, name='employer-history'),
    
    # Shared/Action Endpoints
    path('jobs/<int:job_id>/apply/', views.apply_to_job, name='apply-to-job'),
    path('applications/<int:pk>/status/', views.update_application_status, name='update-status'),
]