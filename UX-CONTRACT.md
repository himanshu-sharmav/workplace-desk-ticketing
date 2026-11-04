# Workplace Desk interaction contract

Business sources: the two supplied assignment PDFs; implementation rules and explicit assumptions are documented in README.md. `backend/tickets/services.py` enforces ticket transitions; the UI consumes `allowed_actions` from the API.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Select/Listbox | SelectField (MUI TextField select) and Autocomplete | DESIGN.md | authored | Browser user/status/technician/issue flows |
| Form | MUI TextField and feature form components | This contract | create, comment, assign, resolve | API tests and browser validation |
| Scrollbar | theme.ts MuiCssBaseline | DESIGN.md | global | Browser computed style |
| Toast | App Snackbar and Alert | This contract | success | Browser action feedback |
| CRUD | TicketList, CreateTicketDialog, TicketDetailPage | README.md and this contract | create to detail, update in place | Full create/assign/resolve browser journey |


The create-to-detail exception follows the supplied wireframe: a newly created ticket immediately offers its description, activity, and resolution action. No delete, reopen, reassignment, or bulk operation is in scope.

Search, tab, status, sort, and page live in URL parameters. Search waits 300ms and supports composition. Requests cancel on changed query/user and cannot overwrite newer results. Filter changes reset the page. Loading, no-result, empty, and error states remain inside the list frame. Users switch explicitly through the demo selector; switching resets the route. Create and comment drafts remain in tab memory, scoped to their demo user and ticket, and clear after successful submission or tab reload.

Clients see their client's tickets; managers see their department; technicians see only assigned tickets. Controls reflect server permissions. Comments remain available after resolution. Actions use an expandable panel; resolving requires a non-empty comment and explicit Resolve ticket submission. No browser-native dialogs.

English UI, en-IN dates, Asia/Kolkata timezone. Labels carry status meaning without color. MUI dialogs trap/restore focus; keyboard and phone widths are part of the browser verification. On mobile, the header scrolls naturally to preserve form space. Demo identity is deliberately selectable and is not authentication.
