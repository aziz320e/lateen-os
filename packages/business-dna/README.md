# @lateen-os/business-dna

Business DNA Engine — canonical domain model for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 Locked** and the [Business DNA schema](../../domains/business-dna/schema/).

## Scope

| Included | Excluded |
| -------- | -------- |
| Type definitions | UI |
| Value object interfaces | API |
| Domain event types | Database |
| Repository port interfaces | ORM |
| | Business logic |
| | Persistence implementations |

## Usage

```typescript
import {
  organization,
  product,
  type Organization,
  type AiAgent,
  type ProductRepository,
} from '@lateen-os/business-dna';
```

## Structure

```
src/
├── shared/          # Kernel: IDs, primitives, enums, events, repository ports
├── organization/    # Aggregate root — Lateen AI-first org
├── branch/
├── department/
├── employee/
├── customer/        # B2B, contracts, recurring orders (Enrichment v1)
├── supplier/
├── product/         # Manufacturing, trends, AI metadata (Enrichment v1)
├── service/
├── machine/         # Print & manufacturing equipment (Enrichment v1)
├── project/         # Signage, branding, rollouts (Enrichment v1)
├── quotation/
├── order/
├── invoice/
├── workflow/
├── policy/
├── kpi/
├── asset/
├── agent/           # AI Workforce — Reactive + Proactive (events: ai_agent.*)
├── role/            # Authorization — permission bundles
├── permission/      # Authorization — granular access rules
└── index.ts
```

Each aggregate module exports:

- `types` — aggregate interface, enums, status types
- `value-objects` — composable value objects (where applicable)
- `events` — typed domain events (`{entity}.{action}`)
- `repository` — persistence port interface

## Schema coverage

| Schema entity | Package module | Notes |
| ------------- | -------------- | ----- |
| Organization | `organization` | Enrichment v1 |
| Branch | `branch` | |
| Department | `department` | |
| Employee | `employee` | |
| Role | `role` | |
| Permission | `permission` | |
| Customer | `customer` | Enrichment v1 |
| Supplier | `supplier` | |
| Product | `product` | Enrichment v1 |
| Service | `service` | |
| Machine | `machine` | Enrichment v1 |
| Project | `project` | Enrichment v1 |
| Quotation | `quotation` | |
| Order | `order` | |
| Invoice | `invoice` | |
| Asset | `asset` | |
| Workflow | `workflow` | |
| Policy | `policy` | |
| KPI | `kpi` | |
| AI Agent | `agent` | Type alias: `AiAgent`; events use `ai_agent.*` |

## Build

```bash
pnpm --filter @lateen-os/business-dna build
pnpm --filter @lateen-os/business-dna typecheck
```
