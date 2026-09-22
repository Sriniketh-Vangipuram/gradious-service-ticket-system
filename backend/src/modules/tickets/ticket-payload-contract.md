# Tickets Payload Contract

## 1. Purpose

This document is the frontend/backend contract for the **Gradious Service Ticket System — Tickets module**.

The frontend must use this document as the source of truth for:

* Ticket creation
* Ticket listing
* Ticket details
* Ticket updates
* Ticket assignment
* Ticket lifecycle
* Status transitions
* Ticket cancellation
* Ticket resolution
* Ticket closure
* Ticket reopening
* Pagination
* Role-based access
* Ticket-related Socket.IO events
* Ticket-related notifications
* Ticket history behavior

The frontend must not infer authorization rules independently.

The backend remains the final authority for:

* authorization
* ticket visibility
* valid status transitions
* lifecycle permissions
* SLA calculations
* ticket history
* notifications
* concurrency handling

---

# 2. Base Route

All ticket REST endpoints use:

```text
/api/v1/tickets
```

---

# 3. Authentication

All ticket endpoints require authentication.

Authentication is cookie-based.

Frontend requests must use:

```ts
credentials: "include"
```

The frontend must **not**:

* store access tokens in `localStorage`
* store refresh tokens in `localStorage`
* manually read authentication cookies
* construct JWTs
* perform authorization based only on frontend role checks

The backend determines whether the authenticated user may perform the requested operation.

---

# 4. User Roles

```ts
export type UserRole =
  | "EMPLOYEE"
  | "TECHNICIAN"
  | "CENTER_MANAGER"
  | "ADMIN";
```

---

# 5. Ticket Status

```ts
export type TicketStatus =
  | "OPEN"
  | "TRIAGED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";
```

---

# 6. Ticket Priority

```ts
export type TicketPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";
```

Employees cannot create tickets with:

```text
CRITICAL
```

The backend enforces this restriction.

---

# 7. Software Request Type

```ts
export type SoftwareRequestType =
  | "INSTALLATION"
  | "UPDATE"
  | "UNINSTALLATION"
  | "LICENSE";
```

`softwareId` and `requestType` must be supplied together when used.

They cannot be independently supplied.

---

# 8. Ticket Relations

Ticket responses expose the following related objects.

## Requester

```ts
export interface TicketRequester {
  id: number;
  fullName: string;
  email: string;
}
```

## Assignee

```ts
export interface TicketAssignee {
  id: number;
  fullName: string;
  email: string;
}
```

The assignee may be:

```ts
null
```

## Center

```ts
export interface TicketCenter {
  id: number;
  name: string;
  code: string;
}
```

## Lab

```ts
export interface TicketLab {
  id: number;
  name: string;
  code: string;
}
```

## Category

The complete `category` Prisma model is returned.

The frontend should type this against the actual Category API/model contract rather than creating a reduced category object.

## Software

The complete `software` Prisma model is returned.

The value may be:

```ts
null
```

when the ticket is not software-related.

---

# 9. Ticket Object

The ticket endpoints return the Ticket Prisma scalar fields together with:

```ts
export interface Ticket {
  id: number;
  ticketNumber: string;

  title: string;
  description: string;

  status: TicketStatus;
  priority: TicketPriority;

  requestType: SoftwareRequestType | null;

  requesterId: number;
  assigneeId: number | null;

  centerId: number;
  labId: number;
  categoryId: number;
  softwareId: number | null;

  createdAt: string;
  updatedAt: string;

  resolvedAt: string | null;
  closedAt: string | null;

  // SLA snapshot fields returned by the Ticket model
  firstResponseDueAt: string | null;
  resolutionDueAt: string | null;
  firstResponseTargetMinutes: number | null;
  resolutionTargetMinutes: number | null;

  requester: TicketRequester;
  assignee: TicketAssignee | null;
  center: TicketCenter;
  lab: TicketLab;
  category: unknown;
  software: unknown | null;
}
```

> The frontend should update the `category` and `software` types when the corresponding module contracts are finalized.

All DateTime values are serialized as ISO date strings.

---

# 10. Create Ticket

## Endpoint

```http
POST /api/v1/tickets
```

## Headers

A valid idempotency key is required:

```http
Idempotency-Key: <8-128 printable ASCII characters>
```

The frontend must generate a unique key for each logical ticket-creation operation.

Example:

```text
Idempotency-Key: ticket-create-8f6e4f1a-...
```

If the same idempotency key is retried with the same request payload, the backend returns the stored result.

If the same key is reused with a different request payload, the backend returns a conflict.

---

## Request Body

```ts
export interface CreateTicketRequest {
  title: string;
  description: string;

  categoryId: number;

  softwareId?: number;

  centerId: number;
  labId: number;

  priority: TicketPriority;

  requestType?: SoftwareRequestType;
}
```

### Validation

#### `title`

```text
5–200 characters
```

#### `description`

```text
10–10000 characters
```

#### `categoryId`

Positive integer.

#### `centerId`

Positive integer.

#### `labId`

Positive integer.

#### `priority`

Valid TicketPriority.

Employees cannot use:

```text
CRITICAL
```

### Software/request type rule

These fields must either both exist or both be absent:

```ts
softwareId
requestType
```

Invalid:

```json
{
  "softwareId": 5
}
```

Invalid:

```json
{
  "requestType": "INSTALLATION"
}
```

Valid:

```json
{
  "softwareId": 5,
  "requestType": "INSTALLATION"
}
```

---

# 11. Create Ticket Response

The controller returns the idempotency-aware response directly.

The successful response follows:

```json
{
  "success": true,
  "data": {
    "ticket": {}
  }
}
```

The created ticket contains:

```ts
export interface CreateTicketResponse {
  ticket: Ticket;
}
```

The backend also creates the initial ticket history/SLA state and relevant notifications.

---

# 12. Create Ticket Side Effects

Creating a ticket can result in:

### Ticket history

A `CREATED` history event is created.

### Notifications

Notifications may be created for:

* requester
* eligible technicians
* center managers
* admins

### Socket.IO

After the database transaction commits:

```text
ticket:created
```

is emitted.

---

# 13. Socket Event — ticket:created

```ts
export interface TicketCreatedEvent {
  ticketId: number;
  ticketNumber: string;
  centerId: number;
  status: TicketStatus;
  createdAt: string;
}
```

Example:

```json
{
  "ticketId": 42,
  "ticketNumber": "TKT-2026-000042",
  "centerId": 3,
  "status": "OPEN",
  "createdAt": "2026-09-21T10:30:00.000Z"
}
```

The frontend should use this event to trigger a refresh/invalidation of relevant ticket queries rather than attempting to recreate the complete Ticket object from this payload.

---

# 14. List Tickets

## Endpoint

```http
GET /api/v1/tickets
```

---

## Query Parameters

```ts
export interface ListTicketsQuery {
  cursor?: string;
  limit?: number;

  status?: TicketStatus;
  priority?: TicketPriority;

  categoryId?: number;
  centerId?: number;
  labId?: number;

  search?: string;

  sort?: "newest" | "oldest";
}
```

---

# 15. List Query Validation

### `limit`

```text
1–100
```

Default:

```text
20
```

### `search`

```text
1–100 characters
```

### `sort`

Allowed:

```text
newest
oldest
```

Default:

```text
newest
```

### Cursor

The cursor is opaque.

The frontend must **not** decode, construct, modify, or interpret the cursor.

The frontend simply sends the returned `nextCursor` back to the API.

---

# 16. Ticket List Ordering

For:

```text
sort=newest
```

the backend uses:

```text
createdAt DESC
id DESC
```

For:

```text
sort=oldest
```

the backend uses:

```text
createdAt ASC
id ASC
```

The `id` field acts as the tie-breaker.

---

# 17. Ticket List Response

```ts
export interface TicketListResponse {
  items: Ticket[];

  pagination: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}
```

Successful REST response:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "nextCursor": "...",
      "hasNextPage": true
    }
  }
}
```

---

# 18. Cursor Pagination Rules

The frontend should use:

```text
hasNextPage
```

to determine whether another request is necessary.

When:

```ts
hasNextPage === true
```

send:

```text
cursor=<nextCursor>
```

on the next request.

When:

```ts
hasNextPage === false
```

stop requesting additional pages.

The frontend must never manufacture a cursor.

---

# 19. Ticket List Filters

Supported filters:

```text
status
priority
categoryId
centerId
labId
search
```

The backend combines these filters with the user's authorization scope.

Therefore:

```text
filter + authorization scope
```

is always enforced server-side.

A frontend user cannot broaden their ticket visibility by manipulating query parameters.

---

# 20. Center/Lab Filter Validation

If both are supplied:

```text
centerId
labId
```

the backend verifies that:

```text
lab.centerId === centerId
```

Otherwise:

```text
VALIDATION_ERROR
```

is returned.

Example invalid query:

```text
?centerId=3&labId=99
```

when lab `99` belongs to another center.

---

# 21. Ticket List Authorization Scope

## ADMIN

Can list:

```text
all tickets
```

## EMPLOYEE

Can list:

```text
tickets requested by the authenticated employee
```

## TECHNICIAN

Can list:

```text
tickets assigned to the authenticated technician
```

## CENTER_MANAGER

Can list tickets belonging to centers where the manager has access.

The backend applies this scope automatically.

---

# 22. Get Ticket

## Endpoint

```http
GET /api/v1/tickets/:ticketId
```

Example:

```http
GET /api/v1/tickets/42
```

---

# 23. Get Ticket Authorization

## ADMIN

Can access any ticket.

## EMPLOYEE

Can access tickets where:

```text
requesterId === authenticatedUser.id
```

## TECHNICIAN

Can access tickets where:

```text
assigneeId === authenticatedUser.id
```

## CENTER_MANAGER

Can access tickets belonging to centers where the manager has access.

Unauthorized or nonexistent tickets are intentionally returned as:

```text
NOT_FOUND
```

rather than exposing whether a restricted ticket exists.

---

# 24. Get Ticket Response

```ts
export interface GetTicketResponse {
  ticket: Ticket;
}
```

The returned Ticket contains the same relation structure described in the Ticket Object section.

---

# 25. Update Ticket

## Endpoint

```http
PATCH /api/v1/tickets/:ticketId
```

---

# 26. Update Request Body

```ts
export interface UpdateTicketRequest {
  title?: string;
  description?: string;

  categoryId?: number;

  softwareId?: number | null;
  requestType?: SoftwareRequestType | null;

  centerId?: number;
  labId?: number;

  priority?: TicketPriority;
}
```

At least one field is required.

An empty body is invalid.

---

# 27. Update Validation

### title

```text
5–150 characters
```

### description

```text
10–5000 characters
```

### categoryId

Positive integer.

### centerId

Positive integer.

### labId

Positive integer.

### priority

Valid TicketPriority.

### softwareId/requestType

They must be supplied together.

Examples:

Valid:

```json
{
  "softwareId": 10,
  "requestType": "UPDATE"
}
```

Valid:

```json
{
  "softwareId": null,
  "requestType": null
}
```

Invalid:

```json
{
  "softwareId": 10
}
```

Invalid:

```json
{
  "requestType": "UPDATE"
}
```

---

# 28. Update Permissions

## EMPLOYEE

Can update:

```text
title
description
categoryId
softwareId
requestType
centerId
labId
```

Employees may only update their own:

```text
OPEN
```

tickets.

Employees cannot update:

```text
priority
```

---

## TECHNICIAN

Can update:

```text
title
description
```

Technicians cannot update:

```text
category
software
request type
center
lab
priority
```

---

## CENTER_MANAGER

Can update:

```text
title
description
categoryId
softwareId
requestType
centerId
labId
priority
```

The destination center must be within the manager's authorized center scope.

---

## ADMIN

Can update all manager-editable fields.

---

# 29. Update Response

```ts
export interface UpdateTicketResponse {
  ticket: Ticket;
}
```

The updated Ticket contains the complete ticket relation structure.

---

# 30. Update Socket Event

After the transaction commits:

```text
ticket:updated
```

is emitted.

Payload:

```ts
export interface TicketUpdatedEvent {
  ticketId: number;
  centerId: number;
  status: TicketStatus;
  priority: TicketPriority;
  updatedAt: string;
}
```

Example:

```json
{
  "ticketId": 42,
  "centerId": 3,
  "status": "OPEN",
  "priority": "HIGH",
  "updatedAt": "2026-09-21T10:45:00.000Z"
}
```

---

# 31. Assignment

## Endpoint

```http
PATCH /api/v1/tickets/:ticketId/assignment
```

---

# 32. Assignment Request

```ts
export interface AssignTicketRequest {
  assigneeId: number | null;
}
```

### Assign

```json
{
  "assigneeId": 25
}
```

### Unassign

```json
{
  "assigneeId": null
}
```

---

# 33. Assignment Permissions

Assignment management is available to:

```text
CENTER_MANAGER
ADMIN
```

EMPLOYEE and TECHNICIAN cannot manage assignments.

The new assignee must be:

```text
active
TECHNICIAN
authorized for the ticket's center
```

---

# 34. Assignment Events

The backend determines the assignment event.

```ts
export type AssignmentEvent =
  | "ASSIGNED"
  | "REASSIGNED"
  | "UNASSIGNED";
```

Rules:

```text
null → technician
ASSIGNED

technician → different technician
REASSIGNED

technician → null
UNASSIGNED
```

If the requested assignee is already the current assignee, no assignment history or notification is created.

---

# 35. Assignment Response

```ts
export interface AssignTicketResponse {
  ticket: Ticket;
}
```

The Ticket contains the complete relation structure.

---

# 36. Assignment Socket Event

```text
ticket:assignment_changed
```

Payload:

```ts
export interface TicketAssignmentChangedEvent {
  ticketId: number;
  centerId: number;
  assigneeId: number | null;
  assignmentEvent: AssignmentEvent | null;
}
```

When no actual assignment change occurred:

```json
{
  "assignmentEvent": null
}
```

---

# 37. Ticket Lifecycle

The ticket lifecycle is controlled by a state machine.

The frontend must never assume that any status can be changed to any other status.

---

# 38. Valid Status Transitions

```text
OPEN
 ├── TRIAGED
 └── CANCELLED

TRIAGED
 ├── ASSIGNED
 └── CANCELLED

ASSIGNED
 ├── IN_PROGRESS
 └── CANCELLED

IN_PROGRESS
 ├── WAITING_FOR_USER
 ├── RESOLVED
 └── CANCELLED

WAITING_FOR_USER
 ├── IN_PROGRESS
 └── CANCELLED

RESOLVED
 ├── CLOSED
 └── IN_PROGRESS

CLOSED
 └── IN_PROGRESS

CANCELLED
 └── terminal
```

---

# 39. Ordinary Status Change

## Endpoint

```http
PATCH /api/v1/tickets/:ticketId/status
```

This endpoint is only for:

```text
TRIAGED
ASSIGNED
IN_PROGRESS
WAITING_FOR_USER
```

It must not be used for:

```text
RESOLVED
CLOSED
CANCELLED
```

Those statuses use dedicated lifecycle endpoints.

---

# 40. Ordinary Status Request

```ts
export interface ChangeTicketStatusRequest {
  status:
    | "TRIAGED"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "WAITING_FOR_USER";
}
```

Example:

```json
{
  "status": "IN_PROGRESS"
}
```

---

# 41. TRIAGE

Target status:

```text
TRIAGED
```

Allowed actors:

```text
ASSIGNED TECHNICIAN
CENTER_MANAGER
ADMIN
```

---

# 42. ASSIGNED Status

Target status:

```text
ASSIGNED
```

Allowed actors:

```text
CENTER_MANAGER
ADMIN
```

The ticket must already have an assigned technician.

Otherwise the backend returns a conflict.

---

# 43. START WORK

Target status:

```text
IN_PROGRESS
```

Allowed actor:

```text
assigned TECHNICIAN
```

---

# 44. WAIT FOR USER

Target status:

```text
WAITING_FOR_USER
```

Allowed actor:

```text
assigned TECHNICIAN
```

When a ticket enters `WAITING_FOR_USER`, the active SLA cycle is paused.

The frontend does not calculate or modify SLA timing.

---

# 45. RESUME WORK

A ticket in:

```text
WAITING_FOR_USER
```

can return to:

```text
IN_PROGRESS
```

through the lifecycle rules.

The requester can also resume a waiting ticket through an eligible public comment/reply flow defined by the Comments module.

---

# 46. Ordinary Status Response

```ts
export interface ChangeTicketStatusResponse {
  ticket: Ticket;
}
```

---

# 47. Status Changed Socket Event

```text
ticket:status_changed
```

Payload:

```ts
export interface TicketStatusChangedEvent {
  ticketId: number;
  centerId: number;

  previousStatus: TicketStatus;
  status: TicketStatus;

  updatedAt: string;
}
```

Example:

```json
{
  "ticketId": 42,
  "centerId": 3,
  "previousStatus": "ASSIGNED",
  "status": "IN_PROGRESS",
  "updatedAt": "2026-09-21T11:00:00.000Z"
}
```

---

# 48. Resolve Ticket

## Endpoint

```http
POST /api/v1/tickets/:ticketId/resolve
```

---

# 49. Resolve Request

```ts
export interface ResolveTicketRequest {
  resolution: string;
  reason?: string;
}
```

### Resolution

Required:

```text
10–5000 characters
```

The resolution is stored as a:

```text
PUBLIC
```

ticket comment.

Therefore the requester can see the resolution.

### Reason

Optional at schema level:

```text
1–500 characters
```

But required when the actor is:

```text
CENTER_MANAGER
ADMIN
```

Technicians do not require a reason.

---

# 50. Resolve Permissions

A ticket must currently be:

```text
IN_PROGRESS
```

Allowed actors:

```text
assigned TECHNICIAN
CENTER_MANAGER
ADMIN
```

The manager/admin path represents a privileged resolution override and requires:

```text
reason
```

---

# 51. Resolve Side Effects

Resolution:

1. changes status to `RESOLVED`
2. sets `resolvedAt`
3. completes the active SLA cycle
4. calculates SLA outcome:

   * `MET`
   * `BREACHED`
5. creates a PUBLIC resolution comment
6. creates `RESOLVED` ticket history
7. notifies the requester

---

# 52. Resolve Response

```ts
export interface ResolveTicketResponse {
  ticket: Ticket;
}
```

---

# 53. Ticket Resolved Socket Event

```text
ticket:resolved
```

Payload:

```ts
export interface TicketResolvedEvent {
  ticketId: number;
  centerId: number;
  status: "RESOLVED";
  resolvedAt: string | null;
  updatedAt: string;
}
```

---

# 54. Confirm Closure

## Endpoint

```http
POST /api/v1/tickets/:ticketId/confirm-closure
```

No request body.

---

# 55. Confirm Closure Permissions

Only the requester can confirm closure.

The ticket must currently be:

```text
RESOLVED
```

The operation changes:

```text
RESOLVED → CLOSED
```

and sets:

```text
closedAt
```

---

# 56. Confirm Closure Response

```ts
export interface ConfirmTicketClosureResponse {
  ticket: Ticket;
}
```

---

# 57. Closure Side Effects

The backend:

* changes status to `CLOSED`
* sets `closedAt`
* creates `CLOSED` ticket history
* notifies the assigned technician when one exists

Notification type:

```text
TICKET_STATUS_CHANGED
```

---

# 58. Ticket Closed Socket Event

```text
ticket:closed
```

Payload:

```ts
export interface TicketClosedEvent {
  ticketId: number;
  centerId: number;
  status: "CLOSED";
  closedAt: string | null;
  updatedAt: string;
}
```

---

# 59. Reopen Ticket

## Endpoint

```http
POST /api/v1/tickets/:ticketId/reopen
```

---

# 60. Reopen Request

```ts
export interface ReopenTicketRequest {
  reason: string;
}
```

Validation:

```text
1–500 characters
```

---

# 61. Reopen Permissions

A ticket must currently be:

```text
RESOLVED
```

Allowed actors:

```text
requester
CENTER_MANAGER
ADMIN
```

The ticket becomes:

```text
IN_PROGRESS
```

---

# 62. Reopen Side Effects

The backend:

* changes status from `RESOLVED` to `IN_PROGRESS`
* clears `resolvedAt`
* clears `closedAt`
* creates a new resolution SLA cycle
* recalculates `resolutionDueAt`
* updates `resolutionTargetMinutes`
* creates `REOPENED` history
* stores the reopen reason in history
* notifies requester and assigned technician

The frontend must not calculate the new SLA deadline.

---

# 63. Reopen Response

```ts
export interface ReopenTicketResponse {
  ticket: Ticket;
}
```

---

# 64. Ticket Reopened Socket Event

```text
ticket:reopened
```

Payload:

```ts
export interface TicketReopenedEvent {
  ticketId: number;
  centerId: number;
  status: "IN_PROGRESS";
  updatedAt: string;
}
```

---

# 65. Cancel Ticket

## Endpoint

```http
POST /api/v1/tickets/:ticketId/cancel
```

---

# 66. Cancel Request

```ts
export interface CancelTicketRequest {
  reason: string;
}
```

Validation:

```text
1–500 characters
```

---

# 67. Cancellable Statuses

Tickets can be cancelled from:

```text
OPEN
TRIAGED
ASSIGNED
IN_PROGRESS
WAITING_FOR_USER
```

Tickets cannot be cancelled after:

```text
RESOLVED
CLOSED
CANCELLED
```

---

# 68. Cancel Permissions

Allowed actors:

```text
requester
CENTER_MANAGER
ADMIN
```

The ticket must be within the actor's authorization scope.

---

# 69. Cancel Side Effects

The backend:

* changes the ticket status to `CANCELLED`
* creates `CANCELLED` ticket history
* stores the cancellation reason in history
* notifies requester and assigned technician

The reason is therefore available through ticket history according to the history visibility rules.

---

# 70. Cancel Response

```ts
export interface CancelTicketResponse {
  ticket: Ticket;
}
```

---

# 71. Ticket Cancelled Socket Event

```text
ticket:cancelled
```

Payload:

```ts
export interface TicketCancelledEvent {
  ticketId: number;
  centerId: number;
  status: "CANCELLED";
  updatedAt: string;
}
```

---

# 72. Ticket History

Lifecycle operations create ticket history records.

Relevant events include:

```ts
export type TicketHistoryEvent =
  | "CREATED"
  | "STATUS_CHANGED"
  | "PRIORITY_CHANGED"
  | "CATEGORY_CHANGED"
  | "SOFTWARE_CHANGED"
  | "CENTER_CHANGED"
  | "LAB_CHANGED"
  | "RESOLVED"
  | "REOPENED"
  | "CLOSED"
  | "CANCELLED";
```

Lifecycle-specific history includes:

```text
STATUS_CHANGED
RESOLVED
REOPENED
CLOSED
CANCELLED
```

---

# 73. Lifecycle History Semantics

## Status change

Example:

```text
fromValue = ASSIGNED
toValue = IN_PROGRESS
```

Description:

```text
Ticket status changed from ASSIGNED to IN_PROGRESS.
```

## Resolution

Technician:

```text
Ticket resolved by assigned technician.
```

Manager/Admin:

```text
the supplied resolution override reason
```

## Reopen

```text
body.reason
```

is stored as the history description.

## Cancel

```text
body.reason
```

is stored as the history description.

## Closure

The history description is:

```text
Ticket closed by requester confirmation.
```

---

# 74. Notifications

Ticket operations can generate notifications.

The notification object follows the Notifications module contract.

```ts
export type NotificationType =
  | "TICKET_CREATED"
  | "TICKET_ASSIGNED"
  | "TICKET_STATUS_CHANGED"
  | "TICKET_RESOLVED"
  | "TICKET_REOPENED"
  | "SLA_AT_RISK"
  | "SLA_BREACHED";
```

---

# 75. Notification Created Socket Event

Whenever a lifecycle operation creates a notification, the backend emits:

```text
notification:created
```

Payload:

```ts
export interface NotificationCreatedEvent {
  notificationId: number;
  type: NotificationType;
  title: string;
  message: string;
  ticketId: number | null;
  createdAt: string;
}
```

---

# 76. Ticket Lifecycle Notification Recipients

## Status changes

Typically:

```text
requester
assigned technician
```

when an assignee exists.

## Resolution

```text
requester
```

## Closure

```text
assigned technician
```

when an assignee exists.

## Reopen

```text
requester
assigned technician
```

when an assignee exists.

## Cancellation

```text
requester
assigned technician
```

when an assignee exists.

The frontend must not calculate notification recipients.

---

# 77. Socket.IO Architecture

Socket authentication uses the same authenticated session/access cookie as REST.

The frontend should establish one authenticated Socket.IO connection.

Conceptually:

```ts
const socket = io(API_URL, {
  withCredentials: true,
});
```

The frontend does not send a separate login payload to Socket.IO.

---

# 78. Socket Events Summary

| Event                       | Purpose                      |
| --------------------------- | ---------------------------- |
| `ticket:created`            | New ticket created           |
| `ticket:assignment_changed` | Ticket assignment changed    |
| `ticket:updated`            | Editable ticket data changed |
| `ticket:status_changed`     | Ordinary status changed      |
| `ticket:resolved`           | Ticket resolved              |
| `ticket:closed`             | Ticket closed                |
| `ticket:cancelled`          | Ticket cancelled             |
| `ticket:reopened`           | Ticket reopened              |
| `ticket:comment_created`    | New ticket comment           |
| `notification:created`      | New notification             |

---

# 79. Socket Event Handling Rule

Socket events are **not the authoritative ticket data source**.

For example, `ticket:updated` contains:

```ts
{
  ticketId,
  centerId,
  status,
  priority,
  updatedAt
}
```

It does not contain the entire Ticket.

Therefore the frontend should generally:

```text
receive event
      ↓
identify affected query/resource
      ↓
invalidate/refetch relevant REST query
      ↓
render authoritative server state
```

Do not reconstruct a complete Ticket from a partial socket payload.

---

# 80. Transaction/Event Ordering

Backend lifecycle operations follow:

```text
database transaction
       ↓
ticket update
       ↓
history
       ↓
notifications
       ↓
transaction commits
       ↓
Socket.IO events
```

The frontend can therefore treat successfully received socket events as notifications that committed server state has changed.

---

# 81. Concurrency

Ticket lifecycle operations use conditional database updates.

A request may fail with:

```text
CONFLICT
```

if another operation changes the ticket before the update completes.

Examples:

```text
Ticket status changed before it could be reopened.
```

```text
Ticket changed while the resolution was being processed.
```

```text
Ticket status changed before it could be cancelled.
```

Frontend behavior:

```text
receive conflict
      ↓
show non-destructive error
      ↓
refetch ticket
      ↓
render current server state
```

The frontend should not blindly retry lifecycle mutations.

---

# 82. Recommended Frontend Type Organization

The frontend should keep ticket contracts in a dedicated feature module.

Recommended structure:

```text
src/
└── features/
    └── tickets/
        ├── api/
        │   ├── ticket.api.ts
        │   └── ticket.keys.ts
        │
        ├── components/
        │   ├── TicketCard.tsx
        │   ├── TicketTable.tsx
        │   ├── TicketFilters.tsx
        │   ├── TicketStatusBadge.tsx
        │   ├── TicketPriorityBadge.tsx
        │   └── TicketTimeline.tsx
        │
        ├── hooks/
        │   ├── useTickets.ts
        │   ├── useTicket.ts
        │   ├── useCreateTicket.ts
        │   └── useTicketLifecycle.ts
        │
        ├── types/
        │   └── ticket.types.ts
        │
        └── pages/
            ├── TicketsPage.tsx
            ├── TicketDetailsPage.tsx
            └── CreateTicketPage.tsx
```

---

# 83. Frontend Mutation Strategy

Lifecycle mutations should be represented separately.

Examples:

```ts
createTicket()
updateTicket()
assignTicket()
changeTicketStatus()
resolveTicket()
confirmTicketClosure()
reopenTicket()
cancelTicket()
```

Do not create one generic:

```ts
updateTicketStatus()
```

function for all lifecycle operations.

The backend intentionally exposes dedicated lifecycle boundaries.

---

# 84. Frontend Status Action Mapping

The UI can derive available actions from the current ticket state for presentation purposes.

However, this is only a UX optimization.

The backend remains authoritative.

Conceptually:

```ts
OPEN
→ TRIAGED
→ ASSIGNED
→ IN_PROGRESS
→ WAITING_FOR_USER
→ IN_PROGRESS
→ RESOLVED
→ CLOSED
```

with cancellation available from:

```text
OPEN
TRIAGED
ASSIGNED
IN_PROGRESS
WAITING_FOR_USER
```

and reopening from:

```text
RESOLVED
```

---

# 85. Important Frontend Rule

Do not expose lifecycle buttons merely because the status permits a transition.

The UI should consider:

```text
current user role
+
current user identity
+
ticket requester
+
ticket assignee
+
ticket center access
+
current ticket status
```

But even then, the backend remains authoritative.

A hidden/disabled button is a UX decision.

It is **not** a security boundary.

---

# 86. Error Handling

The frontend should handle at least:

```text
VALIDATION_ERROR
UNAUTHENTICATED
FORBIDDEN
NOT_FOUND
CONFLICT
```

### VALIDATION_ERROR

Show field-level or form-level validation.

### UNAUTHENTICATED

Attempt normal session recovery through the Auth module.

### FORBIDDEN

Show an authorization message.

### NOT_FOUND

Show the ticket-not-found state.

### CONFLICT

Refresh the ticket/list and inform the user that the ticket changed.

---

# 87. Important Security Rules

The frontend must never trust:

```text
role
ticketId
requesterId
assigneeId
centerId
status
priority
```

as authorization information.

For example, changing:

```json
{
  "centerId": 10
}
```

must never allow a user to access another center.

The backend validates all authorization boundaries.

---

# 88. REST vs Socket.IO

REST:

```text
authoritative persisted state
```

Socket.IO:

```text
real-time change notification
```

Recommended frontend model:

```text
REST query
    ↓
render server state

Socket event
    ↓
invalidate/refetch
    ↓
REST
    ↓
render updated state
```

---

# 89. Contract Summary

## Ticket CRUD

```text
POST   /api/v1/tickets
GET    /api/v1/tickets
GET    /api/v1/tickets/:ticketId
PATCH  /api/v1/tickets/:ticketId
PATCH  /api/v1/tickets/:ticketId/assignment
```

## Lifecycle

```text
PATCH  /api/v1/tickets/:ticketId/status
POST   /api/v1/tickets/:ticketId/resolve
POST   /api/v1/tickets/:ticketId/confirm-closure
POST   /api/v1/tickets/:ticketId/reopen
POST   /api/v1/tickets/:ticketId/cancel
```

## Comments

```text
/api/v1/tickets/:ticketId/comments
```

Comments are defined by the separate Comments Payload Contract.

---

# 90. Complete Lifecycle Overview

```text
                    ┌──────────────┐
                    │     OPEN     │
                    └──────┬───────┘
                           │
                         TRIAGE
                           ↓
                    ┌──────────────┐
                    │   TRIAGED    │
                    └──────┬───────┘
                           │
                       ASSIGNMENT
                           ↓
                    ┌──────────────┐
                    │   ASSIGNED   │
                    └──────┬───────┘
                           │
                       START WORK
                           ↓
                    ┌──────────────┐
                    │ IN_PROGRESS  │
                    └───┬──────┬───┘
                        │      │
               WAIT FOR USER   │ RESOLVE
                        │      ↓
                        │  ┌──────────────┐
                        │  │   RESOLVED   │
                        │  └──────┬───────┘
                        │         │
                        │       CLOSE
                        │         ↓
                        │  ┌──────────────┐
                        │  │    CLOSED    │
                        │  └──────────────┘
                        │
                    PUBLIC REPLY
                        │
                        ↓
                  IN_PROGRESS

Cancellation can occur from:

OPEN
TRIAGED
ASSIGNED
IN_PROGRESS
WAITING_FOR_USER

                         ↓
                  ┌──────────────┐
                  │  CANCELLED   │
                  └──────────────┘
```

---

# 91. Source of Truth

This contract was derived from the implemented:

* ticket schemas
* ticket controllers
* ticket routes
* create ticket use case
* list tickets use case
* get ticket use case
* update ticket use case
* assignment use case
* change status use case
* resolve use case
* confirm closure use case
* reopen use case
* cancel use case
* ticket transition policy
* ticket lifecycle access policy
* ticket list scope policy
* ticket list filters policy
* ticket location validation policy
* ticket update scope policy
* ticket assignment scope policy
* Socket.IO implementation

If backend behavior changes, this contract must be updated before corresponding frontend behavior is changed.
