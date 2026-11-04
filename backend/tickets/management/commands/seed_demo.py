from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from tickets.models import Activity, Client, DemoUser, Department, IssueType, Ticket
from tickets.services import assign_ticket, create_ticket, resolve_ticket


class Command(BaseCommand):
    help = "Create demo users and 42 sample tickets. Safe to run more than once."

    @transaction.atomic
    def handle(self, *args, **options):
        if DemoUser.objects.exists():
            self.stdout.write("Demo data already exists; left existing records unchanged.")
            return
        harness = Client.objects.create(name="Harness", location="Tower 1317 · Floors 2 & 3")
        acme = Client.objects.create(name="Acme Studio", location="Tower 1317 · Floor 4")
        technical = Department.objects.create(name="Technical")
        facilities = Department.objects.create(name="Facilities")
        client = DemoUser.objects.create(name="Chaitanya M", role="client", client=harness)
        other_client = DemoUser.objects.create(name="Aditi Rao", role="client", client=acme)
        managers = {
            technical.id: DemoUser.objects.create(
                name="Dhananjaya Murthy", role="manager", department=technical
            ),
            facilities.id: DemoUser.objects.create(
                name="Meera Nair", role="manager", department=facilities
            ),
        }
        technicians = {
            technical.id: DemoUser.objects.create(
                name="Prakash Kumar", role="technician", department=technical
            ),
            facilities.id: DemoUser.objects.create(
                name="Ravi S", role="technician", department=facilities
            ),
        }
        DemoUser.objects.create(name="Ananya S", role="technician", department=technical)
        issues = [
            (
                "AC not cooling",
                technical,
                "The air conditioning on floor 3 is running but blowing warm air. Please check the units near the meeting rooms.",
            ),
            (
                "Internet not working",
                technical,
                "The connection keeps dropping in the east wing. Restarting the router has not helped.",
            ),
            (
                "Pantry not cleaned",
                facilities,
                "The pantry on floor 2 needs cleaning after the afternoon break.",
            ),
            (
                "Lights flickering",
                technical,
                "Two ceiling lights above the shared workstations flicker throughout the day.",
            ),
            (
                "Water dispenser leaking",
                facilities,
                "Water is collecting under the dispenser near the breakout area.",
            ),
            (
                "Meeting room display offline",
                technical,
                "The screen in meeting room Cedar does not detect the HDMI input.",
            ),
            (
                "Door access not working",
                technical,
                "The access reader at the west entrance is not responding to our cards.",
            ),
        ]
        for title, department, _ in issues:
            IssueType.objects.create(title=title, department=department)
        now = timezone.now()
        for index in range(42):
            title, department, description = issues[index % len(issues)]
            creator = other_client if index % 7 == 6 else client
            ticket = create_ticket(creator, title, description)
            if index % 4 != 0:
                assign_ticket(ticket.id, managers[department.id], technicians[department.id])
            if index % 4 == 3:
                resolve_ticket(
                    ticket.id,
                    technicians[department.id],
                    "Completed the repair and checked with the client. Everything is working normally.",
                )
            created = now - timedelta(hours=(42 - index) * 3)
            Ticket.objects.filter(pk=ticket.id).update(created_at=created)
            for offset, activity in enumerate(ticket.activities.all()):
                timestamp = created + timedelta(minutes=offset * 20)
                Activity.objects.filter(pk=activity.id).update(created_at=timestamp)
                if activity.kind == Activity.Kind.RESOLVED:
                    Ticket.objects.filter(pk=ticket.id).update(resolved_at=timestamp)
        self.stdout.write(self.style.SUCCESS("Created 7 users, 7 issue types and 42 tickets."))
