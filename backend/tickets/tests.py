from django.core.management import call_command
from rest_framework.test import APITestCase

from .models import Activity, DemoUser, Ticket


class TicketAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo", verbosity=0)
        cls.client_user = DemoUser.objects.get(name="Chaitanya M")
        cls.other_client = DemoUser.objects.get(name="Aditi Rao")
        cls.manager = DemoUser.objects.get(name="Dhananjaya Murthy")
        cls.technician = DemoUser.objects.get(name="Prakash Kumar")
        cls.other_technician = DemoUser.objects.get(name="Ravi S")

    def as_user(self, user):
        self.client.credentials(HTTP_X_DEMO_USER=str(user.id))

    def create_ticket(self):
        self.as_user(self.client_user)
        response = self.client.post(
            "/api/tickets/", {"issue": "AC not cooling", "description": "Room 3"}
        )
        self.assertEqual(response.status_code, 201)
        return response.data["id"]

    def test_create_routes_to_manager_with_two_activities(self):
        ticket_id = self.create_ticket()
        ticket = Ticket.objects.get(pk=ticket_id)
        self.assertEqual(ticket.manager, self.manager)
        self.assertEqual(ticket.client, self.client_user.client)
        self.assertEqual(ticket.status, "pending_assignment")
        self.assertEqual(
            list(ticket.activities.values_list("kind", flat=True)),
            ["created", "routed"],
        )

    def test_end_to_end_assign_comment_resolve(self):
        ticket_id = self.create_ticket()
        self.as_user(self.manager)
        assigned = self.client.post(
            f"/api/tickets/{ticket_id}/assign/", {"technician_id": self.technician.id}
        )
        self.assertEqual(assigned.status_code, 200)
        self.assertEqual(assigned.data["status"], "pending_resolution")
        self.as_user(self.technician)
        self.assertEqual(self.client.get(f"/api/tickets/{ticket_id}/").status_code, 200)
        posted = self.client.post(
            f"/api/tickets/{ticket_id}/comments/",
            {"comment": "Checking the compressor."},
        )
        self.assertEqual(posted.status_code, 201)
        resolved = self.client.post(
            f"/api/tickets/{ticket_id}/resolve/",
            {"comment": "Replaced the filter and tested cooling."},
        )
        self.assertEqual(resolved.status_code, 200)
        self.assertEqual(resolved.data["status"], "resolved")
        self.assertIsNotNone(resolved.data["resolved_at"])
        self.assertFalse(resolved.data["allowed_actions"]["resolve"])
        self.assertEqual(len(resolved.data["activities"]), 5)
        self.as_user(self.client_user)
        self.assertEqual(self.client.get(f"/api/tickets/{ticket_id}/").data["status"], "resolved")

    def test_blank_issue_and_resolution_are_rejected(self):
        self.as_user(self.client_user)
        self.assertEqual(self.client.post("/api/tickets/", {"issue": "  "}).status_code, 400)
        ticket_id = self.create_ticket()
        response = self.client.post(f"/api/tickets/{ticket_id}/resolve/", {"comment": "  "})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Ticket.objects.get(pk=ticket_id).status, "pending_assignment")

    def test_cross_department_assignment_is_rejected_without_activity(self):
        ticket_id = self.create_ticket()
        self.as_user(self.manager)
        response = self.client.post(
            f"/api/tickets/{ticket_id}/assign/",
            {"technician_id": self.other_technician.id},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Activity.objects.filter(ticket_id=ticket_id).count(), 2)

    def test_clients_cannot_assign_and_managers_cannot_resolve(self):
        ticket_id = self.create_ticket()
        response = self.client.post(
            f"/api/tickets/{ticket_id}/assign/", {"technician_id": self.technician.id}
        )
        self.assertEqual(response.status_code, 403)
        self.as_user(self.manager)
        response = self.client.post(f"/api/tickets/{ticket_id}/resolve/", {"comment": "Fixed"})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            self.client.post("/api/tickets/", {"issue": "AC not cooling"}).status_code,
            403,
        )

    def test_visibility_prevents_other_clients_and_unassigned_technicians(self):
        ticket_id = self.create_ticket()
        for user in [self.other_client, self.technician]:
            self.as_user(user)
            self.assertEqual(self.client.get(f"/api/tickets/{ticket_id}/").status_code, 404)
            self.assertEqual(
                self.client.post(
                    f"/api/tickets/{ticket_id}/comments/", {"comment": "hello"}
                ).status_code,
                404,
            )

    def test_pagination_filter_search_and_sort_are_server_side(self):
        self.as_user(self.client_user)
        first = self.client.get("/api/tickets/").data
        second = self.client.get("/api/tickets/?page=2").data
        self.assertGreater(first["count"], 6)
        self.assertEqual(len(first["results"]), 6)
        self.assertTrue(
            {x["id"] for x in first["results"]}.isdisjoint(x["id"] for x in second["results"])
        )
        response = self.client.get(
            "/api/tickets/?search=AC&status=pending_resolution&ordering=created_at"
        ).data
        self.assertTrue(response["results"])
        self.assertTrue(
            all(
                "ac" in t["issue"].lower() and t["status"] == "pending_resolution"
                for t in response["results"]
            )
        )
        dates = [t["created_at"] for t in response["results"]]
        self.assertEqual(dates, sorted(dates))
        self.assertEqual(self.client.get("/api/tickets/?search=nonexistent").data["count"], 0)
        self.assertEqual(self.client.get("/api/tickets/?ordering=issue").status_code, 400)

    def test_repeated_transitions_return_conflict_without_duplicate_history(self):
        ticket_id = self.create_ticket()
        self.as_user(self.manager)
        url = f"/api/tickets/{ticket_id}/assign/"
        self.assertEqual(
            self.client.post(url, {"technician_id": self.technician.id}).status_code,
            200,
        )
        self.assertEqual(
            self.client.post(url, {"technician_id": self.technician.id}).status_code,
            409,
        )
        self.as_user(self.technician)
        url = f"/api/tickets/{ticket_id}/resolve/"
        self.assertEqual(self.client.post(url, {"comment": "Fixed"}).status_code, 200)
        self.assertEqual(self.client.post(url, {"comment": "Fixed"}).status_code, 409)
        self.assertEqual(Activity.objects.filter(ticket_id=ticket_id).count(), 4)

    def test_client_can_resolve_before_assignment_and_comment_after_resolution(self):
        ticket_id = self.create_ticket()
        self.assertEqual(
            self.client.post(
                f"/api/tickets/{ticket_id}/resolve/",
                {"comment": "It is working again."},
            ).status_code,
            200,
        )
        self.assertEqual(
            self.client.post(
                f"/api/tickets/{ticket_id}/comments/", {"comment": "Thank you."}
            ).status_code,
            201,
        )

    def test_unknown_issue_routes_to_facilities(self):
        self.as_user(self.client_user)
        response = self.client.post("/api/tickets/", {"issue": "Broken chair"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["department"]["name"], "Facilities")

    def test_missing_or_invalid_demo_user_is_rejected(self):
        self.assertEqual(self.client.get("/api/tickets/").status_code, 400)
        self.client.credentials(HTTP_X_DEMO_USER="not-an-id")
        self.assertEqual(self.client.get("/api/tickets/").status_code, 400)

    def test_seed_is_repeatable_and_non_destructive(self):
        before = Ticket.objects.count()
        call_command("seed_demo", verbosity=0)
        self.assertEqual(Ticket.objects.count(), before)
