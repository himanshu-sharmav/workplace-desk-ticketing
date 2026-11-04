from rest_framework import serializers

from .models import Activity, Client, DemoUser, Department, IssueType, Ticket
from .services import allowed_actions


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ["id", "name", "location"]


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name"]


class UserSerializer(serializers.ModelSerializer):
    role_label = serializers.CharField(source="get_role_display")
    client = ClientSerializer()
    department = DepartmentSerializer()

    class Meta:
        model = DemoUser
        fields = ["id", "name", "role", "role_label", "client", "department"]


class IssueSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer()

    class Meta:
        model = IssueType
        fields = ["id", "title", "department"]


class ActivitySerializer(serializers.ModelSerializer):
    actor = UserSerializer()

    class Meta:
        model = Activity
        fields = ["id", "actor", "kind", "body", "from_value", "to_value", "created_at"]


class TicketSerializer(serializers.ModelSerializer):
    client = ClientSerializer()
    department = DepartmentSerializer()
    created_by = UserSerializer()
    manager = UserSerializer()
    technician = UserSerializer()
    status_label = serializers.CharField(source="get_status_display")
    allowed_actions = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id",
            "reference",
            "issue",
            "description",
            "client",
            "department",
            "created_by",
            "manager",
            "technician",
            "status",
            "status_label",
            "created_at",
            "resolved_at",
            "allowed_actions",
        ]

    def get_allowed_actions(self, ticket):
        return allowed_actions(ticket, self.context["user"])


class TicketDetailSerializer(TicketSerializer):
    activities = ActivitySerializer(many=True)

    class Meta(TicketSerializer.Meta):
        fields = TicketSerializer.Meta.fields + ["activities"]


class CreateTicketSerializer(serializers.Serializer):
    issue = serializers.CharField(min_length=3, max_length=160)
    description = serializers.CharField(
        max_length=4000, required=False, allow_blank=True, default=""
    )


class AssignTicketSerializer(serializers.Serializer):
    technician_id = serializers.PrimaryKeyRelatedField(queryset=DemoUser.objects.all())


class CommentSerializer(serializers.Serializer):
    comment = serializers.CharField(max_length=2000, allow_blank=False)


class TicketQuerySerializer(serializers.Serializer):
    tab = serializers.ChoiceField(choices=["open", "resolved"], default="open")
    status = serializers.ChoiceField(
        choices=["", *Ticket.Status.values], required=False, default=""
    )
    search = serializers.CharField(max_length=160, required=False, allow_blank=True, default="")
    ordering = serializers.ChoiceField(choices=["created_at", "-created_at"], default="-created_at")
