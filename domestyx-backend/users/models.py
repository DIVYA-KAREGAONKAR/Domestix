# users/models.py
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.conf import settings
class EmployerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employer_profile')
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    company_name = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.user.email} Employer Profile"

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        # ✅ ensure role is set only once
        if 'role' not in extra_fields:
            extra_fields['role'] = 'employer'

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('worker', 'Worker'),
        ('employer', 'Employer'),
    )

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='worker')

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']

    objects = CustomUserManager()

    def __str__(self):
        return self.email

from django.conf import settings

class WorkerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='worker_profile')
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=50, blank=True)
    state = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=50, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    bio = models.TextField(blank=True)
    hourly_rate = models.DecimalField(max_digits=7, decimal_places=2, blank=True, null=True)
    experience = models.CharField(max_length=20, blank=True)
    services = models.JSONField(default=list, blank=True)
    availability = models.JSONField(default=list, blank=True)
    languages = models.JSONField(default=list, blank=True)
    has_transportation = models.BooleanField(default=False)
    has_references = models.BooleanField(default=False)
    is_background_checked = models.BooleanField(default=False)
    profile_image = models.ImageField(upload_to='worker_profiles/', blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} Profile"


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'worker':
            WorkerProfile.objects.create(user=instance)
        elif instance.role == 'employer':
            EmployerProfile.objects.create(user=instance)

@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    if instance.role == 'worker' and hasattr(instance, 'worker_profile'):
        instance.worker_profile.save()
    elif instance.role == 'employer' and hasattr(instance, 'employer_profile'):
        instance.employer_profile.save()