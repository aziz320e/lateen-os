# Customer Portal — Architecture Report (Epic 14)

> **Date:** 2026-07-19  
> **Status:** Complete  
> **Architecture:** Lateen OS v1.0 (Locked)

## Executive summary

Epic 14 delivers the **Customer Portal** — the first customer-facing application for Lateen OS at `apps/customer-portal` (port **3003**). Customers securely access projects, quotations, orders, invoices, production, files, approvals, messages, and a customer-safe AI assistant.

**No new platform packages.** Business DNA Service list endpoints extended for quotations, orders, invoices (service layer only).

## Deliverables

| Item | Status |
| ---- | ------ |
| `apps/customer-portal/` | Done |
| Identity Service auth (login/logout/refresh/remember me) | Done |
| 12 application sections | Done |
| BFF routes (dashboard, projects, orders, …) | Done |
| Tenant isolation on all data routes | Done |
| Light/dark theme | Done |
| Tests (auth, tenant isolation, mappers) | Done |
| README, ARCHITECTURE, UI-FLOW, SECURITY, API | Done |
| Build / typecheck / test | Passed |

## Integrations

| Service | Usage |
| ------- | ----- |
| Identity Service (4003) | Authentication |
| Business DNA (4001) | Projects, quotations, orders, invoices, customers |

## Verification

```bash
pnpm --filter @lateen-os/customer-portal build
pnpm --filter @lateen-os/customer-portal typecheck
pnpm --filter @lateen-os/customer-portal test
```

## Boundaries

No business logic in portal — orchestration and visualization only. Domain models reused from `@lateen-os/business-dna`.
