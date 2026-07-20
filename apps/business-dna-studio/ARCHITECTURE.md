# Business DNA Studio — Architecture

Architecture v1.0 — locked for Epic 9.

## Overview

Business DNA Studio is a Next.js application that serves as the **Business Operating System editor**. It provides CRUD for all Business DNA entities, visual graph editors, validation, and impact analysis — proxied through a BFF layer to the Business DNA Service.

```
┌─────────────────────────────────────────────────────────────┐
│                  Business DNA Studio (:3001)                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Entity CRUD │  │ Visual       │  │ Dashboard + Charts │  │
│  │ (17 views)  │  │ Editors (6)  │  │ (Recharts)         │  │
│  └──────┬──────┘  └──────┬───────┘  └─────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          ▼                                   │
│              TanStack Query + BFF API Routes                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
  Business DNA      Workflow Engine     AI Workforce
  Service (:4001)   (contracts)         (contracts)
                           │
                    Decision Engine
                    (policy/approval)
```

## Layer Structure

### Presentation (`src/app`, `src/components`)

- **App Shell** — sidebar navigation with entity registry + editor routes
- **Entity pages** — generic `EntityPage` driven by `ENTITY_DEFINITIONS`
- **Visual editors** — React Flow canvases for hierarchy and graphs
- **Dashboard** — aggregated metrics from studio dashboard BFF

### BFF (`src/app/api`)

| Route | Purpose |
| ----- | ------- |
| `/api/business-dna/[...path]` | Proxy to Business DNA Service `/api/v1/*` |
| `/api/studio/dashboard` | Aggregated org + entity counts |
| `/api/studio/validate` | Client-side validation rules |
| `/api/studio/impact` | Dependency / impact analysis |

### Client (`src/lib`)

- `entities.ts` — entity registry (17 entities, 6 editors)
- `api/client.ts` — TanStack Query fetch helpers
- `auth.ts` — dev Bearer token headers

## Entity Registry

Entities map to Business DNA Service tenant routes:

| Key | BDS Path | Listable |
| --- | -------- | -------- |
| organization | organizations | no |
| branches | branches | yes |
| departments | departments | yes |
| employees | employees | no |
| roles | roles | no |
| permissions | permissions | no |
| customers | customers | yes |
| suppliers | suppliers | no |
| products | products | yes |
| services | services | no |
| machines | machines | yes |
| projects | projects | yes |
| policies | policies | no |
| workflows | workflows | no |
| kpis | kpis | no |
| assets | assets | no |
| agents | agents | yes |

Capabilities are **derived** from products and machines (no direct BDS entity).

## Visual Editors

| Editor | Data Source | Interaction |
| ------ | ----------- | ----------- |
| Organization Chart | Dashboard aggregate | Drag nodes |
| Capability Graph | Products + machines | Relationship edges |
| Workflow Designer | Local state + workflow-engine types | Add steps |
| Machine Layout | Machines grid | Drag layout |
| Department Hierarchy | Departments tree | Drag hierarchy |
| AI Workforce Hierarchy | Agents | Tree from root |

## Platform Packages

Workspace dependencies (contracts only at v1.0):

- `@lateen-os/business-dna` — domain types
- `@lateen-os/workflow-engine` — workflow step/transition model
- `@lateen-os/ai-workforce` — agent/workforce types

## Security

- Organization scoping via `LATEEN_ORG_ID` and `X-Organization-Id` header
- BFF never exposes service URLs to browser for server-only env vars
- Keycloak-ready auth subject via `LATEEN_AUTH_SUBJECT`

## Port Assignment

| App | Port |
| --- | ---- |
| AI Product Manager | 3000 |
| Business DNA Studio | 3001 |
| Business DNA Service | 4001 |
