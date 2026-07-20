# Business DNA Studio

The primary **Business Operating System editor** for Lateen OS — build and maintain organizational DNA, not an admin panel.

## Purpose

Business DNA Studio is where operators define structure (branches, departments, workforce), assets (products, machines, projects), governance (policies, workflows, KPIs), and AI workforce configuration. Visual editors provide drag-and-drop hierarchy and relationship graphs.

## Stack

- **Next.js 15** — App Router, BFF API routes
- **React 19** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** components
- **TanStack Query** — server state
- **Recharts** — analytics charts
- **React Flow** (`@xyflow/react`) — visual editors

## Quick start

```bash
# Start Business DNA Service
pnpm --filter @lateen-os/business-dna-service dev

# Start Business DNA Studio
pnpm --filter @lateen-os/business-dna-studio dev
```

Open http://localhost:3001

Copy `.env.example` to `.env.local` and adjust service URLs if needed.

## Views

| View | Route | Description |
| ---- | ----- | ----------- |
| Dashboard | `/` | Org health, capability coverage, utilization charts |
| Organization | `/organization` | Root organization profile |
| Entity CRUD | `/entities/[key]` | Branches, departments, products, machines, etc. |
| Capabilities | `/entities/capabilities` | Derived from products + machines |

## Visual Editors

| Editor | Route |
| ------ | ----- |
| Organization Chart | `/editors/org-chart` |
| Capability Graph | `/editors/capability-graph` |
| Workflow Designer | `/editors/workflow-designer` |
| Machine Layout | `/editors/machine-layout` |
| Department Hierarchy | `/editors/department-hierarchy` |
| AI Workforce Hierarchy | `/editors/ai-workforce` |

## Integration

| Platform | Integration |
| -------- | ----------- |
| Business DNA Service | CRUD via BFF `/api/business-dna/*` |
| Workflow Engine | Workflow designer uses `@lateen-os/workflow-engine` contracts |
| AI Workforce | Agent hierarchy uses `@lateen-os/ai-workforce` contracts |
| Decision Engine | Approval steps in workflow designer |

## Authentication

Development mode uses dev Bearer tokens:

```
Authorization: Bearer dev:<orgId>:business-dna-studio
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [UI-FLOW.md](./UI-FLOW.md)

## Verification

```bash
pnpm --filter @lateen-os/business-dna-studio build
pnpm --filter @lateen-os/business-dna-studio typecheck
```
