from django.urls import path
from .views import (
    RegisterView, ProfileView, CustomTokenObtainPairView,
    send_otp, upload_worker_image, user_consent, verify_otp, worker_profile,
    agency_profile, agency_worker_submissions, compliance_reports,
    update_compliance_report, support_provider_profile, support_service_requests,
    update_support_service_request, government_analytics, government_profile,
    public_workers, deactivate_account, delete_account, support_service_messages, support_providers,
    update_agency_worker_submission,
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView
)

urlpatterns = [
    # Auth Endpoints
    path("register/", RegisterView.as_view(), name="register"),
    
    # ✅ Using your Custom view instead of the default one to include user roles
    path("token/", CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("otp/send/", send_otp, name="send_otp"),
    path("otp/verify/", verify_otp, name="verify_otp"),
    
    # Profile Endpoints
    path("profile/", ProfileView.as_view(), name="profile"),  # General user profile
    path("profile/deactivate/", deactivate_account, name="deactivate-account"),
    path("profile/delete/", delete_account, name="delete-account"),
    path("workers/public/", public_workers, name="public-workers"),
    path("consent/", user_consent, name="user-consent"),
    path("worker/profile/", worker_profile, name="worker-profile"),
    path("worker/profile/upload-image/", upload_worker_image, name="worker-upload-image"),
    path("agency/profile/", agency_profile, name="agency-profile"),
    path("agency/worker-submissions/", agency_worker_submissions, name="agency-worker-submissions"),
    path("agency/worker-submissions/<int:submission_id>/", update_agency_worker_submission, name="agency-worker-submission-update"),
    path("government/profile/", government_profile, name="government-profile"),
    path("reports/compliance/", compliance_reports, name="compliance-reports"),
    path("reports/compliance/<int:report_id>/", update_compliance_report, name="update-compliance-report"),
    path("reports/analytics/", government_analytics, name="government-analytics"),
    path("support/profile/", support_provider_profile, name="support-profile"),
    path("support/providers/", support_providers, name="support-providers"),
    path("support/requests/", support_service_requests, name="support-requests"),
    path("support/requests/<int:request_id>/", update_support_service_request, name="update-support-request"),
    path("support/requests/<int:request_id>/messages/", support_service_messages, name="support-request-messages"),
]
