from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from apps.accounts.models import UserSession


class Command(BaseCommand):
    help = "Purges user sessions that have been revoked or expired for over 30 days."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=30,
            help="Number of days a session must have been revoked/expired before deletion (default: 30).",
        )

    def handle(self, *args, **options):
        days = options["days"]
        cutoff = timezone.now() - timedelta(days=days)

        deleted_count, _ = UserSession.objects.filter(
            Q(revoked_at__lt=cutoff) | Q(expires_at__lt=cutoff) | Q(absolute_expires_at__lt=cutoff)
        ).delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully purged {deleted_count} expired/revoked sessions older than {days} days."
            )
        )
