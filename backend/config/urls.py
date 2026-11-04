from django.urls import include, path
from rest_framework.routers import DefaultRouter
from tickets.views import IssueViewSet, TicketViewSet, UserViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("issues", IssueViewSet, basename="issue")
router.register("tickets", TicketViewSet, basename="ticket")
urlpatterns = [path("api/", include(router.urls))]
