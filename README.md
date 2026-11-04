# Workplace Desk

A small workplace ticketing app built with **React, Material UI, Django REST Framework, and SQLite**. Clients report issues, department managers assign technicians, and clients or assigned technicians resolve tickets. Every change appears in the ticket's activity history.

## Run locally

Prerequisites: **Python 3.12+**, **Node.js 20.19+ or 22.12+**, and npm. Tested versions and actual verification results are in [docs/VERIFICATION.md](docs/VERIFICATION.md).

From this directory:

```sh
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
backend/.venv/bin/python backend/manage.py migrate
backend/.venv/bin/python backend/manage.py seed_demo
npm --prefix frontend ci
```

Start the API in one terminal:

```sh
backend/.venv/bin/python backend/manage.py runserver 127.0.0.1:8008
```

Start the frontend in another:

```sh
npm --prefix frontend run dev
```

Open **http://127.0.0.1:5178**. Vite proxies `/api` to Django on port 8008, so a separate CORS dependency is unnecessary. Both services bind to loopback. SQLite data persists at `backend/db.sqlite3`; it is excluded from source delivery.

## Try the complete flow

1. Select **Chaitanya M — Client POC** in the demo-user selector.
2. Create a ticket using **AC not cooling**. Add an optional description. The new ticket opens with two activity entries and its department manager assigned.
3. Switch to **Dhananjaya Murthy — Department manager**. Find the ticket, choose **Assign technician**, select **Prakash Kumar**, and confirm.
4. Switch to **Prakash Kumar — Technician**. Open the ticket, post an update, then choose **Mark resolved** and supply a resolution comment.
5. Switch back to the client. The ticket is in **Resolved tickets**, with the assignment, comment, and resolution preserved.

Use search, status, sort, and pagination in each role. The 42 seeded tickets span two clients, two departments, all three statuses, and several pages. Re-running `seed_demo` leaves existing data untouched. To start fresh, stop Django and remove only this project's `backend/db.sqlite3`, then run migrations and seeding again.

## Verification commands

```sh
backend/.venv/bin/python backend/manage.py test tickets
backend/.venv/bin/python backend/manage.py check
backend/.venv/bin/python backend/manage.py makemigrations --check --dry-run
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix frontend run format:check
npm --prefix frontend run build
```

Optional Python lint/format checks:

```sh
backend/.venv/bin/python -m pip install -r backend/requirements-dev.txt
backend/.venv/bin/ruff check backend
backend/.venv/bin/ruff format --check backend
```

The backend tests cover creation/routing, the full assignment and resolution flow, validation, role restrictions, visibility, pagination/search/filter/sort, duplicate transitions, post-resolution comments, unknown-issue routing, invalid demo identities, and repeatable seeding. The browser audit is recorded separately; a successful API test is not treated as proof that the UI works.

## API

All endpoints return JSON. Ticket endpoints require `X-Demo-User: <seeded user id>`. The public user and issue endpoints populate the demo selector and issue suggestions.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/users/` | Seeded people and their roles, departments, clients |
| GET | `/api/issues/` | Issue suggestions and routing departments |
| GET | `/api/tickets/` | Scoped, filtered, paginated tickets |
| POST | `/api/tickets/` | Create: `{"issue":"AC not cooling","description":"Room 3"}` |
| GET | `/api/tickets/{id}/` | Ticket, allowed actions, and activity history |
| POST | `/api/tickets/{id}/assign/` | Assign: `{"technician_id":5}` |
| POST | `/api/tickets/{id}/resolve/` | Resolve: `{"comment":"Replaced the filter and checked cooling."}` |
| POST | `/api/tickets/{id}/comments/` | Comment: `{"comment":"I am checking the unit."}` |

Listing query parameters:

- `tab=open` or `resolved` (default `open`).
- `status=pending_assignment`, `pending_resolution`, or `resolved`.
- `search=AC` searches issue text, case-insensitively for the English demo dataset.
- `ordering=-created_at` (newest first) or `created_at` (older first).
- `page=1` (six tickets per page). Pages beyond the last page clamp to the last page; malformed/nonpositive pages return 400.

The response includes `count`, `page`, `page_size`, `total_pages`, `counts` for both tabs, and `results`. Sorting includes the ID as a tie-breaker. Tab counts describe all tickets visible to the selected user, before search/status filtering.

Example:

```sh
curl -H 'X-Demo-User: 1' 'http://127.0.0.1:8008/api/tickets/?tab=open&search=AC&page=1'
```

Creation/comments return **201**; reads and transitions return **200**. Invalid input returns **400**, a disallowed action **403**, an invisible/nonexistent ticket **404**, and an already-applied assignment/resolution **409**. The API derives client, department, manager, creator, status, and timestamps; callers cannot choose them in a creation payload.

## Structure and data model

```text
backend/
  config/                  Django configuration and URL routing
  tickets/
    models.py              Relational entities and database constraints
    serializers.py         REST representations and input validation
    services.py            Visibility, permissions, transactional transitions
    views.py               HTTP orchestration and listing queries
    management/commands/   Repeatable demo seeding
    tests.py               API integration tests
frontend/src/
  api.ts                   HTTP requests, timeouts, API errors
  useResource.ts           Cancelable reads and stale-response protection
  components/              Cards, forms, status, activity, feedback
  pages/                   Ticket listing and detail routes
  theme.ts                 Shared MUI theme and CSS palette
  styles.css               Responsive layout and component styling
```

A **Client** has demo client users and tickets. A **Department** has one manager, technicians, and issue types. Each **Ticket** belongs to a client and department, records its creator and manager, and optionally has one technician. **Activity** belongs to a ticket and records the actor, event type, before/after values, comment, and time. The system routing entry has no human actor.

The lifecycle is `pending_assignment → pending_resolution → resolved`; clients may also resolve directly from `pending_assignment`. Assignment and resolution execute inside database transactions, including their activity insert. SQLite uses `IMMEDIATE` transactions to serialize writes; `select_for_update` alone would not lock rows on SQLite. Status is rechecked inside the transaction. A stale repeat returns 409 without duplicating history. Database constraints keep status, technician, and resolution time consistent.

The frontend waits for successful API responses before updating ticket state. List state is stored in the URL; Back to tickets restores it. Search is debounced, and superseded reads are aborted. MUI supplies the core controls and keyboard behavior rather than custom combobox/dialog implementations.

## Assumptions

- The wireframe is a functional/structural reference, not a pixel-perfect design. The app preserves its cards, role-specific actions, expandable forms, activity filters, and comment composer.
- Demo identity is intentionally selected in the browser. **This is not authentication** and must not be exposed as a production authorization scheme. It is the explicitly permitted assignment demo mode.
- Client users see all tickets for their client; managers see their department; technicians see only tickets assigned to them. The API enforces these scopes even when a ticket ID is entered directly.
- Known issue titles route to the configured department; an unmatched issue routes to Facilities. Each department has one manager and a ticket has at most one technician. The manager remains a current assignee after technician assignment, as shown in the wireframe.
- Clients and assigned technicians can resolve tickets. Managers can assign but cannot resolve. A resolution comment is required for either resolving role.
- Resolved tickets retain their assignees and allow comments, but have no further state-changing action. Reopening, reassignment, deletion, attachments, email notifications, and account management are outside the supplied flow.
- Comments filtering includes resolution comments. The All tab is selected by default; Actions hides standalone comments.
- Dates are stored in UTC and shown in Asia/Kolkata, using en-IN formatting. Sample names and workspace data are demonstration fixtures.
- On phones, the title/action block scrolls normally so it cannot obscure the screen; the comment composer remains sticky. On desktop, both title/actions and the composer are sticky.

## Limitations and next steps

This is a bounded local assignment, not a hosted service. With more time, I would replace the demo identity with real authentication, add polling or live updates, paginate very long activity histories, and add automated browser regression tests. SQLite is appropriate here; production concurrency would call for PostgreSQL and operational monitoring. General create/comment requests do not have durable idempotency keys, so after a network timeout the user should refresh before retrying to check whether the request completed. State transitions do guard against duplicates.

A new random signing key is used at process startup unless `DJANGO_SECRET_KEY` is supplied. There are no login sessions or signed data in this demo. Production would require a persistent environment secret and deployment-specific settings. No credentials or dependencies belong in the submitted archive.

## AI assistance and time

I built this assignment with help from OpenAI Codex. I decided how to present the ticket flow, directed the UI refinements, and reviewed the running app and final walkthrough. Codex helped me turn the wireframe into Django and React code, prepare sample data and tests, revise the interface, write documentation, and run automated and browser checks. I am responsible for the submitted result and can explain the API, data model, React flow, and tradeoffs in a follow-up discussion.

I spent approximately **5 hours** on the assignment, including implementation, reviewing the app, UI refinements, testing, documentation, and the walkthrough. The checks I ran and observed are recorded in [docs/VERIFICATION.md](docs/VERIFICATION.md).

## Visual polish

The final pass improves text sizing, navigation contrast, mobile ownership visibility, notification placement, and consistent action labels. Create and comment drafts survive dismissal/navigation within the current tab and are isolated by demo user; a reload clears them. Fonts are locally bundled and no additional UI library is needed. Design rationale and research links are in [DESIGN.md](DESIGN.md).

## Submission

I am sharing the source in this repository for review. I included screenshots in `docs/screenshots/` and a short, captioned walkthrough of the client → manager → technician → resolved flow in `docs/walkthrough.mp4`; the caption text is in `docs/walkthrough.vtt`. The recording shows the live local app with synthetic data. I used browser automation and FFmpeg to prepare it.
