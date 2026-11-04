from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError

from .models import Activity, DemoUser, Department, IssueType, Ticket


class Conflict(APIException):
    status_code = 409
    default_detail = "This ticket has changed. Refresh it before trying again."


def visible_tickets(user):
    tickets = Ticket.objects.select_related(
        "client",
        "department",
        "created_by__client",
        "created_by__department",
        "manager__client",
        "manager__department",
        "technician__client",
        "technician__department",
    )
    if user.role == DemoUser.Role.CLIENT:
        return tickets.filter(client_id=user.client_id)
    if user.role == DemoUser.Role.MANAGER:
        return tickets.filter(department_id=user.department_id)
    return tickets.filter(technician=user)


def allowed_actions(ticket, user):
    is_open = ticket.status != Ticket.Status.RESOLVED
    return {
        "assign": ticket.status == Ticket.Status.PENDING_ASSIGNMENT
        and ticket.manager_id == user.id,
        "resolve": is_open
        and (
            user.role == DemoUser.Role.CLIENT
            and user.client_id == ticket.client_id
            or ticket.technician_id == user.id
        ),
    }


@transaction.atomic
def create_ticket(user, issue, description=""):
    if user.role != DemoUser.Role.CLIENT:
        raise PermissionDenied("Only a client can create a ticket.")
    issue_type = IssueType.objects.filter(title__iexact=issue).first()
    department = (
        issue_type.department
        if issue_type
        else Department.objects.filter(name="Facilities").first()
    )
    manager = DemoUser.objects.filter(role=DemoUser.Role.MANAGER, department=department).first()
    if not department or not manager:
        raise ValidationError(
            {"issue": "No manager is available for this issue. Contact your workspace team."}
        )
    ticket = Ticket.objects.create(
        issue=issue,
        description=description,
        client=user.client,
        department=department,
        created_by=user,
        manager=manager,
    )
    Activity.objects.create(ticket=ticket, actor=user, kind=Activity.Kind.CREATED)
    Activity.objects.create(
        ticket=ticket,
        kind=Activity.Kind.ROUTED,
        from_value="Unassigned",
        to_value=manager.name,
    )
    return ticket


@transaction.atomic
def assign_ticket(ticket_id, user, technician):
    ticket = Ticket.objects.select_for_update().get(pk=ticket_id)
    if user.role != DemoUser.Role.MANAGER or ticket.manager_id != user.id:
        raise PermissionDenied("Only this ticket's department manager can assign a technician.")
    if ticket.status != Ticket.Status.PENDING_ASSIGNMENT:
        raise Conflict(
            "Only tickets awaiting assignment can be assigned. Refresh to see the latest status."
        )
    if (
        technician.role != DemoUser.Role.TECHNICIAN
        or technician.department_id != ticket.department_id
    ):
        raise ValidationError(
            {"technician_id": "Choose a technician from the ticket's department."}
        )
    ticket.technician = technician
    ticket.status = Ticket.Status.PENDING_RESOLUTION
    ticket.save(update_fields=["technician", "status"])
    Activity.objects.create(
        ticket=ticket,
        actor=user,
        kind=Activity.Kind.ASSIGNED,
        from_value="Unassigned",
        to_value=technician.name,
    )
    return ticket


@transaction.atomic
def resolve_ticket(ticket_id, user, comment):
    ticket = Ticket.objects.select_for_update().get(pk=ticket_id)
    if ticket.status == Ticket.Status.RESOLVED:
        raise Conflict("This ticket is already resolved. Refresh to see the latest activity.")
    if not allowed_actions(ticket, user)["resolve"]:
        raise PermissionDenied("Only the client or assigned technician can resolve this ticket.")
    previous = ticket.get_status_display()
    ticket.status = Ticket.Status.RESOLVED
    ticket.resolved_at = timezone.now()
    ticket.save(update_fields=["status", "resolved_at"])
    Activity.objects.create(
        ticket=ticket,
        actor=user,
        kind=Activity.Kind.RESOLVED,
        body=comment,
        from_value=previous,
        to_value="Resolved",
    )
    return ticket
