# CEO Cockpit — Architecture Report (Epic 13)

> **Date:** 2026-07-19  
> **Status:** Complete  
> **Architecture:** Lateen OS v1.0 (Locked)

## Executive summary

Epic 13 delivers the **CEO Cockpit** — the executive command center for Lateen OS at `apps/ceo-cockpit` (port **3002**). The application visualizes the entire enterprise with **no business logic** — only BFF orchestration and read-only aggregation from existing platform services.

**No new platform packages or services were created.**

## Deliverables

| Item | Status |
| ---- | ------ |
| `apps/ceo-cockpit/` | Done |
| 17 executive views | Done |
| BFF routes (dashboard, health, missions, workforce, decisions, etc.) | Done |
| Drag & drop dashboard with saved layouts | Done |
| React Flow organization graph | Done |
| Notification alerts | Done |
| README, ARCHITECTURE, UI-FLOW | Done |
| `pnpm build` | Passed |
| `pnpm typecheck` | Passed |

## Views

Executive Dashboard, Company Health, Business DNA, Mission Control, AI Workforce, Workflow Monitor, Decision Center, Institutional Memory, Capabilities, Products, Customers, Operations, Finance Overview, Risk Center, Audit Center, Observability, Organization

## Integrations

| Service | Port | Usage |
| ------- | ---- | ----- |
| Business DNA Service | 4001 | Org, entities, agents, workflows, policies |
| Product Discovery | 4002 | Runs, recommendations, platform health |
| Identity Service | 4003 | Health probe |
| AI Product Manager | 3000 | Missions, decisions (BFF proxy) |

## BFF Routes

- `GET /api/dashboard` — master aggregation
- `GET /api/platform/health` — services + infra probes
- `GET /api/organization`, `/api/missions`, `/api/workforce`, `/api/decisions`, `/api/workflows`, `/api/memory`, `/api/notifications`
- `* /api/business-dna/[...path]` — catch-all proxy

## Verification

```bash
pnpm --filter @lateen-os/ceo-cockpit build
pnpm --filter @lateen-os/ceo-cockpit typecheck
pnpm --filter @lateen-os/ceo-cockpit dev   # http://localhost:3002
```

## Architectural boundaries

CEO Cockpit does not execute missions, modify Business DNA, run discovery, or make decisions. It is a Layer 6 read-only visualization application.
