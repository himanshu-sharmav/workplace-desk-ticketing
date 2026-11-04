from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from . import services
from .models import Activity, DemoUser, IssueType
from .serializers import (
    AssignTicketSerializer,
    CommentSerializer,
    CreateTicketSerializer,
    IssueSerializer,
    TicketDetailSerializer,
    TicketQuerySerializer,
    TicketSerializer,
    UserSerializer,
)


class UserViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = DemoUser.objects.select_related("client", "department").order_by("id")
    serializer_class = UserSerializer
    pagination_class = None


class IssueViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = IssueType.objects.select_related("department").order_by("id")
    serializer_class = IssueSerializer
    pagination_class = None


class TicketViewSet(viewsets.GenericViewSet):
    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        raw_id = request.headers.get("X-Demo-User", "")
        if not raw_id.isdigit() or len(raw_id) > 10:
            raise ValidationError({"detail": "Select a valid demo user."})
        self.demo_user = get_object_or_404(
            DemoUser.objects.select_related("client", "department"), pk=int(raw_id)
        )

    def get_queryset(self):
        return services.visible_tickets(self.demo_user)

    def serialize(self, ticket, detail=False):
        serializer = TicketDetailSerializer if detail else TicketSerializer
        return serializer(ticket, context={"user": self.demo_user}).data

    def detail_response(self, ticket_id, response_status=status.HTTP_200_OK):
        ticket = (
            self.get_queryset()
            .prefetch_related("activities__actor__client", "activities__actor__department")
            .get(pk=ticket_id)
        )
        return Response(self.serialize(ticket, detail=True), status=response_status)

    def list(self, request):
        query = TicketQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        values = query.validated_data
        queryset = self.get_queryset()
        counts = queryset.aggregate(
            open=Count("id", filter=~Q(status="resolved")),
            resolved=Count("id", filter=Q(status="resolved")),
        )
        queryset = (
            queryset.filter(status="resolved")
            if values["tab"] == "resolved"
            else queryset.exclude(status="resolved")
        )
        if values["status"]:
            queryset = queryset.filter(status=values["status"])
        if values["search"]:
            queryset = queryset.filter(issue__icontains=values["search"])
        ordering = values["ordering"]
        queryset = queryset.order_by(ordering, "-id" if ordering.startswith("-") else "id")
        page = self.paginate_queryset(queryset)
        response = self.get_paginated_response([self.serialize(ticket) for ticket in page])
        response.data["counts"] = counts
        return response

    def retrieve(self, request, pk=None):
        ticket = self.get_object()
        return self.detail_response(ticket.id)

    def create(self, request):
        serializer = CreateTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = services.create_ticket(self.demo_user, **serializer.validated_data)
        return self.detail_response(ticket.id, status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        ticket = self.get_object()
        serializer = AssignTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.assign_ticket(
            ticket.id, self.demo_user, serializer.validated_data["technician_id"]
        )
        return self.detail_response(ticket.id)

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        ticket = self.get_object()
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.resolve_ticket(ticket.id, self.demo_user, serializer.validated_data["comment"])
        return self.detail_response(ticket.id)

    @action(detail=True, methods=["post"])
    def comments(self, request, pk=None):
        ticket = self.get_object()
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Activity.objects.create(
            ticket=ticket,
            actor=self.demo_user,
            kind=Activity.Kind.COMMENT,
            body=serializer.validated_data["comment"],
        )
        return self.detail_response(ticket.id, status.HTTP_201_CREATED)
