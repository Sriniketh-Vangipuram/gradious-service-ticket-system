# Gradious Service Ticket System — Comments Payload Contract

## 1. Purpose

This document is the frontend/backend contract for ticket comments.

The Comments module supports:

* Public comments between employees and authorized staff
* Internal staff-only comments
* Ticket comment history
* Automatic ticket resumption when an employee publicly replies to a `WAITING_FOR_USER` ticket
* Real-time comment events through Socket.IO

The backend is the source of truth for authorization and visibility.

---

# 2. Base Route

```text
/api/v1/tickets/:ticketId/comments
```

Authentication is required for every endpoint.

The frontend must send requests with credentials:

```ts
credentials: "include"
```

Authentication cookies are HTTP-only and must not be read or stored by frontend JavaScript.

---

# 3. Comment Visibility

```ts
export type CommentVisibility = "PUBLIC" | "INTERNAL";
```

### PUBLIC

Visible to:

* Ticket requester
* Assigned technician
* Authorized center manager
* Admin

### INTERNAL

Visible only to authorized staff:

* Assigned technician
* Authorized center manager
* Admin

Employees can:

* Read `PUBLIC` comments
* Create `PUBLIC` comments

Employees cannot:

* Read `INTERNAL` comments
* Create `INTERNAL` comments

The backend enforces this restriction regardless of frontend behavior.

---

# 4. Comment Author

Every returned comment contains:

```ts
export type UserRole =
  | "EMPLOYEE"
  | "TECHNICIAN"
  | "CENTER_MANAGER"
  | "ADMIN";

export interface CommentAuthor {
  id: number;
  fullName: string;
  role: UserRole;
}
```

---

# 5. Comment Object

The canonical comment response shape is:

```ts
export interface TicketComment {
  id: number;
  content: string;
  visibility: CommentVisibility;

  ticketId: number;
  authorId: number;

  author: CommentAuthor;

  createdAt: string;
  updatedAt: string;
}
```

Dates are serialized by the API as ISO date strings.

---

# 6. POST — Create Ticket Comment

```http
POST /api/v1/tickets/:ticketId/comments
```

Authentication:

```text
Required
```

## Path Parameters

```ts
interface TicketCommentParams {
  ticketId: number;
}
```

The backend accepts the route parameter as a positive integer.

Example:

```http
POST /api/v1/tickets/42/comments
```

---

# 7. Create Comment Request

```ts
export interface CreateTicketCommentRequest {
  content: string;
  visibility?: CommentVisibility;
}
```

Validation:

```text
content:
  trim
  minimum length: 1
  maximum length: 5000

visibility:
  PUBLIC | INTERNAL
  defaults to PUBLIC
```

Example public comment:

```json
{
  "content": "I have completed the requested software update.",
  "visibility": "PUBLIC"
}
```

Example internal comment:

```json
{
  "content": "Verified the installation package and license availability.",
  "visibility": "INTERNAL"
}
```

The frontend should explicitly send `visibility` when the user is intentionally creating an internal note.

---

# 8. Create Comment Response

HTTP status:

```text
201 Created
```

Response:

```json
{
  "comment": {
    "id": 101,
    "content": "I have completed the requested software update.",
    "visibility": "PUBLIC",
    "ticketId": 42,
    "authorId": 17,
    "author": {
      "id": 17,
      "fullName": "John Doe",
      "role": "EMPLOYEE"
    },
    "createdAt": "2026-09-22T04:10:00.000Z",
    "updatedAt": "2026-09-22T04:10:00.000Z"
  }
}
```

Frontend type:

```ts
export interface CreateTicketCommentResponse {
  comment: TicketComment;
}
```

---

# 9. GET — List Ticket Comments

```http
GET /api/v1/tickets/:ticketId/comments
```

Authentication:

```text
Required
```

No pagination parameters currently exist.

The backend returns comments ordered chronologically:

```text
createdAt ASC
id ASC
```

The secondary `id ASC` ordering provides deterministic ordering when multiple comments have the same timestamp.

---

# 10. List Comments Response

```json
{
  "comments": [
    {
      "id": 101,
      "content": "I have completed the requested software update.",
      "visibility": "PUBLIC",
      "ticketId": 42,
      "authorId": 17,
      "author": {
        "id": 17,
        "fullName": "John Doe",
        "role": "EMPLOYEE"
      },
      "createdAt": "2026-09-22T04:10:00.000Z",
      "updatedAt": "2026-09-22T04:10:00.000Z"
    }
  ]
}
```

Frontend type:

```ts
export interface ListTicketCommentsResponse {
  comments: TicketComment[];
}
```

---

# 11. Visibility Filtering

The backend applies visibility filtering based on the authenticated user's role.

### Employee

```text
PUBLIC only
```

The backend query effectively applies:

```ts
{
  ticketId,
  visibility: "PUBLIC"
}
```

An employee must never receive an `INTERNAL` comment from the API.

### Technician

```text
PUBLIC + INTERNAL
```

provided the technician is the assigned technician for the ticket.

### Center Manager

```text
PUBLIC + INTERNAL
```

provided the manager has access to the ticket's center.

### Admin

```text
PUBLIC + INTERNAL
```

for any ticket.

The frontend must not attempt to implement authorization itself as the security boundary. The backend remains authoritative.

---

# 12. Ticket Access Rules

Comment access is also restricted by ticket ownership/assignment.

### ADMIN

Can access any ticket.

### EMPLOYEE

Can access comments only when:

```text
ticket.requesterId === authenticatedUser.id
```

### TECHNICIAN

Can access comments only when:

```text
ticket.assigneeId === authenticatedUser.id
```

### CENTER_MANAGER

Can access comments when the manager has access to the ticket's center.

### Unauthorized / inaccessible ticket

The backend returns:

```text
404 NOT_FOUND
```

rather than revealing whether an inaccessible ticket exists.

---

# 13. Employee Internal-Comment Protection

An employee attempting:

```json
{
  "content": "Internal note",
  "visibility": "INTERNAL"
}
```

receives:

```text
403 FORBIDDEN
```

with the backend error message:

```text
Employees cannot create internal notes.
```

The frontend should normally prevent this UI action for employees, but the backend restriction remains mandatory.

---

# 14. First Staff Response

A public comment created by a non-employee is considered a qualifying staff response.

When the ticket has:

```text
firstResponseAt = null
```

the backend records the first qualifying public staff comment timestamp.

Later public staff comments do not overwrite the original `firstResponseAt`.

This affects SLA/first-response tracking but does not require the frontend to calculate the timestamp.

---

# 15. Requester Reply and WAITING_FOR_USER

A public comment from the ticket requester can resume a ticket.

This applies when:

```text
actor.role === EMPLOYEE
visibility === PUBLIC
ticket.status === WAITING_FOR_USER
```

The backend changes:

```text
WAITING_FOR_USER
        ↓
IN_PROGRESS
```

The backend also:

1. Finds the active paused SLA cycle.
2. Calculates business time spent paused.
3. Extends the SLA deadline accordingly.
4. Clears the SLA cycle's `pausedAt`.
5. Updates `totalPausedMinutes`.
6. Updates `ticket.resolutionDueAt`.
7. Creates a `STATUS_CHANGED` ticket-history entry.
8. Notifies the assigned technician.

The frontend must not perform these calculations itself.

---

# 16. Requester Reply Notification

When a requester publicly replies to a `WAITING_FOR_USER` ticket and an assigned technician exists, the backend creates a notification for that technician.

Notification type:

```ts
"TICKET_STATUS_CHANGED"
```

Example:

```json
{
  "title": "Employee responded to your query",
  "message": "The requester has replied to ticket TKT-2026-000042. The ticket is now IN_PROGRESS."
}
```

The frontend receives the notification through the normal:

```text
notification:created
```

Socket event.

---

# 17. Socket.IO — ticket:comment_created

When a comment is successfully committed to the database, the backend emits:

```text
ticket:comment_created
```

The event is emitted only after the database transaction succeeds.

Canonical payload:

```ts
export interface TicketCommentCreatedEvent {
  ticketId: number;
  ticketNumber: string;
  centerId: number;

  comment: {
    id: number;
    author: CommentAuthor;
    content: string;
    visibility: CommentVisibility;
    createdAt: string;
  };
}
```

Example:

```json
{
  "ticketId": 42,
  "ticketNumber": "TKT-2026-000042",
  "centerId": 3,
  "comment": {
    "id": 101,
    "author": {
      "id": 17,
      "fullName": "John Doe",
      "role": "EMPLOYEE"
    },
    "content": "I have completed the requested software update.",
    "visibility": "PUBLIC",
    "createdAt": "2026-09-22T04:10:00.000Z"
  }
}
```

---

# 18. Socket.IO Comment Visibility

The backend controls who receives the event.

### PUBLIC comment

Delivered to:

```text
ticket requester
assigned technician
```

according to the current ticket access/recipient logic.

### INTERNAL comment

Delivered to:

```text
assigned technician
```

and never to the requester.

The frontend must therefore never assume that receiving a socket event means the event is globally visible.

---

# 19. Socket.IO — Status Change Caused by Requester Reply

When a requester reply changes:

```text
WAITING_FOR_USER → IN_PROGRESS
```

the backend also emits:

```text
ticket:status_changed
```

Payload:

```ts
export interface TicketStatusChangedEvent {
  ticketId: number;
  centerId: number;
  previousStatus: "WAITING_FOR_USER";
  status: "IN_PROGRESS";
  updatedAt: string;
}
```

Example:

```json
{
  "ticketId": 42,
  "centerId": 3,
  "previousStatus": "WAITING_FOR_USER",
  "status": "IN_PROGRESS",
  "updatedAt": "2026-09-22T04:10:00.000Z"
}
```

The frontend should update its ticket state from this event rather than locally assuming that posting a comment necessarily changes the status.

---

# 20. Socket.IO — Event Processing Rule

The frontend should treat Socket.IO as a real-time state update mechanism.

Recommended flow:

```text
User submits comment
        ↓
POST /comments
        ↓
Backend transaction
        ↓
Comment persisted
        ↓
Transaction committed
        ↓
201 response
        ↓
Socket event delivered
        ↓
Other connected clients update
```

The submitting client may already receive the created comment from the REST response.

Therefore, the frontend should prevent duplicate rendering if the same comment subsequently arrives through Socket.IO.

A common strategy is:

```ts
existingComment.id === incomingComment.id
```

before inserting a real-time comment into local state.

---

# 21. Recommended Frontend Types

```ts
export type CommentVisibility =
  | "PUBLIC"
  | "INTERNAL";

export type UserRole =
  | "EMPLOYEE"
  | "TECHNICIAN"
  | "CENTER_MANAGER"
  | "ADMIN";

export interface CommentAuthor {
  id: number;
  fullName: string;
  role: UserRole;
}

export interface TicketComment {
  id: number;
  content: string;
  visibility: CommentVisibility;
  ticketId: number;
  authorId: number;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketCommentRequest {
  content: string;
  visibility?: CommentVisibility;
}

export interface CreateTicketCommentResponse {
  comment: TicketComment;
}

export interface ListTicketCommentsResponse {
  comments: TicketComment[];
}

export interface TicketCommentCreatedEvent {
  ticketId: number;
  ticketNumber: string;
  centerId: number;
  comment: {
    id: number;
    author: CommentAuthor;
    content: string;
    visibility: CommentVisibility;
    createdAt: string;
  };
}

export interface TicketStatusChangedEvent {
  ticketId: number;
  centerId: number;
  previousStatus: string;
  status: string;
  updatedAt: string;
}
```

---

# 22. API Error Behavior

The frontend should handle the standard backend error envelope.

Potential errors include:

```text
401 UNAUTHENTICATED
403 FORBIDDEN
404 NOT_FOUND
409 CONFLICT
422 VALIDATION_ERROR
```

Examples:

### Unauthenticated

```text
Authentication required.
```

### Inaccessible ticket

```text
Ticket not found.
```

### Employee internal note

```text
Employees cannot create internal notes.
```

### Concurrent status change

```text
Ticket status changed before the reply could resume it. Please refresh and try again.
```

### SLA concurrency conflict

```text
The SLA cycle changed before it could be resumed. Refresh and try again.
```

The frontend should display backend-provided user-safe messages where appropriate rather than duplicating business rules.

---

# 23. Frontend API Functions

Recommended service contract:

```ts
getTicketComments(ticketId: number)
createTicketComment(
  ticketId: number,
  payload: CreateTicketCommentRequest
)
```

Conceptually:

```ts
GET /api/v1/tickets/:ticketId/comments
```

and:

```ts
POST /api/v1/tickets/:ticketId/comments
```

The service layer should own the HTTP implementation.

React components should not directly construct API URLs.

---

# 24. React State Responsibilities

The frontend should maintain:

```text
comments
loading
submitting
error
```

The frontend should derive UI capabilities from the authenticated user's role.

For example:

```text
EMPLOYEE
  → Public comment
  → No internal comment option

TECHNICIAN
  → Public comment
  → Internal note

CENTER_MANAGER
  → Public comment
  → Internal note

ADMIN
  → Public comment
  → Internal note
```

These UI restrictions are usability rules, not security controls.

---

# 25. Important Architectural Rules

### Rule 1 — Backend owns authorization

Never trust the frontend's role or visibility selection.

### Rule 2 — INTERNAL means staff-only

An employee response must never contain an internal comment.

### Rule 3 — Do not calculate SLA state in React

The backend owns:

* SLA pause duration
* business-calendar calculation
* deadline extension
* SLA cycle state

### Rule 4 — Persist before emitting

The backend follows:

```text
DB transaction
    ↓
commit
    ↓
Socket.IO event
```

### Rule 5 — REST response is authoritative for mutation

After creating a comment, the POST response provides the newly persisted comment.

### Rule 6 — Socket.IO is for synchronization

Socket events allow other connected clients to receive changes without polling.

### Rule 7 — Deduplicate real-time comments

Use the comment ID to prevent the same comment being rendered twice.

---

# 26. Endpoint Summary

| Method | Endpoint                             | Auth     | Purpose                  |
| ------ | ------------------------------------ | -------- | ------------------------ |
| GET    | `/api/v1/tickets/:ticketId/comments` | Required | List authorized comments |
| POST   | `/api/v1/tickets/:ticketId/comments` | Required | Create comment           |

---

# 27. Socket Event Summary

| Event                    | Direction       | Purpose                                       |
| ------------------------ | --------------- | --------------------------------------------- |
| `ticket:comment_created` | Server → Client | New comment                                   |
| `ticket:status_changed`  | Server → Client | Ticket status changed after requester reply   |
| `notification:created`   | Server → Client | Technician notification after requester reply |

---

# 28. Source-of-Truth Principle

This contract reflects the current implementation of:

```text
comment.schemas.ts
comment.controller.ts
comment.routes.ts
create-ticket-comment.use-case.ts
list-ticket-comments.use-case.ts
Prisma Comment model
Socket.IO comment publishing
```

If the backend response shape or authorization behavior changes, this contract must be updated before implementing the corresponding frontend behavior.
