# OmniServe — International Community Delivery & Services Platform

OmniServe is a full-stack marketplace and on-demand delivery platform built for local and international expansion. It connects customers with verified service professionals, drivers, merchants and local stores through a unified account, order and operations system.

The current implementation is a **React + Vite + TypeScript frontend**, an **Express + TypeScript API**, **Prisma/PostgreSQL** persistence, and **Supabase Auth**. The system keeps the existing provider/customer marketplace flow while adding account settings, notifications, auditability, administration and transactional email infrastructure.

---

## 1. Product model

### Customer
Customers can:
- Discover verified service professionals.
- Book a professional.
- Order from local stores.
- Request transport/cargo.
- Track active orders.
- View order history.
- Receive in-app notifications.
- Manage profile, preferences and security.

### Provider
Providers can:
- Register through Supabase Auth.
- Confirm their email.
- Create a provider workspace automatically after first confirmed sign-in.
- Maintain their customer-facing service listing.
- Set availability.
- Receive and update service jobs.
- See verification state.

A provider is **not visible to customers until `VerifiedPro.isVerified` is true**. This prevents unverified registrations from leaking into the public marketplace.

### Driver
Drivers have their own dashboard and order assignment model. Driver identity and verification fields live in the `Driver` model.

### Merchant / store
Stores and store inventory are represented by `LocalStore` and `StoreItem`. Store deliveries use the same `Order` lifecycle.

### Administrator
Admins have access to the control plane for:
- Users and roles.
- Providers.
- Orders.
- Email jobs.
- Email templates.
- Audit events.
- System settings.

---

## 2. Architecture

```text
Browser
  │
  ├── React 19 + Vite + TypeScript
  │      ├── AuthContext
  │      ├── ThemeContext
  │      ├── Customer portal
  │      ├── Provider dashboard
  │      ├── Driver dashboard
  │      ├── Merchant dashboard
  │      ├── Account settings
  │      ├── Notification center
  │      └── Admin control plane
  │
  └── Supabase Auth access token
             │
             ▼
Express API
  │
  ├── Hybrid authentication
  ├── Role authorization
  ├── Orders
  ├── Services / providers
  ├── Stores / catalog
  ├── Drivers
  ├── Account
  └── Admin
             │
             ▼
Prisma ORM
             │
             ▼
PostgreSQL / Supabase Postgres

Email queue ──► transactional provider (Resend)
Audit events ──► PostgreSQL
Notifications ──► PostgreSQL + polling UI
```

---

## 3. Important directories

```text
community-delivery/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── seed.js
│   └── seed-platform.mjs
│
├── server/
│   ├── account.ts
│   ├── admin.ts
│   ├── catalog.ts
│   ├── drivers.ts
│   ├── orders.ts
│   ├── services.ts
│   ├── stores.ts
│   ├── users.ts
│   ├── uploads.ts
│   └── lib/
│       ├── audit.ts
│       ├── emailQueue.ts
│       ├── hybridAuth.ts
│       ├── notifications.ts
│       ├── orderRules.ts
│       ├── supabaseAdmin.ts
│       └── mappers.ts
│
├── src/
│   ├── App.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── components/
│   │   ├── NotificationCenter.tsx
│   │   ├── Navbar.tsx
│   │   ├── ProviderDashboard.tsx
│   │   └── ...
│   └── pages/
│       ├── AccountSettings.tsx
│       ├── AdminDashboard.tsx
│       ├── ProviderSignup.tsx
│       └── tenant/
│
├── server.ts
├── package.json
├── tsconfig.json
├── tsconfig.server.json
└── .env.example
```

---

# 4. Authentication and authorization

Supabase Auth is the primary authentication system.

The browser obtains a Supabase session and sends:

```http
Authorization: Bearer <access-token>
```

The API validates the token through `server/lib/supabaseAdmin.ts`.

For backwards compatibility, the API can also validate the existing local JWT cookie/session path. New application functionality should use Supabase Auth.

### Roles

```text
tenant
provider
driver
merchant
admin
```

Authorization is enforced server-side. Hiding a button in React is not considered authorization.

### Provider registration

Provider registration stores important onboarding metadata in Supabase `user_metadata`:

```text
name
role
phone
licenseNumber
vehicle
category
```

After email confirmation and successful sign-in, `/api/services/ensure` creates or completes the provider workspace.

---

# 5. Provider → customer synchronization

`VerifiedPro` is the authoritative service listing.

### Customer

```http
GET /api/services
```

Customers receive verified providers only.

### Provider

```http
GET   /api/services/mine
POST  /api/services/ensure
POST  /api/services
PATCH /api/services/:id
```

A provider can edit their listing, including:

- title
- hourly rate
- phone
- service area
- years of experience
- specialties
- biography

The customer application refreshes marketplace provider data periodically while visible. Orders store the exact `VerifiedPro.id`, so both sides reference the same provider record.

---

# 6. Order lifecycle

The canonical order states are:

```text
pending
assigned
en_route
arrived
in_progress
completed
cancelled
```

The API prevents normal status changes from moving backwards.

Every significant order transition also creates an `OrderEvent`.

Notifications are generated for important customer/provider events such as:

- order creation
- provider assignment
- order status changes

---

# 7. Account platform

The account API is under `/api/account`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/account/me` | Profile + preferences |
| PATCH | `/api/account/profile` | Update profile |
| GET | `/api/account/preferences` | Load preferences |
| PATCH | `/api/account/preferences` | Save preferences |
| GET | `/api/account/notifications` | Notification inbox |
| POST | `/api/account/notifications/:id/read` | Mark one read |
| POST | `/api/account/notifications/read-all` | Mark all read |
| GET | `/api/account/notification-preferences` | Notification channels |
| PATCH | `/api/account/notification-preferences/:type` | Channel preferences |
| POST | `/api/account/password` | Server-side password update |
| POST | `/api/account/email-change` | Request confirmed email change |
| DELETE | `/api/account` | Delete Auth account |

The `/settings` frontend contains:

- profile
- phone
- timezone
- locale
- currency
- theme
- email preferences
- push preference
- password update
- email change
- account deletion

---

# 8. Theme system

Themes are:

```text
system
light
dark
```

`ThemeContext` applies the theme immediately in the browser and persists the preference through `/api/account/preferences` when a user is authenticated.

System mode listens for OS color-scheme changes.

---

# 9. Notifications

Notifications are stored in PostgreSQL rather than only in browser memory.

The `Notification` model supports:

```text
id
userId
type
title
message
data
readAt
createdAt
```

`NotificationPreference` controls:

```text
inApp
email
push
```

The frontend notification center polls while the application is visible. This is deliberately simple and reliable for the current platform. Supabase Realtime/WebSockets can be added later without changing the persistence model.

---

# 10. Transactional email

Email is database-backed.

```text
Application event
      ↓
EmailJob
      ↓
Email worker
      ↓
Resend
      ↓
Recipient
```

`EmailJob` records:

- recipient
- template
- payload
- attempt count
- status
- provider message ID
- failure reason
- scheduling time

Statuses:

```text
pending
processing
sent
failed
dead_letter
```

Retries use exponential backoff and eventually enter `dead_letter`.

### Templates

Templates are stored in `EmailTemplate` and seeded with:

```text
admin_test
provider_welcome
security_alert
```

HTML interpolation escapes user-controlled values to reduce injection risk.

### Production email

Configure a transactional provider and authenticate your sending 