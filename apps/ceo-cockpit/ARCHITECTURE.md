# CEO Cockpit — Architecture

> Layer 6 Executive Application — Lateen OS v1.0

## Principles

1. **No business logic** — visualization and orchestration only
2. **BFF pattern** — browser never calls backend services directly
3. **Read-heavy** — aggregates existing platform data
4. **Reuse platform** — no new packages or services

## Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind, shadcn/ui-style components |
| State | TanStack Query |
| Charts | Recharts |
| Graphs | React Flow (`@xyflow/react`) |
| Dashboard | react-grid-layout (drag & drop, saved layouts) |

## Data Flow

```
Browser → CEO Cockpit BFF (/api/*) → Platform Services
                                    → AI PM BFF (missions)
```

## BFF Routes

| Route | Source |
| ----- | ------ |
| `GET /api/dashboard` | Master executive aggregation |
| `GET /api/platform/health` | All services + infra probes |
| `GET /api/organization` | Business DNA org snapshot |
| `GET /api/missions` | AI Product Manager BFF |
| `GET /api/workforce` | Business DNA agents → worker views |
| `GET /api/decisions` | AI PM + Discovery recommendations |
| `GET /api/workflows` | Business DNA workflows |
| `GET /api/memory` | Aggregated memory entries |
| `GET /api/notifications` | Derived alerts |
| `GET /api/discovery/summary` | Product Discovery |
| `* /api/business-dna/[...path]` | Catch-all BDS proxy |

## View Mappers

`src/lib/api/view-mappers.ts` transforms platform entities into executive views:

- Agents → AI Worker views (status, productivity)
- Workflows → Workflow monitor views
- Missions + Decisions + Recommendations → Institutional Memory entries
- Missions + Decisions → Notifications

## Dashboard Widgets

Executive dashboard uses `react-grid-layout` with:

- Drag & drop repositioning
- Resizable panels
- Layout persistence via `localStorage`

## Port Assignment

| App | Port |
| --- | ---- |
| AI Product Manager | 3000 |
| Business DNA Studio | 3001 |
| **CEO Cockpit** | **3002** |

## Boundaries

CEO Cockpit does **not**:

- Execute missions
- Modify Business DNA
- Run discovery workflows
- Make decisions

Those remain in their respective platform layers.
