# Gradious Service Ticket System

A production-oriented full-stack IT Service Ticket Management System designed to manage software installation and IT support requests across multiple centers and labs.

The system provides role-based access, ticket lifecycle management, SLA monitoring, notifications, audit logging, service catalog management, and operational analytics.

---

## Table of Contents

* [Overview](#overview)
* [Key Features](#key-features)
* [User Roles](#user-roles)
* [Ticket Lifecycle](#ticket-lifecycle)
* [Technology Stack](#technology-stack)
* [System Architecture](#system-architecture)
* [Project Structure](#project-structure)
* [Backend Modules](#backend-modules)
* [Frontend Modules](#frontend-modules)
* [Authentication and Authorization](#authentication-and-authorization)
* [Ticket and Comment Visibility](#ticket-and-comment-visibility)
* [SLA Management](#sla-management)
* [Analytics](#analytics)
* [API Overview](#api-overview)
* [Database](#database)
* [Environment Variables](#environment-variables)
* [Local Development](#local-development)
* [Production Build](#production-build)
* [Security](#security)
* [Engineering Practices](#engineering-practices)
* [Future Improvements](#future-improvements)
* [Author](#author)

---

## Overview

The **Gradious Service Ticket System** is an internal IT service management platform for organizations operating across multiple centers and laboratories.

Employees can submit IT/software-related requests, while technicians and management teams can manage, assign, track, resolve, and monitor those requests.

The platform was designed around real-world service management requirements rather than simple CRUD operations.

It supports:

* Multi-center organizations
* Role-based access control
* Ticket assignment and lifecycle management
* Software/service catalog management
* SLA tracking
* Internal and public ticket communication
* Notifications
* Audit trails
* Operational analytics
* Technician workload monitoring

---

## Key Features

### Authentication

* Secure employee registration
* Login/logout
* JWT-based authentication
* Access-token authentication
* Refresh-token rotation
* Refresh-token family tracking
* Refresh-token reuse detection
* Token revocation during logout
* Password hashing with bcrypt
* Current-user/session endpoint

### Role-Based Access Control

The application supports:

* Employee
* Technician
* Center Manager
* Administrator

Authorization is enforced on the backend using protected routes and role middleware.

Frontend role restrictions are used for user experience and navigation, while the backend remains the actual security boundary.

### Ticket Management

Tickets support:

* Ticket creation
* Ticket categorization
* Priority management
* Request type management
* Center association
* Lab association
* Software association
* Technician assignment
* Status transitions
* Ticket comments
* Ticket history
* Resolution tracking
* Cancellation
* SLA tracking

### Service Catalog

Administrators can manage:

* Software
* Categories

This allows ticket requests to reference a controlled service/software catalog.

### Center and Lab Management

The system supports:

* Multiple service centers
* Labs belonging to centers
* User-to-center access
* Primary user center
* Authorized center access for management users

### Notifications

The system supports application-level notifications for important ticket and operational events.

### Audit Logs

Important system actions are recorded through audit logging to provide traceability for administrative and security-sensitive operations.

### SLA Monitoring

The SLA module provides:

* SLA policy management
* SLA policy activation/deactivation
* Ticket SLA monitoring
* SLA status information
* SLA breach visibility
* First-response tracking
* Resolution tracking

### Analytics Dashboard

The Analytics dashboard provides operational insights including:

* Total ticket volume
* Ticket volume by status
* Ticket trends
* Tickets by center
* Tickets by category
* Tickets by priority
* SLA compliance
* Average first response time
* Average resolution time
* Resolution rate
* Technician workload

Analytics can be filtered by:

* Date range
* Center
* Category
* Priority
* Trend granularity

---

## User Roles

### Employee

Employees can:

* Register
* Log in
* Create service tickets
* View their tickets
* Participate in ticket conversations
* Provide responses when required
* Track ticket progress
* View requester-visible ticket history

### Technician

Technicians can:

* Access assigned service work
* Manage assigned tickets
* Update ticket status
* Communicate with requesters
* Resolve service requests

### Center Manager

Center Managers can manage and monitor resources within their authorized centers.

Capabilities include:

* Ticket management
* User management
* Lab management
* SLA monitoring
* Analytics
* Center-scoped operational visibility

Center Manager analytics and management operations are restricted to authorized centers.

### Administrator

Administrators have system-wide administrative access.

Capabilities include:

* User management
* Center management
* Lab management
* Software management
* Category management
* Ticket management
* SLA policy management
* SLA monitoring
* Analytics
* Audit log access
* System-wide operational visibility

---

## Ticket Lifecycle

Tickets support the following lifecycle states:

```text
OPEN
  ↓
TRIAGED
  ↓
ASSIGNED
  ↓
IN_PROGRESS
  ↓
WAITING_FOR_USER
  ↓
RESOLVED
  ↓
CLOSED
```

Additional terminal/cancellation state:

```text
CANCELLED
```

The system maintains ticket history and assignment history so lifecycle changes remain traceable.

---

## Technology Stack

### Frontend

* React 19
* TypeScript
* Vite
* React Router
* TanStack Query
* Redux Toolkit
* Axios
* React Hook Form
* Zod
* Socket.IO
* Recharts
* Tailwind CSS v3
* Lucide React
* Sonner

### Backend

* Node.js
* Express 5
* TypeScript
* Prisma ORM
* MySQL
* JWT
* bcrypt
* Pino HTTP
* Helmet
* CORS
* Cookie Parser

### Database

```text
MySQL
    │
    └── Prisma ORM
```

---

## System Architecture

The application follows a modular full-stack architecture.

```text
                    ┌─────────────────────┐
                    │      Browser        │
                    │   React Frontend    │
                    └──────────┬──────────┘
                               │
                               │ HTTPS / REST
                               ▼
                    ┌─────────────────────┐
                    │     Express API     │
                    │     Node.js         │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        Authentication      Business         Validation
        Authorization       Modules          & Errors
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       Prisma        │
                    │         ORM         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │        MySQL        │
                    └─────────────────────┘
```

---

## Project Structure

```text
gradious-service-ticket-system/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── ...
│   │
│   ├── src/
│   │   ├── common/
│   │   ├── config/
│   │   ├── generated/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── tickets/
│   │   │   ├── notifications/
│   │   │   ├── catalog/
│   │   │   ├── users/
│   │   │   ├── centers/
│   │   │   ├── labs/
│   │   │   ├── sla/
│   │   │   ├── audit/
│   │   │   └── analytics/
│   │   │
│   │   ├── routes/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── administration/
│   │   │   ├── tickets/
│   │   │   ├── notifications/
│   │   │   └── ...
│   │   │
│   │   ├── lib/
│   │   ├── routes/
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
└── README.md
```

---

## Backend Modules

### Authentication

Responsible for:

* Registration
* Login
* Logout
* Access tokens
* Refresh tokens
* Session management
* Current-user information

### Tickets

Responsible for:

* Ticket creation
* Ticket retrieval
* Ticket updates
* Assignment
* Status transitions
* Comments
* Ticket history
* Resolution
* Cancellation

### Users

Responsible for:

* User management
* Role management
* Active/inactive status
* Center access

### Centers

Responsible for:

* Center creation
* Center updates
* Center activation/deactivation
* Center access management

### Labs

Responsible for:

* Lab management
* Center-to-lab relationships

### Catalog

Responsible for:

* Software
* Categories
* Service catalog relationships

### SLA

Responsible for:

* SLA policies
* SLA monitoring
* SLA status
* Response/resolution tracking

### Notifications

Responsible for application notifications related to service events.

### Audit

Responsible for tracking security-sensitive and administrative actions.

### Analytics

Responsible for aggregating operational metrics from ticket and SLA data.

---

## Frontend Architecture

The frontend follows a feature-oriented architecture.

Example:

```text
features/
└── administration/
    └── analytics/
        ├── api/
        ├── components/
        ├── hooks/
        ├── pages/
        └── types/
```

The Analytics module uses:

* API service layer
* TanStack Query
* Query keys
* Dedicated domain types
* Reusable visualization components
* Filter state management

This keeps API communication, server state, UI components, and page composition separated.

---

## Authentication and Authorization

Authentication is implemented using JWT-based access tokens and refresh-token rotation.

The backend validates the authenticated user before allowing access to protected resources.

Role-based middleware prevents unauthorized access.

Example roles:

```text
EMPLOYEE
TECHNICIAN
CENTER_MANAGER
ADMIN
```

Management endpoints are protected according to role.

For example:

```text
CENTER_MANAGER → authorized center scope
ADMIN          → system-wide scope
```

The frontend hides unavailable functionality for better UX, but backend authorization remains authoritative.

---

## Ticket and Comment Visibility

Ticket communication supports different visibility levels.

### Public Comments

Public comments can be viewed by:

* Requester
* Authorized staff

### Internal Comments

Internal comments are restricted to staff.

Internal comments must never be exposed through employee-facing ticket/history responses.

This separation prevents internal operational information from leaking to requesters.

---

## SLA Management

The SLA system tracks operational service performance.

SLA monitoring includes:

* SLA cycles
* Met SLAs
* Breached SLAs
* Compliance percentage
* First response timestamps
* Resolution timestamps

The analytics dashboard uses SLA outcomes to calculate operational compliance.

Cancelled tickets are excluded from completed SLA-cycle calculations.

---

## Analytics

The Analytics module exposes the following endpoints:

```text
GET /api/v1/analytics/overview

GET /api/v1/analytics/ticket-volume

GET /api/v1/analytics/ticket-trends

GET /api/v1/analytics/by-center

GET /api/v1/analytics/by-category

GET /api/v1/analytics/by-priority

GET /api/v1/analytics/sla-compliance

GET /api/v1/analytics/response-time

GET /api/v1/analytics/resolution-time

GET /api/v1/analytics/technician-workload

GET /api/v1/analytics/resolution-rate
```

Supported filters include:

```text
from
to
centerId
categoryId
priority
granularity
```

Trend granularity:

```text
day
week
month
```

Analytics are scoped according to the authenticated user's role.

---

## API Overview

Base URL during local development:

```text
http://localhost:5000/api/v1
```

### Health

```http
GET /health
```

### Authentication

```http
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

### Tickets

```http
GET    /tickets
POST   /tickets
GET    /tickets/:id
PATCH  /tickets/:id
POST   /tickets/:id/comments
POST   /tickets/:id/assign
```

### Administration

```http
GET    /users
GET    /centers
POST   /centers
PATCH  /centers/:id
GET    /labs
GET    /categories
GET    /software
```

### SLA

```http
GET /sla/monitoring
GET /sla/policies
POST /sla/policies
PATCH /sla/policies/:id
```

### Analytics

```http
GET /analytics/overview
GET /analytics/ticket-volume
GET /analytics/ticket-trends
GET /analytics/by-center
GET /analytics/by-category
GET /analytics/by-priority
GET /analytics/sla-compliance
GET /analytics/response-time
GET /analytics/resolution-time
GET /analytics/technician-workload
GET /analytics/resolution-rate
```

---

## Database

The application uses **MySQL** with Prisma ORM.

Major entities include:

```text
User
Center
UserCenter
Lab
Category
Software
Ticket
Comment
TicketHistory
AssignmentHistory
Notification
AuditLog
```

Tickets maintain relationships with:

* Requester
* Assignee
* Center
* Lab
* Category
* Software

The database also maintains historical records for ticket lifecycle and assignment changes.

---

## Environment Variables

### Backend

Create:

```text
backend/.env
```

Example:

```env
NODE_ENV=development

PORT=5000

DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/gradious_ticket_system"

FRONTEND_URL="http://localhost:5173"

JWT_ACCESS_SECRET="your-access-token-secret"

JWT_REFRESH_SECRET="your-refresh-token-secret"
```

Use strong, unique secrets in production.

Never commit `.env` files to Git.

---

### Frontend

Create:

```text
frontend/.env
```

Example:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Production deployments should use the deployed backend API URL.

---

## Local Development

### Prerequisites

Install:

* Node.js 22+
* MySQL
* npm
* Git

---

### 1. Clone the repository

```bash
git clone <repository-url>
```

```bash
cd gradious-service-ticket-system
```

---

### 2. Backend setup

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Configure:

```text
.env
```

Run Prisma generation:

```bash
npx prisma generate
```

Validate the schema:

```bash
npx prisma validate
```

Apply the database schema/migrations as configured for the environment.

Start the backend:

```bash
npm run dev
```

The API should be available at:

```text
http://localhost:5000
```

Health endpoint:

```text
http://localhost:5000/api/v1/health
```

---

### 3. Frontend setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Configure:

```text
.env
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

## Production Build

### Backend

```bash
cd backend
npm install
npm run build
npm start
```

Before deployment, ensure:

* Production database is configured
* Environment variables are configured
* Prisma client is generated
* Database schema is applied
* Frontend URL is configured correctly

### Frontend

```bash
cd frontend
npm install
npm run build
```

The generated production assets will be placed in:

```text
frontend/dist
```

---

## Security

The application includes several security measures.

### HTTP Security

* Helmet
* CORS configuration
* Disabled `X-Powered-By`
* JSON request-size limits

### Authentication Security

* bcrypt password hashing
* JWT authentication
* Refresh-token rotation
* Refresh-token reuse detection
* Token revocation
* Secure logout handling

### Authorization

* Backend role middleware
* Center-scoped authorization
* Protected management routes
* Resource-level access checks

### Auditability

Security-sensitive and administrative actions can be recorded through audit logs.

### Data Exposure Prevention

Internal ticket comments are separated from requester-visible comments to prevent accidental information disclosure.

---

## Engineering Practices

The project follows several production-oriented engineering principles.

### Backend

* Modular architecture
* Service/controller separation
* Request validation
* Centralized error handling
* Transactional database operations
* Role-based authorization
* Query scoping
* Audit logging
* Structured logging
* API versioning

### Frontend

* Feature-oriented architecture
* Ta
