from django.core.paginator import Paginator
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class TicketPagination(PageNumberPagination):
    page_size = 6

    def paginate_queryset(self, queryset, request, view=None):
        value = request.query_params.get("page", "1")
        if not value.isdigit() or len(value) > 8 or int(value) < 1:
            raise ValidationError({"page": "Use a positive page number."})
        self.page = Paginator(queryset, self.page_size).get_page(value)
        return list(self.page)

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.page.paginator.count,
                "page": self.page.number,
                "page_size": self.page_size,
                "total_pages": self.page.paginator.num_pages,
                "results": data,
            }
        )
