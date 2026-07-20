# AI Product Manager

The first production **AI Worker** application for Lateen OS — a Next.js dashboard for the Product Manager AI agent.

## Purpose

Continuously discover profitable manufacturable products. The agent **does not execute changes** — it submits recommendations to the Decision Engine for human approval.

## Stack

- **Next.js 15** — App Router, BFF API routes
- **React 19** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** components
- **TanStack Query** — server state
- **Recharts** — analytics charts

## Quick start

```bash
# Start platform services (Business DNA + Product Discovery)
pnpm --filter @lateen-os/business-dna-service dev
pnpm --filter @lateen-os/product-discovery-service dev

# Start AI Product Manager
pnpm --filter @lateen-os/ai-product-manager dev
```

Open http://localhost:3000

Copy `.env.example` to `.env.local` and adjust service URLs if needed.

## Features

| View | Description |
| ---- | ----------- |
| Dashboard | KPIs, charts, runtime status, platform health |
| Discovery Runs | Pipeline executions with stage progress |
| Recommendations | Approve/reject manufacturable opportunities |
| Trend Signals | Market signals from 8 sources |
| Capability Matches | Manufacturing alignment scores |
| Profit Estimates | ROI and margin projections |
| Decision Status | Pending, waiting, approved, rejected |
| AI Activity | Runtime tasks and activity timeline |

## Integration

| Service | Integration |
| ------- | ----------- |
| Business DNA | Products, machines, agents via BFF `/api/business-dna/*` |
| Product Discovery | Runs, recommendations via BFF `/api/discovery/*` |
| Decision Engine | Approve/reject via BFF `/api/decisions` (submits to engine flow) |
| AI Runtime | Task history derived from discovery runs |

## Authentication

Keycloak-ready via environment variables. Development mode uses dev Bearer tokens:

```
Authorization: Bearer dev:<orgId>:ai-product-manager
```

Set `KEYCLOAK_ENABLED=true` when wiring Keycloak session tokens.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [UI-FLOW.md](./UI-FLOW.md)

## Verification

```bash
pnpm --filter @lateen-os/ai-product-manager build
pnpm --filter @lateen-os/ai-product-manager typecheck
```
