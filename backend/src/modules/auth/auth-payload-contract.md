# Auth API Payload Contract

**Module:** Authentication
**Base Route:** `/api/v1/auth`
**Purpose:** Frontend/backend contract for authentication, session management, and current-user state.

---

## 1. Authentication Model

The application uses:

* Short-lived JWT access token
* Long-lived refresh token
* HTTP-only cookies
* Refresh-token rotation
* Refresh-token reuse detection
* Refresh-token family revocation
* No JWT storage in `localStorage`

The frontend must **not** read or manually manage the access/refresh tokens.

All authenticated browser requests must allow cookies:

```ts
credentials: "include"
```

---

# 2. User Payload

## Authenticated User — Login/Register/Refresh

The following shape is returned by:

* `POST /register`
* `POST /login`
* `POST /refresh`

```ts
export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  centerId: number | null;
}

export type UserRole =
  | "EMPLOYEE"
  | "TECHNICIAN"
  | "CENTER_MANAGER"
  | "ADMIN";
```

### Example

```json
{
  "id": 42,
  "fullName": "John Doe",
  "email": "john@example.com",
  "role": "EMPLOYEE",
  "centerId": 3
}
```

`centerId` can be `null`.

---

## Current User — `/me`

`GET /api/v1/auth/me` returns one additional field:

```ts
export interface CurrentUser extends AuthUser {
  isActive: boolean;
}
```

Example:

```json
{
  "id": 42,
  "fullName": "John Doe",
  "email": "john@example.com",
  "role": "EMPLOYEE",
  "centerId": 3,
  "isActive": true
}
```

The backend currently only returns the user from `/me` when the account exists and is active.

---

# 3. Register

### Endpoint

```http
POST /api/v1/auth/register
```

### Authentication

Public.

### Rate Limiting

Yes.

### Request Body

```ts
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}
```

Example:

```json
{
  "fullName": "John Doe",
  "email": "John@Example.com",
  "password": "SecurePassword123!"
}
```

### Backend normalization

Email is:

1. Trimmed
2. Validated
3. Converted to lowercase

Therefore:

```text
John@Example.com
```

becomes:

```text
john@example.com
```

### Password rules

```text
Minimum: 12 characters
Maximum: 128 characters
```

### Strict validation

The request schema is strict.

The frontend should send **only**:

```text
fullName
email
password
```

Do not send:

```text
role
centerId
isActive
```

Public registration always creates:

```text
role = EMPLOYEE
```

### Success

```http
201 Created
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 42,
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "EMPLOYEE",
      "centerId": null
    }
  }
}
```

### Possible Errors

Duplicate email:

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Email is already registered"
  }
}
```

Validation errors use the application's standard validation error format.

---

# 4. Login

### Endpoint

```http
POST /api/v1/auth/login
```

### Authentication

Public.

### Rate Limiting

Yes.

### Request Body

```ts
export interface LoginRequest {
  email: string;
  password: string;
}
```

Example:

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

### Success

```http
200 OK
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 42,
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "EMPLOYEE",
      "centerId": 3
    }
  }
}
```

### Side Effects

Successful login creates:

* Access-token cookie
* Refresh-token cookie
* Refresh session in the database

The frontend does **not** receive the raw tokens in the JSON response.

### Errors

Invalid credentials:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Invalid email or password."
  }
}
```

Inactive account:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Account is inactive."
  }
}
```

The frontend should not distinguish whether the email or password was incorrect.

---

# 5. Refresh Session

### Endpoint

```http
POST /api/v1/auth/refresh
```

### Authentication

Uses the HTTP-only refresh-token cookie.

### Request Body

None.

```http
Content-Type: application/json
```

is not required unless the frontend client automatically sends it.

### Request

```ts
POST /api/v1/auth/refresh
```

with:

```ts
credentials: "include"
```

### Success

```http
200 OK
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 42,
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "EMPLOYEE",
      "centerId": 3
    }
  }
}
```

### Side Effects

The backend rotates:

```text
old refresh token
        ↓
revoked
        ↓
new refresh token
```

and issues a new access token.

The frontend only needs to know that the session was successfully restored.

### Important

The frontend should **never manually rotate tokens**.

It simply calls:

```http
POST /api/v1/auth/refresh
```

with cookies enabled.

### Error cases

#### Missing/invalid refresh token

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Refresh token is missing or invalid."
  }
}
```

#### Expired refresh token

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Refresh token is invalid or expired."
  }
}
```

#### Inactive account

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Account is inactive."
  }
}
```

The backend also clears authentication cookies for failed refresh attempts.

---

# 6. Logout

### Endpoint

```http
POST /api/v1/auth/logout
```

### Authentication

No `requireAuth` middleware.

The backend uses the refresh cookie if available.

### Request Body

None.

### Success

```http
200 OK
```

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Side Effects

The backend:

1. Revokes the current refresh session when present.
2. Clears the access-token cookie.
3. Clears the refresh-token cookie.

The frontend should clear its in-memory authentication state after successful logout.

---

# 7. Current User

### Endpoint

```http
GET /api/v1/auth/me
```

### Authentication

Required.

```text
requireAuth
```

### Request

No body.

```ts
GET /api/v1/auth/me
```

with:

```ts
credentials: "include"
```

### Success

```http
200 OK
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 42,
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "EMPLOYEE",
      "centerId": 3,
      "isActive": true
    }
  }
}
```

### Unauthenticated

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication is required."
  }
}
```

The frontend should treat this as an unauthenticated session.

---

# 8. Standard API Envelope

Successful responses follow:

```ts
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
```

Example:

```ts
ApiSuccessResponse<{
  user: AuthUser;
}>
```

Error responses follow:

```ts
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

---

# 9. Frontend Authentication Rules

## Never store JWTs in localStorage

Do **not** implement:

```ts
localStorage.setItem("token", accessToken);
```

The frontend does not receive the tokens as normal JSON data.

---

## Never read authentication cookies directly

Do not implement:

```ts
document.cookie
```

for authentication.

The cookies are HTTP-only.

---

## Always send credentials

Fetch:

```ts
fetch("/api/v1/auth/me", {
  credentials: "include"
});
```

Axios:

```ts
axios.get("/api/v1/auth/me", {
  withCredentials: true
});
```

The eventual frontend API client should centralize this rather than repeating it in every request.

---

# 10. Frontend Session Lifecycle

The intended frontend lifecycle is:

```text
Application starts
       ↓
GET /auth/me
       ↓
Authenticated?
   ↙          ↘
 YES           NO
  ↓             ↓
Load user    Try /auth/refresh
                ↓
          ┌─────┴─────┐
          ↓           ↓
       Success       Failure
          ↓           ↓
      Load user    Logged out
```

The frontend authentication state should therefore distinguish states such as:

```ts
type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated";
```

---

# 11. Role-Based Frontend Behavior

The backend user payload provides:

```ts
role
```

with one of:

```ts
type UserRole =
  | "EMPLOYEE"
  | "TECHNICIAN"
  | "CENTER_MANAGER"
  | "ADMIN";
```

The frontend may use this for:

* Route protection
* Navigation visibility
* Dashboard selection
* Role-specific UI
* Feature visibility

However:

> Frontend role checks are for UX/navigation only.

Authorization remains a backend responsibility.

The frontend must never assume that hiding a button makes an operation authorized.

---

# 12. Center Relationship

Authenticated users currently expose:

```ts
centerId: number | null;
```

This represents the user's primary center association.

The frontend must support:

```ts
centerId === null
```

and must not assume every authenticated user belongs to a center.

Additional center-access relationships may be exposed by other modules later.

---

# 13. Socket.IO Authentication Relationship

Socket.IO authentication uses the same authentication model.

The browser sends the HTTP-only access cookie during the Socket.IO connection.

The Socket.IO server validates the access JWT.

There is no separate frontend socket login.

Conceptually:

```text
HTTP Login
    ↓
HTTP-only access cookie
    ↓
REST API
    +
Socket.IO connection
```

Therefore the frontend should not create or store a separate socket authentication token.

---

# 14. Frontend Contract Types

The eventual frontend can centralize these types:

```ts
export type UserRole =
  | "EMPLOYEE"
  | "TECHNICIAN"
  | "CENTER_MANAGER"
  | "ADMIN";

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  centerId: number | null;
}

export interface CurrentUser extends AuthUser {
  isActive: boolean;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUserResponse {
  user: AuthUser;
}

export interface CurrentUserResponse {
  user: CurrentUser;
}

export interface LogoutResponse {
  message: string;
}
```

These types should become the frontend's source of truth for the Auth module.

---

# 15. Backend Contract Notes

The following are intentionally **not** exposed in the authentication response:

```text
passwordHash
refreshToken
refreshTokenHash
refreshSession
userAgent
ipAddress
```

These remain backend-only security data.

The backend also hashes passwords using bcrypt before persistence.

---

# 16. Contract Summary

| Endpoint              | Auth            | Request           | Response      |
| --------------------- | --------------- | ----------------- | ------------- |
| `POST /auth/register` | Public          | `RegisterRequest` | `AuthUser`    |
| `POST /auth/login`    | Public          | `LoginRequest`    | `AuthUser`    |
| `POST /auth/refresh`  | Refresh cookie  | None              | `AuthUser`    |
| `POST /auth/logout`   | Cookie optional | None              | Message       |
| `GET /auth/me`        | Access cookie   | None              | `CurrentUser` |

The **exact backend response shape is now established** for the Auth module.
