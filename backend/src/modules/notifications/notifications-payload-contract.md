# Notifications API Payload Contract

**Module:** Notifications
**Base Route:** `/api/v1/notifications`

This document defines the frontend/backend contract for:

* In-app notifications
* Notification pagination
* Unread notification counts
* Marking notifications as read
* Marking all notifications as read
* Notification preferences
* Real-time notification delivery through Socket.IO

---

# 1. Authentication

All notification endpoints require authentication through:

```text
requireAuth
```

The frontend must send authentication cookies:

```ts
credentials: "include"
```

or:

```ts
withCredentials: true
```

The frontend must never store or manually manage JWT tokens.

---

# 2. Notification Types

The backend Prisma enum is:

```ts
export enum NotificationType {
  TICKET_CREATED = "TICKET_CREATED",
  TICKET_ASSIGNED = "TICKET_ASSIGNED",
  TICKET_STATUS_CHANGED = "TICKET_STATUS_CHANGED",
  TICKET_RESOLVED = "TICKET_RESOLVED",
  TICKET_REOPENED = "TICKET_REOPENED",
  SLA_AT_RISK = "SLA_AT_RISK",
  SLA_BREACHED = "SLA_BREACHED",
}
```

Frontend type:

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

These values must exactly match the backend.

---

# 3. Notification Object

The backend `Notification` model is:

```prisma
model Notification {
  id      Int              @id @default(autoincrement())
  type    NotificationType
  title   String           @db.VarChar(150)
  message String           @db.VarChar(500)
  readAt  DateTime?

  userId Int
  user   User @relation(fields: [userId], references: [id], onDelete: Restrict)

  ticketId Int?
  ticket   Ticket? @relation(fields: [ticketId], references: [id], onDelete: SetNull)

  dedupeKey String? @unique @db.VarChar(191)

  createdAt DateTime @default(now())
}
```

Frontend representation:

```ts
export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  readAt: string | null;
  userId: number;
  ticketId: number | null;
  dedupeKey: string | null;
  createdAt: string;
}
```

### Important

The backend's Prisma `DateTime` values are serialized through HTTP/JSON.

Therefore the frontend should represent them as:

```ts
string
```

rather than:

```ts
Date
```

at the API-contract layer.

---

# 4. Notification Type Meaning

| Type                    | Meaning                                           |
| ----------------------- | ------------------------------------------------- |
| `TICKET_CREATED`        | A ticket was created                              |
| `TICKET_ASSIGNED`       | A ticket assignment changed / ticket was assigned |
| `TICKET_STATUS_CHANGED` | A ticket status changed                           |
| `TICKET_RESOLVED`       | A ticket was resolved                             |
| `TICKET_REOPENED`       | A ticket was reopened                             |
| `SLA_AT_RISK`           | A ticket is approaching an SLA deadline           |
| `SLA_BREACHED`          | A ticket exceeded an SLA deadline                 |

The frontend should use the enum value for behavior and use the backend-provided `title` and `message` for notification content.

It should not reconstruct notification messages from the type.

---

# 5. Get Notifications

### Endpoint

```http
GET /api/v1/notifications
```

### Authentication

Required.

### Query Parameters

```ts
export interface GetNotificationsQuery {
  page: number;
  limit: number;
  unreadOnly: boolean;
}
```

Example:

```http
GET /api/v1/notifications?page=1&limit=20&unreadOnly=false
```

Unread only:

```http
GET /api/v1/notifications?page=1&limit=20&unreadOnly=true
```

---

# 6. Get Notifications Response

```http
200 OK
```

Response envelope:

```json
{
  "success": true,
  "data": {
    "notifications": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    },
    "unreadCount": 0
  }
}
```

Frontend type:

```ts
export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  pagination: NotificationPagination;
  unreadCount: number;
}
```

---

# 7. Notification Ordering

The backend orders notifications by:

```text
createdAt DESC
id DESC
```

Therefore the API returns the newest notifications first.

The frontend should preserve this ordering.

---

# 8. Unread Count

Every notification-list response contains:

```ts
unreadCount: number;
```

This represents the user's total unread notification count, not merely the unread count on the current page.

It can be used for:

* Notification bell badge
* Sidebar badge
* Header indicator
* Dashboard notification count

---

# 9. Mark Notification as Read

### Endpoint

```http
PATCH /api/v1/notifications/:id/read
```

Example:

```http
PATCH /api/v1/notifications/42/read
```

### Authentication

Required.

### Request body

None.

---

# 10. Mark Notification as Read — Response

Frontend type:

```ts
export interface MarkNotificationReadResponse {
  found: boolean;
  alreadyRead?: boolean;
  notificationId?: number;
  readAt?: string | null;
}
```

### Newly marked as read

```json
{
  "success": true,
  "data": {
    "found": true,
    "alreadyRead": false,
    "notificationId": 42,
    "readAt": "2026-09-21T10:30:00.000Z"
  }
}
```

### Already read

```json
{
  "success": true,
  "data": {
    "found": true,
    "alreadyRead": true,
    "notificationId": 42,
    "readAt": "2026-09-21T10:30:00.000Z"
  }
}
```

This is not an error.

### Not found or not owned

```json
{
  "success": true,
  "data": {
    "found": false
  }
}
```

The backend intentionally does not reveal whether a notification belongs to another user.

---

# 11. Mark All Notifications as Read

### Endpoint

```http
PATCH /api/v1/notifications/read-all
```

### Authentication

Required.

### Request body

None.

---

# 12. Mark All Response

```json
{
  "success": true,
  "data": {
    "updatedCount": 7
  }
}
```

Frontend type:

```ts
export interface MarkAllNotificationsReadResponse {
  updatedCount: number;
}
```

If there were no unread notifications:

```json
{
  "success": true,
  "data": {
    "updatedCount": 0
  }
}
```

This is still a successful operation.

---

# 13. Get Notification Preferences

### Endpoint

```http
GET /api/v1/notifications/preferences
```

### Authentication

Required.

### Request body

None.

---

# 14. Notification Preference

Frontend type:

```ts
export interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
}
```

Response:

```json
{
  "success": true,
  "data": {
    "preferences": [
      {
        "type": "TICKET_CREATED",
        "enabled": true
      },
      {
        "type": "TICKET_ASSIGNED",
        "enabled": true
      },
      {
        "type": "SLA_AT_RISK",
        "enabled": false
      },
      {
        "type": "SLA_BREACHED",
        "enabled": true
      }
    ]
  }
}
```

Frontend response type:

```ts
export interface GetNotificationPreferencesResponse {
  preferences: NotificationPreference[];
}
```

---

# 15. Preference Defaults

The backend returns **every `NotificationType`**.

If a preference has never been saved for a user:

```ts
enabled === true
```

Therefore the frontend should treat the backend response as the complete preference state.

It should not assume:

```textmissing preference = disabled
```

The backend explicitly defaults missing preferences to enabled.

---

# 16. Update Notification Preferences

### Endpoint

```http
PATCH /api/v1/notifications/preferences
```

### Authentication

Required.

### Request body

```ts
export interface UpdateNotificationPreferencesRequest {
  preferences: {
    type: NotificationType;
    enabled: boolean;
  }[];
}
```

Example:

```json
{
  "preferences": [
    {
      "type": "TICKET_CREATED",
      "enabled": true
    },
    {
      "type": "SLA_AT_RISK",
      "enabled": false
    },
    {
      "type": "SLA_BREACHED",
      "enabled": true
    }
  ]
}
```

---

# 17. Update Preferences Response

The backend returns the complete updated preference state.

```json
{
  "success": true,
  "data": {
    "preferences": [
      {
        "type": "TICKET_CREATED",
        "enabled": true
      },
      {
        "type": "TICKET_ASSIGNED",
        "enabled": true
      },
      {
        "type": "SLA_AT_RISK",
        "enabled": false
      },
      {
        "type": "SLA_BREACHED",
        "enabled": true
      }
    ]
  }
}
```

Frontend type:

```ts
export interface UpdateNotificationPreferencesResponse {
  preferences: NotificationPreference[];
}
```

---

# 18. Preference Enforcement

The backend checks notification preferences **before creating a notification**.

Conceptually:

```text
Notification requested
        ↓
Check user's preference
        ↓
   ┌────┴────┐
   ↓         ↓
enabled    disabled
   ↓         ↓
create     skip
```

Therefore frontend preference state is primarily for:

* Settings UI
* Displaying current configuration
* Updating preferences

The frontend must not attempt to enforce notification delivery rules itself.

---

# 19. Notification Deduplication

The backend uses:

```ts
dedupeKey
```

for notification deduplication.

The database constraint is:

```prisma
dedupeKey String? @unique
```

The frontend does not need to implement backend deduplication logic.

It should treat notification IDs as the primary identity:

```ts
notification.id
```

---

# 20. Real-Time Socket.IO Event

Notifications are also delivered in real time.

### Event

```text
notification:created
```

Direction:

```text
Backend → Frontend
```

---

# 21. `notification:created` Payload

The backend emits:

```ts
publishToUser(
  notification.userId,
  "notification:created",
  {
    notificationId: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    ticketId: notification.ticketId,
    createdAt: notification.createdAt,
  },
);
```

Therefore the exact frontend payload is:

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

Example:

```json
{
  "notificationId": 104,
  "type": "SLA_AT_RISK",
  "title": "First-response SLA at risk",
  "message": "Ticket TKT-2026-00124 is approaching its first-response SLA deadline.",
  "ticketId": 124,
  "createdAt": "2026-09-21T10:30:00.000Z"
}
```

---

# 22. Socket Notification Flow

The backend follows:

```text
Business operation
       ↓
Create notification
       ↓
Database transaction
       ↓
Transaction commits
       ↓
publishToUser()
       ↓
notification:created
       ↓
Frontend
```

This means the Socket.IO event is emitted **after persistence succeeds**.

---

# 23. Frontend Socket Handler

The eventual frontend can subscribe using:

```ts
socket.on(
  "notification:created",
  (notification: NotificationCreatedEvent) => {
    // update notification state
  },
);
```

The frontend may then:

1. Add the notification to in-memory state.
2. Increase the unread indicator.
3. Show a toast.
4. Optionally invalidate/refetch the notification query.

The exact state-management strategy will be decided when we build the frontend architecture.

---

# 24. REST and Socket Responsibilities

REST API:

```text
Historical/persisted notification state
```

Socket.IO:

```text
Real-time notification delivery
```

Architecture:

```text
                Notification Database
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
           REST API             Socket.IO
              ↓                     ↓
       Notification list      New notification
              ↓                     ↓
              └──────────┬──────────┘
                         ↓
                  Frontend State
```

Socket.IO is therefore not a replacement for REST notification fetching.

---

# 25. Complete Frontend Types

The Notifications module can eventually contain:

```ts
export type NotificationType =
  | "TICKET_CREATED"
  | "TICKET_ASSIGNED"
  | "TICKET_STATUS_CHANGED"
  | "TICKET_RESOLVED"
  | "TICKET_REOPENED"
  | "SLA_AT_RISK"
  | "SLA_BREACHED";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  readAt: string | null;
  userId: number;
  ticketId: number | null;
  dedupeKey: string | null;
  createdAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  pagination: NotificationPagination;
  unreadCount: number;
}

export interface MarkNotificationReadResponse {
  found: boolean;
  alreadyRead?: boolean;
  notificationId?: number;
  readAt?: string | null;
}

export interface MarkAllNotificationsReadResponse {
  updatedCount: number;
}

export interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
}

export interface GetNotificationPreferencesResponse {
  preferences: NotificationPreference[];
}

export interface UpdateNotificationPreferencesRequest {
  preferences: NotificationPreference[];
}

export interface UpdateNotificationPreferencesResponse {
  preferences: NotificationPreference[];
}

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

# 26. Endpoint Summary

| Method  | Endpoint                     | Request                       | Response                                  |
| ------- | ---------------------------- | ----------------------------- | ----------------------------------------- |
| `GET`   | `/notifications`             | `page`, `limit`, `unreadOnly` | Notifications + pagination + unread count |
| `PATCH` | `/notifications/read-all`    | None                          | `updatedCount`                            |
| `PATCH` | `/notifications/:id/read`    | None                          | Read result                               |
| `GET`   | `/notifications/preferences` | None                          | Preferences                               |
| `PATCH` | `/notifications/preferences` | Preference array              | Updated preferences                       |

---

# 27. Socket Event Summary

| Event                  | Direction          | Payload                    |
| ---------------------- | ------------------ | -------------------------- |
| `notification:created` | Backend → Frontend | `NotificationCreatedEvent` |

---

# 28. Frontend Rules

The frontend notification architecture must follow these rules:

1. Use REST for initial notification loading.
2. Use REST for pagination.
3. Use REST for read mutations.
4. Use REST for preference management.
5. Use Socket.IO for real-time notification delivery.
6. Use `notification.id` as the notification identity.
7. Do not implement backend deduplication rules in the frontend.
8. Treat `unreadCount` as backend-provided state.
9. Do not expose notifications belonging to another user.
10. Do not store JWTs in frontend storage.
11. Send authentication cookies with requests.
12. Treat REST as the persisted source of truth.
13. Treat Socket.IO as the real-time update channel.
14. Use the backend-provided `title` and `message`; do not reconstruct notification text from `NotificationType`.

---

# 29. Security Boundary

The frontend receives notification data for the authenticated user only.

The backend remains responsible for:

* Recipient selection
* Notification preference enforcement
* Deduplication
* SLA notification generation
* User authorization
* Notification ownership
* Persistence
* Real-time delivery authorization

The frontend must not attempt to reproduce these authorization rules.

---

# 30. Final Contract

The Notifications module exposes:

```text
REST
 ├── GET    /notifications
 ├── PATCH  /notifications/read-all
 ├── PATCH  /notifications/:id/read
 ├── GET    /notifications/preferences
 └── PATCH  /notifications/preferences

Socket.IO
 └── notification:created
```

The backend `NotificationType` values are:

```text
TICKET_CREATED
TICKET_ASSIGNED
TICKET_STATUS_CHANGED
TICKET_RESOLVED
TICKET_REOPENED
SLA_AT_RISK
SLA_BREACHED
```

**REST API = persisted notification state.**

**Socket.IO = real-time notification delivery.**

**Backend = authorization, preference enforcement, deduplication, and notification generation.**
