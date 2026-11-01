# Servora — Multi-Service Booking and Management Platform

Full-stack, responsive web application connecting **customers** with verified **service providers** and platform **administrators**. Built with real PostgreSQL database persistence, atomic order concurrency locks, role-based authorization, historical price preservation, review integrity, and analytics.

---

## Technology Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router 7, Axios, Lucide React icons |
| **Backend** | Node.js, Express.js REST API, Prisma ORM 6, Zod validation, bcryptjs, cookie-parser |
| **Database** | PostgreSQL 18 (Local instance on port `5432` with connection pooling) |
| **Testing** | Vitest automated test suite validating all 16 business rules |

---

## Quick Start & Running Locally

### 1. Database & Environment Configuration

The PostgreSQL connection is configured in `backend/.env`:
```text
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://servora:servora_dev_password@127.0.0.1:5432/servora?schema=public"
SESSION_COOKIE_NAME=servora_session
SESSION_DAYS=7
```

### 2. Seed Database with Realistic Data

Populate users, 10 categories, 22 services, custom provider prices, orders in all lifecycle states, reviews, and payments:

```powershell
npm.cmd run seed --workspace backend
```

### 3. Run Automated Business Rule Tests

Executes all 16 business rule test cases:

```powershell
npm.cmd test --workspace backend
```

### 4. Start the Application

In terminal 1 (API Server on `http://localhost:4000`):
```powershell
npm.cmd run dev:backend
```

In terminal 2 (Vite Frontend on `http://localhost:5173`):
```powershell
npm.cmd run dev:frontend
```

---

## 1-Click Demo Evaluation Credentials

The Login page (`/login`) includes **1-Click Quick Login** buttons for all three roles:

| Role | Email | Password | Capabilities |
| --- | --- | --- | --- |
| **Admin** | `admin@servora.com` | `Admin@123456` | Full platform dashboard, provider verification queue, dynamic category & service creation, order audit history with `OrderEvent` timelines, review moderation. |
| **Customer** | `customer@servora.com` | `Customer@123456` | Browse catalog, book specific providers or open requests, track order status with interactive stepper, cancel bookings, confirm completion, rate & review (1–5 stars). |
| **Provider** | `provider@servora.com` | `Provider@123456` | Review incoming marketplace requests, atomically accept/decline jobs, transition orders (`ACCEPTED` → `IN_PROGRESS` → `COMPLETED`), manage offered services and custom pricing, toggle availability. |

---

## Key Business Rules & Architectural Guarantees

1. **Atomic Concurrency Protection**:
   Provider order acceptance uses database transactions (`prisma.$transaction`) with conditional update locks (`status: PENDING` and `providerId: null`). If multiple providers attempt to accept the same order concurrently, exactly one succeeds and the other receives `HTTP 409 Conflict`.
2. **Historical Price Snapshotting**:
   Orders permanently store snapshots of the service name and agreed price at the moment of booking (`serviceNameSnapshot` and `servicePrice`). Subsequent catalog base rate updates never alter historical invoices, receipts, or provider earnings.
3. **Audit History Log**:
   Every lifecycle transition records an entry in the `OrderEvent` table with actor identification, timestamp, status delta, and notes.
4. **Authentic Verified Reviews**:
   Customers can only rate providers (1 to 5 stars) for orders that have transitioned to `COMPLETED`. Duplicate reviews for the same order are strictly blocked by unique database constraints.
5. **Role-Based Isolation**:
   Server-side middleware enforces strict access control (`requireRole`, `requireApprovedProvider`). Customers cannot view another customer's orders, unapproved providers cannot accept jobs, and admin accounts cannot be created via public registration.

---

## REST API Reference

### Health & Auth
- `GET /api/health` — PostgreSQL and API connectivity health-check.
- `POST /api/auth/register` — Onboard Customer or Provider (admin role strictly blocked).
- `POST /api/auth/login` — Session cookie generation.
- `POST /api/auth/logout` — Invalidate session and clear cookie.
- `GET /api/auth/me` — Retrieve authenticated user and profile state.
- `PUT /api/auth/profile` — Update basic user details.

### Catalog & Directory
- `GET /api/categories` — Active categories with service counts.
- `GET /api/services` — Filterable service listings (search, category, price).
- `GET /api/services/:id` — Service details with list of approved providers and custom rates.
- `GET /api/providers` — Verified local providers directory.
- `GET /api/providers/:id` — Provider profile, ratings, offered services, and customer reviews.

### Customer Bookings
- `POST /api/orders` — Create new booking with snapshot pricing.
- `GET /api/orders/my-orders` — Customer booking history with status filters.
- `GET /api/orders/:id` — Detailed order view with interactive timeline.
- `POST /api/orders/:id/cancel` — Customer cancellation with reason.
- `POST /api/orders/:id/confirm` — Customer marks service fulfilled.
- `POST /api/orders/:id/dispute` — Flag order for administrative dispute.

### Provider Hub
- `GET /api/provider/dashboard` — Live PostgreSQL earnings, job counts, rating score.
- `GET /api/provider/orders/available` — Pending orders matching offered services.
- `GET /api/provider/orders` — Assigned orders.
- `POST /api/provider/orders/:id/accept` — Atomic concurrency-protected acceptance.
- `POST /api/provider/orders/:id/reject` — Decline order offer.
- `POST /api/provider/orders/:id/start` — Mark service in progress.
- `POST /api/provider/orders/:id/complete` — Mark service completed.
- `GET /api/provider/services` — Custom catalog listings and prices.
- `POST /api/provider/services` — Add offering from system catalog.
- `PUT /api/provider/services/:id` — Update custom price or toggle active.
- `DELETE /api/provider/services/:id` — Remove offering.
- `PUT /api/provider/profile` — Update business name, bio, service area, availability.

### Reviews
- `POST /api/reviews/orders/:id/review` — Submit 1-5 star rating & feedback for completed order.
- `GET /api/reviews/my-reviews` — Customer review history.
- `POST /api/reviews/:id/report` — Report review for moderation.

### Admin Console
- `GET /api/admin/dashboard` — Platform KPIs, category demand, status distributions.
- `GET /api/admin/users` — Paginated user directory with search and role filters.
- `PATCH /api/admin/users/:id/status` — Toggle user active / suspended.
- `GET /api/admin/providers` — Provider verification queue.
- `PATCH /api/admin/providers/:id/status` — Approve, reject, suspend, or reactivate provider.
- `GET /api/admin/categories` & `POST /api/admin/categories` — Dynamic category management.
- `PATCH /api/admin/categories/:id` — Edit category description and active state.
- `GET /api/admin/services` & `POST /api/admin/services` — Create/edit master catalog services.
- `PATCH /api/admin/services/:id` — Update service rate and category.
- `GET /api/admin/orders` — Master orders ledger with search & filters.
- `GET /api/admin/orders/:id/events` — Chronological `OrderEvent` audit trail.
- `GET /api/admin/reviews` & `PATCH /api/admin/reviews/:id/moderate` — Review moderation queue.
- `GET /api/admin/reports` — Provider leaderboard and financial metrics.
