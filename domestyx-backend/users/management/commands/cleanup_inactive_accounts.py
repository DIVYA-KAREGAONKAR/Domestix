from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Delete deactivated accounts older than retention period (default 365 days)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=365,
            help="Retention window in days before deleting deactivated accounts.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show how many users would be deleted without deleting them.",
        )

    def handle(self, *args, **options):
        days = options["days"]
        dry_run = options["dry_run"]

        cutoff = timezone.now() - timedelta(days=days)
        User = get_user_model()
        queryset = User.objects.filter(is_active=False, deactivated_at__isnull=False, deactivated_at__lt=cutoff)
        count = queryset.count()

        if dry_run:
            self.stdout.write(self.style.WARNING(f"Dry run: {count} deactivated users would be deleted."))
            return

        deleted, _ = queryset.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted} records for deactivated users older than {days} days."))
