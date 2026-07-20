# Customer Portal — Architecture

> Layer 6 Customer Application — Lateen OS v1.0

## Principles

1. **No business logic** — BFF orchestration and visualization only
2. **No duplicate domain models** — types from `@lateen-os/business-dna`
3. **Tenant isolation** — customers see only their own data
4. **Reuse platform** — Identity, Business DNA, Workflow, Decision, AI Runtime

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind · shadcn/ui · TanStack Query · React Hook Form · Zod · Recharts · next-themes

## Data Flow

```
Browser → Customer Portal BFF → Identity Service (auth)
                              → Business DNA Service (data)
```

## Customer Scoping

Every data route:

1. Resolves `customerId` from cookie (post-login) or `LATEEN_CUSTOMER_ID` (dev)
2. Fetches org-scoped entities from Business DNA
3. Filters with `filterByCustomer()` before returning
4. Verifies ownership on single-entity reads

## BFF Routes

| Route | Purpose |
| ----- | ------- |
| `POST/DELETE /api/auth/login` | Login / logout |
| `POST /api/auth/refresh` | Token refresh |
| `GET /api/auth/me` | Session user |
| `GET /api/dashboard` | Dashboard aggregation |
| `GET /api/projects` | Customer projects |
| `GET /api/orders` | Customer orders |
| `GET/POST /api/quotations` | List + approve/reject |
| `GET /api/invoices` | Customer invoices |
| `GET/POST /api/files` | Files + upload |
| `GET /api/messages` | Project discussions |
| `GET /api/notifications` | Alerts |
| `GET /api/profile` | Customer profile |
| `POST /api/assistant` | Customer-safe AI |
| `GET /api/approvals` | Approval queue |
| `GET /api/production` | Production status |

## AI Assistant

Answers only from scoped customer data (projects, orders, quotations). Never exposes internal organizational data.

## Port

| App | Port |
| --- | ---- |
| Customer Portal | **3003** |
