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
    status = models.CharField(max_length=20, default='active')
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
    status = models.CharField(max_length=20, choices=APPLICATION_STATUS, default='applied')
    applied_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('job', 'worker',) # A worker can only apply once per job
    
    def __str__(self):
        return f'{self.worker.first_name} applied for {self.job.title}'