# @lateen-os/inventory-engine

Inventory Engine — inventory catalog, warehouse management, inventory stock, inventory movements, stock valuation, inventory counting, and procurement preparation for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Inventory Engine is the canonical inventory-management layer for Lateen OS: it owns the Inventory Catalog (items, categories, brands), Warehouse Management (warehouses, zones, storage locations, bins), Inventory Stock (stock levels, available/reserved/damaged quantities), Inventory Movements (receive/issue/transfer/adjustment/return/reservation/release, each generating immutable history), Stock Valuation (deterministic FIFO and Weighted Average costing), Inventory Counting (cycle/full counts with variance and reconciliation), and Procurement Preparation (deterministic reorder suggestions and shortage detection, never a purchasing workflow) — and is the package that integrates Finance Engine, Sales Engine, Business DNA, Workflow Engine, Communication Hub, Analytics Engine, and Institutional Memory on behalf of the inventory domain, exclusively through each package's public API.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, **no LLM anywhere in this package** (every calculation — available/reorder-point/minimum/maximum checks, FIFO consumption, weighted-average blending, count variance — is fixed arithmetic over decimal-string quantities, not model inference)
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createInventoryRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Inventory Catalog | `item` | Items (SKU, barcode, serial number, batch number, unit of measure), categories, brands; full lifecycle: create / update / activate / deactivate / archive / restore |
| Warehouse Management | `warehouse` | Warehouses, zones, storage locations, bins, deterministic remaining-capacity calculation; lifecycle: create / update / archive / restore |
| Inventory Stock | `stock` | Stock levels — available/reserved/damaged quantity, minimum/maximum stock, reorder point — all deterministic calculations |
| Inventory Movements | `movement` | receive / issue / transfer / adjustment / return / reservation / release, each generating exactly one immutable `MovementRecord` |
| Stock Valuation | `valuation` | Deterministic FIFO (oldest-layer-first consumption) and Weighted Average costing. **Never implements accounting** — only Finance Engine, called via the Relationship Layer, ever posts a ledger entry |
| Inventory Counting | `counting` | Cycle counts and full counts, deterministic variance, and reconciliation via a real Inventory Movements adjustment |
| Procurement Preparation | `procurement` | Deterministic reorder suggestions, purchase-request generation, and shortage detection. **No purchasing workflow** — data and recommendations only |
| Relationship Layer | `relationship-management` | Integrates Finance Engine, Sales Engine, Business DNA, Workflow Engine, Communication Hub, Analytics Engine, and Institutional Memory — see below |
| Query Layer | `queries` | Real, read-only `InventoryQueries` port — `findItems` / `findWarehouses` / `findInventory` / `findMovements` / `findReservations` / `findValuations` / `findCounts` / `searchInventory` |
| Event Bus | `events` | Typed `InventoryEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with Finance Engine, Sales Engine, Business DNA, Workflow Engine, Communication Hub, Analytics Engine, and Institutional Memory

Per the architecture rules, this package integrates with sibling packages **only through their public APIs** — never a repository, never a modification to those packages. Each of the 7 required packages has a real, genuine integration point in `relationship-management`:

- **Finance Engine** — `recordInventoryValuationEntry()` composes a real, posted Finance Engine journal entry (`generalLedger.createJournalEntry()` + `postJournalEntry()`) for an inventory valuation movement. This is the only place the Inventory Engine touches accounting, and it never implements the accounting itself — it only calls Finance Engine's own public GL API. Optional — injected as `Pick<FinanceRuntime, 'generalLedger'>`.
- **Sales Engine** — `getOpportunityContext()` fetches a real Sales Engine opportunity via `opportunities.get()`. Optional — injected as `Pick<SalesRuntime, 'opportunities'>`.
- **Business DNA** — `getProductContext()` fetches a real Business DNA catalog product via `products.getProduct()`. Optional — injected as `Pick<BusinessDnaRuntime, 'products'>`.
- **Workflow Engine** — `raiseInventoryApprovalWorkflow()` composes real `defineWorkflow()` + `startWorkflow()` to start a genuine inventory-approval workflow instance (e.g. a purchase approval). Optional — injected as `Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`.
- **Communication Hub** — `notifyInventoryEvent()` creates and sends a real Communication Hub `'escalation'` notification. Optional — injected as `Pick<CommunicationRuntime, 'notifications'>`.
- **Analytics Engine** — `recordInventoryValueMetric()` records a real gauge metric snapshot via `metrics.recordGauge()`. Optional — injected as `Pick<AnalyticsRuntime, 'metrics'>`.
- **Institutional Memory** — `logInventoryDecisionToMemory()` logs a real, immutable `'decision'` knowledge entry via `lifecycle.create()`. Optional — injected as `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.

Every optional collaborator degrades to a documented no-op (`null`) when not injected, so the Inventory Engine is fully usable — and fully tested — completely offline.

## Event bus

`InventoryEventMap` declares the 10 required events, each genuinely published by the real service that causes it:

`inventory.item.created`, `inventory.received`, `inventory.issued`, `inventory.transferred`, `inventory.adjusted`, `inventory.reserved`, `inventory.released`, `inventory.count.completed`, `inventory.shortage.detected`, `inventory.reorder.recommended`.

## Usage

```typescript
import { createInventoryRuntime } from '@lateen-os/inventory-engine';

const inventory = createInventoryRuntime();

const item = await inventory.catalog.create('org-1', { sku: 'SKU-001', name: 'Widget', unitOfMeasure: 'EA' });
await inventory.catalog.activate('org-1', item.id);
const warehouse = await inventory.warehouses.createWarehouse('org-1', { code: 'WH1', name: 'Main Warehouse' });

await inventory.movements.receive('org-1', { itemId: item.id, warehouseId: warehouse.id, quantity: '100.00' });
await inventory.valuation.recordReceipt('org-1', { itemId: item.id, warehouseId: warehouse.id, quantity: '100.00', unitCost: '5.00' });

await inventory.stock.setThresholds('org-1', item.id, warehouse.id, { reorderPoint: '20.00', maximumStock: '150.00' });
const suggestions = await inventory.procurement.computeReorderSuggestions('org-1');
```

Wiring in the real Finance Engine / Sales Engine / Business DNA / Workflow Engine / Communication Hub / Analytics Engine / Institutional Memory collaborators:

```typescript
import { createFinanceRuntime } from '@lateen-os/finance-engine';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';

const inventory = createInventoryRuntime({
  finance: createFinanceRuntime(),
  sales: createSalesRuntime(),
  businessDna: createBusinessDnaRuntime(),
  workflow: createWorkflowRuntime(),
  communicationHub: createCommunicationRuntime(),
  analytics: createAnalyticsRuntime(),
  institutionalMemory: createInstitutionalMemoryRuntime(),
});
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
inventory.events.subscribe('inventory.shortage.detected', (payload) => {
  console.log(`Item ${payload.itemId} at warehouse ${payload.warehouseId} is below minimum stock`);
});
```

## Structure

```
src/
├── shared/                     # IDs, decimal/date arithmetic, primitives
├── item/                       # Inventory Catalog — items, categories, brands, lifecycle
├── warehouse/                  # Warehouse Management — warehouses, zones, storage locations, bins
├── stock/                      # Inventory Stock — deterministic stock-level arithmetic
├── movement/                   # Inventory Movements (composed with Inventory Stock)
├── valuation/                  # Stock Valuation — FIFO and Weighted Average
├── counting/                   # Inventory Counting (composed with Inventory Stock and Inventory Movements)
├── procurement/                # Procurement Preparation (composed with Inventory Stock)
├── relationship-management/    # Finance / Sales / Business DNA / Workflow / Communication Hub / Analytics / Institutional Memory integration
├── queries/                    # Real InventoryQueries read layer
├── events/                     # Typed InventoryEventMap
├── runtime.ts                  # createInventoryRuntime() composition root
└── index.ts
```

See [INVENTORY_MODEL.md](./INVENTORY_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — `OrganizationId` / `ProductId`; optional Relationship Layer collaborator
- `@lateen-os/sales-engine` — `SalesOpportunityId`; optional Relationship Layer collaborator
- `@lateen-os/finance-engine` — optional Relationship Layer collaborator (valuation journal entries only)
- `@lateen-os/workflow-engine` — optional Relationship Layer collaborator
- `@lateen-os/communication-hub` — optional Relationship Layer collaborator
- `@lateen-os/analytics-engine` — optional Relationship Layer collaborator
- `@lateen-os/institutional-memory` — optional Relationship Layer collaborator

## Verification

```bash
pnpm --filter @lateen-os/inventory-engine build
pnpm --filter @lateen-os/inventory-engine typecheck
pnpm --filter @lateen-os/inventory-engine test
pnpm --filter @lateen-os/inventory-engine lint
```
