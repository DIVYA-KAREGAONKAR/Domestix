# jobs/models.py
from django.db import models
from django.conf import settings

class Job(models.Model):
    JOB_TYPES = [
        ('full-time', 'Full-time'),
        ('part-time', 'Part-time'),
        ('contract', 'Contract'),
        ('one-time', 'One-time'),
    ]

    employer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='job_postings')
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255)
    salary = models.CharField(max_length=100)
    job_type = models.CharField(max_length=20, choices=JOB_TYPES)
    preferred_gender = models.CharField(max_length=20, blank=True)
    preferred_age_range = models.CharField(max_length=50, blank=True)
    language_requirements = models.JSONField(default=list, blank=True)
    experience_required = models.CharField(max_length=50, blank=True)
    skills_required = models.JSONField(default=list, blank=True)
    workplace_type = models.CharField(max_length=50, blank=True)
    accommodation_provided = models.CharField(max_length=30, blank=True)
    food_provided = models.CharField(max_length=10, blank=True)
    work_schedule = models.CharField(max_length=50, blank=True)
    full_time_salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    part_time_salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    hourly_wage = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    additional_benefits = models.JSONField(default=list, blank=True)
    contract_type = models.CharField(max_length=80, blank=True)
    recruitment_method = models.CharField(max_length=80, blank=True)
    work_permit_sponsorship = models.CharField(max_length=80, blank=True)
    background_verification_required = models.BooleanField(default=False)
    preferred_nationality = models.CharField(max_length=80, blank=True)
    police_clearance_required = models.BooleanField(default=False)
    specific_expectations = models.TextField(blank=True)
    work_environment_description = models.TextField(blank=True)
    emergency_contact_name_number = models.CharField(max_length=255, blank=True)
    application_instructions = models.TextField(blank=True)
    contact_person_name = models.CharField(max_length=120, blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    contact_email = models.EmailField(blank=True)
    status = models.CharField(max_length=20, default='active')
    review_status = models.CharField(max_length=20, default="approved")
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    posted_at = models.DateTimeField(auto_now_add=True)
    applications = models.IntegerField(default=0)

    def __str__(self):
        return self.title

# 💡 New model to track job applications
class Application(models.Model):
    APPLICATION_STATUS = [
        ('applied', 'Applied'),
        ('interview', 'Interview'),
        ('hired', 'Hired'),
        ('rejected', 'Rejected'),
    ]
    
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='job_applications')
    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    cover_note = models.TextField(blank=True)
    supporting_document = models.FileField(upload_to="application_documents/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=APPLICATION_STATUS, default='applied')
    applied_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('job', 'worker',) # A worker can only apply once per job
    
    def __str__(self):
        return f'{self.worker.first_name} applied for {self.job.title}'


class SavedJob(models.Model):
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_jobs",
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="saved_by_workers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("worker", "job")

    def __str__(self):
        return f"{self.worker.email} saved {self.job.title}"


class JobOffer(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    )

    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name="offers",
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="offers",
    )
    employer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="offers_sent",
    )
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="offers_received",
    )
    message = models.TextField(blank=True)
    contract_text = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    employer_signature_name = models.CharField(max_length=120, blank=True)
    worker_signature_name = models.CharField(max_length=120, blank=True)
    employer_signed_at = models.DateTimeField(blank=True, null=True)
    worker_signed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Offer {self.id} ({self.status})"


class ShortlistedWorker(models.Model):
    employer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shortlisted_workers",
    )
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shortlisted_by",
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.SET_NULL,
        related_name="shortlisted_workers",
        blank=True,
        null=True,
    )
    notes = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("employer", "worker", "job")

    def __str__(self):
        return f"{self.employer.email} shortlisted {self.worker.email}"


class WorkerReview(models.Model):
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="worker_reviews_given",
    )
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="worker_reviews_received",
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.SET_NULL,
        related_name="worker_reviews",
        null=True,
        blank=True,
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("reviewer", "worker", "job")

    def __str__(self):
        return f"{self.reviewer.email} -> {self.worker.email} ({self.rating})"


class ChatThread(models.Model):
    employer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_threads_as_employer",
    )
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_threads_as_worker",
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.SET_NULL,
        related_name="chat_threads",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("employer", "worker", "job")

    def __str__(self):
        return f"Thread {self.id}: {self.employer.email} <-> {self.worker.email}"


class ChatMessage(models.Model):
    thread = models.ForeignKey(
        ChatThread,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_messages_sent",
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Thread {self.thread_id} message by {self.sender.email}"


class CallSession(models.Model):
    STATUS_CHOICES = (
        ("requested", "Requested"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("ended", "Ended"),
    )

    thread = models.ForeignKey(
        ChatThread,
        on_delete=models.CASCADE,
        related_name="call_sessions",
    )
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="calls_requested",
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="calls_received",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="requested")
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    notes = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Call {self.id} ({self.status})"
