# CEO Cockpit

Executive command center for Lateen OS — the primary interface for executives.

**Port:** 3002  
**Package:** `@lateen-os/ceo-cockpit`

## Purpose

CEO Cockpit visualizes the entire enterprise. It contains **no business logic** — only orchestration and visualization via BFF routes that aggregate data from platform services.

## Quick Start

```bash
# From repo root — ensure backend services are running
pnpm --filter @lateen-os/ceo-cockpit dev
```

Open [http://localhost:3002](http://localhost:3002)

## Environment

Copy `.env.example` to `.env.local`:

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `LATEEN_ORG_ID` | `00000000-0000-4000-8000-000000000001` | Organization context |
| `LATEEN_AUTH_SUBJECT` | `ceo-cockpit` | Dev auth subject |
| `NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL` | `http://localhost:4001` | Business DNA Service |
| `NEXT_PUBLIC_LATEEN_PRODUCT_DISCOVERY_BASE_URL` | `http://localhost:4002` | Product Discovery |
| `NEXT_PUBLIC_LATEEN_IDENTITY_BASE_URL` | `http://localhost:4003` | Identity Service |
| `NEXT_PUBLIC_LATEEN_AI_PM_BASE_URL` | `http://localhost:3000` | AI Product Manager BFF |

## Views

| Route | View |
| ----- | ---- |
| `/` | Executive Dashboard (drag & drop widgets) |
| `/health` | Company Health |
| `/organization` | Organization Graph |
| `/business-dna` | Business DNA snapshot |
| `/missions` | Mission Control |
| `/workforce` | AI Workforce |
| `/workflows` | Workflow Monitor |
| `/decisions` | Decision Center |
| `/memory` | Institutional Memory |
| `/capabilities` | Capabilities |
| `/products` | Products |
| `/customers` | Customers |
| `/operations` | Operations |
| `/finance` | Finance Overview |
| `/risk` | Risk Center |
| `/audit` | Audit Center |
| `/observability` | Platform Health |

## Integrations

- Business DNA Service (4001)
- Identity Service (4003)
- Product Discovery (4002)
- AI Product Manager BFF (3000) — missions & decisions
- Workflow Engine, Decision Engine, Institutional Memory — via aggregation

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [UI-FLOW.md](./UI-FLOW.md).

## Verification

```bash
pnpm --filter @lateen-os/ceo-cockpit build
pnpm --filter @lateen-os/ceo-cockpit typecheck
```
