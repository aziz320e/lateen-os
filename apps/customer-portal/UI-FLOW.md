# Customer Portal — UI Flow

## Auth Flow

1. User visits `/login`
2. Submits username/password → `POST /api/auth/login`
3. BFF calls Identity Service, resolves customer by email
4. Sets httpOnly cookies (access, refresh, customerId)
5. Redirect to `/dashboard`

## Navigation

```
Customer Portal
├── Dashboard
├── Projects → /projects/[id]
├── Orders
├── Quotations (approve/reject)
├── Invoices
├── Production
├── Files (upload/download)
├── Approvals
├── Messages
├── AI Assistant
├── Notifications
└── Settings (profile, theme, prefs)
```

## Dashboard

Single `GET /api/dashboard` loads: open projects, pending quotations, running orders, invoices due, production status, activity, notifications, deliveries.

## Quotation Approval

1. Customer views `/quotations`
2. Pending items show Approve / Reject buttons
3. `POST /api/quotations` proxies status update to Business DNA (ownership verified)

## Theme

Light / Dark / System via `next-themes` in Settings and sidebar toggle.
