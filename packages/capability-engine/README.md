# @lateen-os/capability-engine

Capability Engine — models what the company is capable of doing, independent of specific machines.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

A **Capability** describes an abstract production ability (e.g. UV printing, laser cutting, on-site installation). Capabilities are:

- **Provided by** one or more [Business DNA machines](https://github.com/lateen-os/business-dna) (`MachineCapability`)
- **Required by** one or more products (`ProductCapability`)
- **Consumed by** one or more services (`ServiceCapability`)

This separates _what we can do_ from _which machine does it_, enabling capacity planning, gap analysis, and intelligence queries without coupling to hardware.

## Scope

| Included | Excluded |
| -------- | -------- |
| Capability aggregate types | UI |
| Relation entity types | API / HTTP |
| Value object interfaces | Database / ORM |
| Domain event types | Business logic |
| Repository port interfaces | Query implementations |
| Query port interfaces | Persistence |

## Usage

```typescript
import {
  capability,
  queries,
  type Capability,
  type CapabilityQueries,
  type MachineCapability,
} from '@lateen-os/capability-engine';

// Namespace access
const cap: capability.Capability = {
  id: '…',
  organizationId: '…',
  code: 'uv_flatbed_print',
  name: 'UV Flatbed Printing',
  category: 'printing',
  status: 'active',
  tags: ['large-format', 'rigid'],
  version: 1,
  createdAt: '2026-07-18T00:00:00.000Z',
  updatedAt: '2026-07-18T00:00:00.000Z',
};

// Query port (implement in infrastructure)
declare const capabilityQueries: CapabilityQueries;
await capabilityQueries.findCapabilitiesByMachine(orgId, machineId);
await capabilityQueries.findMissingCapabilities({ organizationId: orgId });
```

## Structure

```
src/
├── shared/                 # IDs, primitives, events, repository ports
├── capability/             # Capability aggregate root
├── machine-capability/     # Machine → Capability (provides)
├── product-capability/     # Product → Capability (requires)
├── service-capability/     # Service → Capability (consumes)
├── queries/                # Read-side query ports
└── index.ts
```

## Capability categories

| Category | Description |
| -------- | ----------- |
| `printing` | Print production |
| `cutting` | Cut, trim, die-cut |
| `engraving` | Laser / CNC engraving |
| `finishing` | Lamination, mounting, coating |
| `bending` | Metal / material bending |
| `assembly` | Product assembly |
| `packaging` | Packaging and crating |
| `installation` | On-site installation |
| `shipping` | Logistics and delivery |
| `design` | Design and pre-press |

## Dependencies

- `@lateen-os/shared-kernel` — DDD primitives (Entity, DomainEvent, …)
- `@lateen-os/business-dna` — `MachineId`, `ProductId`, `ServiceId`, `OrganizationId`

See [ARCHITECTURE.md](./ARCHITECTURE.md) for diagrams and dependency rules.

## Build

```bash
pnpm --filter @lateen-os/capability-engine build
pnpm --filter @lateen-os/capability-engine typecheck
```
