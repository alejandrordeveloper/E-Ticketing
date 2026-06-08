import os

from django.core.management.base import BaseCommand

from users.models import User


class Command(BaseCommand):
    help = 'Create or update the demo admin account used by the Backstage flow.'

    def handle(self, *args, **options):
        email = os.getenv('BACKSTAGE_ADMIN_EMAIL', 'admin@eticket.com').strip().lower()
        password = os.getenv('BACKSTAGE_ADMIN_PASSWORD', 'admin123')
        username = os.getenv('BACKSTAGE_ADMIN_USERNAME', 'backstage-admin').strip() or 'backstage-admin'

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'is_staff': True,
            },
        )

        user.username = username
        user.is_staff = True
        user.set_password(password)
        user.save(update_fields=['username', 'is_staff', 'password'])

        action = 'Created' if created else 'Updated'
        self.stdout.write(self.style.SUCCESS(f'{action} demo admin account: {email}'))