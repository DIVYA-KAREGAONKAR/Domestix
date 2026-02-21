# jobs/urls.py
from django.urls import path
from .views import EmployerJobListView, WorkerJobListView, apply_to_job

urlpatterns = [
    # Employer views
    path('my-jobs/', EmployerJobListView.as_view(), name='my-jobs'),
    
    # Worker views
    path('available/', WorkerJobListView.as_view(), name='available-jobs'),
    path('<int:job_id>/apply/', apply_to_job, name='apply-to-job'),
]