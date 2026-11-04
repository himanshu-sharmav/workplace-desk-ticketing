from django.db import models
from django.db.models import Q


class Client(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)


class DemoUser(models.Model):
    class Role(models.TextChoices):
        CLIENT = "client", "Client POC"
        MANAGER = "manager", "Department manager"
        TECHNICIAN = "technician", "Technician"

    name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=Role.choices)
    client = models.ForeignKey(Client, null=True, blank=True, on_delete=models.PROTECT)
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.PROTECT)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(role="client", client__isnull=False, department__isnull=True)
                    | Q(
                        role__in=["manager", "technician"],
                        client__isnull=True,
                        department__isnull=False,
                    )
                ),
                name="user_role_scope",
            ),
            models.UniqueConstraint(
                fields=["department"],
                condition=Q(role="manager"),
                name="one_manager_per_department",
            ),
        ]


class IssueType(models.Model):
    title = models.CharField(max_length=120, unique=True)
    department = models.ForeignKey(Department, on_delete=models.PROTECT)


class Ticket(models.Model):
    class Status(models.TextChoices):
        PENDING_ASSIGNMENT = "pending_assignment", "Pending Technician Assignment"
        PENDING_RESOLUTION = "pending_resolution", "Pending Resolution"
        RESOLVED = "resolved", "Resolved"

    issue = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    client = models.ForeignKey(Client, on_delete=models.PROTECT)
    department = models.ForeignKey(Department, on_delete=models.PROTECT)
    created_by = models.ForeignKey(
        DemoUser, on_delete=models.PROTECT, related_name="created_tickets"
    )
    manager = models.ForeignKey(DemoUser, on_delete=models.PROTECT, related_name="managed_tickets")
    technician = models.ForeignKey(
        DemoUser,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="assigned_tickets",
    )
    status = models.CharField(
        max_length=30, choices=Status.choices, default=Status.PENDING_ASSIGNMENT
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(status="resolved", resolved_at__isnull=False)
                    | Q(
                        status__in=["pending_assignment", "pending_resolution"],
                        resolved_at__isnull=True,
                    )
                ),
                name="resolution_timestamp_matches_status",
            ),
            models.CheckConstraint(
                condition=(
                    Q(status="pending_assignment", technician__isnull=True)
                    | Q(status="pending_resolution", technician__isnull=False)
                    | Q(status="resolved")
                ),
                name="assignment_matches_status",
            ),
        ]

    @property
    def reference(self):
        return f"TKT-{1000 + self.pk}"


class Activity(models.Model):
    class Kind(models.TextChoices):
        CREATED = "created", "Created"
        ROUTED = "routed", "Auto-assigned"
        ASSIGNED = "assigned", "Technician assigned"
        RESOLVED = "resolved", "Resolved"
        COMMENT = "comment", "Comment"

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="activities")
    actor = models.ForeignKey(DemoUser, null=True, on_delete=models.PROTECT)
    kind = models.CharField(max_length=20, choices=Kind.choices)
    body = models.TextField(blank=True)
    from_value = models.CharField(max_length=160, blank=True)
    to_value = models.CharField(max_length=160, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]
