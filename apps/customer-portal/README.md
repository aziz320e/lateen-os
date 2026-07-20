# Customer Portal

First customer-facing application for Lateen OS — secure access to projects, quotations, orders, invoices, and more.

**Port:** 3003  
**Package:** `@lateen-os/customer-portal`

## Quick Start

```bash
pnpm --filter @lateen-os/customer-portal dev
```

Open [http://localhost:3003](http://localhost:3003)

## Dev Mode

Set `LATEEN_CUSTOMER_ID` in `.env.local` to browse without Identity Service login:

```env
LATEEN_CUSTOMER_ID=<your-customer-uuid>
LATEEN_ORG_ID=00000000-0000-4000-8000-000000000001
```

## Authentication

Uses **Identity Service** (port 4003):

- Login / Logout / Refresh token / Remember me
- httpOnly cookies set by BFF (tokens never exposed to browser JS)
- Customer linked via email match to Business DNA customer record

## Sections

Dashboard · Projects · Orders · Quotations · Invoices · Production · Files · Approvals · Messages · AI Assistant · Notifications · Settings

## Verification

```bash
pnpm --filter @lateen-os/customer-portal build
pnpm --filter @lateen-os/customer-portal typecheck
pnpm --filter @lateen-os/customer-portal test
```

See [ARCHITECTURE.md](./ARCHITECTURE.md), [UI-FLOW.md](./UI-FLOW.md), [SECURITY.md](./SECURITY.md), [API.md](./API.md).
