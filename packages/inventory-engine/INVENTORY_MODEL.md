# Inventory Model

> Real, implemented model for the Inventory Engine — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## Inventory Catalog

`item/engine.impl.ts`'s `createInventoryCatalogEngine()` implements the required create/update/activate/deactivate/archive/restore lifecycle for inventory items, plus simple category and brand lookups:

- **`create()`** — starts an item at `status: 'draft'`, `currentVersion: 1`. Throws `DuplicateSkuError` if the SKU already exists in the organization — SKUs are unique per organization, never globally. Publishes `inventory.item.created`.
- **`update()`** — rejected on an archived item (`InvalidItemTransitionError`) — `restore()` first.
- **`activate()`** / **`deactivate()`** / **`archive()`** / **`restore()`** — the same deliberate asymmetry used across the monorepo (Finance Engine's Chart of Accounts, HR Engine's Employee/Department): `archived` has no outgoing edges in `ITEM_TRANSITIONS`, so `activate()`/`deactivate()` can never resurrect an archived item. `restore()` is a distinct operation that returns it to its `statusBeforeArchive` (defaulting to `draft`).
- **Categories and brands** — simple named lookups (`active`/`archived` only), each with their own repository; items reference them by id via `categoryId`/`brandId`.
- **`externalProductId`** — an optional link to a real Business DNA catalog product, resolved (never synced) via the Relationship Layer's `getProductContext()`.

---

## Warehouse Management

`warehouse/engine.impl.ts`'s `createWarehouseManagementEngine()` implements the required create/update/archive/restore lifecycle across the 4-level hierarchy (`Warehouse` → `Zone` → `StorageLocation` → `Bin`):

- **`computeRemainingCapacity()`** (pure) — `max(0, capacity - used)`; `undefined` when no capacity limit was configured on that location or bin.
- Every level validates its parent exists before creation (`createZone()` requires the warehouse; `createStorageLocation()` requires the warehouse and, if given, the zone; `createBin()` requires the storage location) — there is no way to create an orphaned zone, location, or bin.
- All four levels share the same 2-state (`active`/`archived`) lifecycle model, guarded by the shared `canTransitionWarehouseEntity()`.

---

## Inventory Stock

`stock/engine.impl.ts`'s `createInventoryStockEngine()` implements deterministic stock-level arithmetic — the single source of truth every other module composes with rather than duplicating:

- **`computeAvailableQuantity()`** (pure) — `quantityOnHand - reservedQuantity - damagedQuantity`.
- **`isBelowReorderPoint()` / `isBelowMinimum()` / `isAboveMaximum()`** (pure) — fixed threshold comparisons, each `false` when the corresponding threshold was never configured.
- **`increaseOnHand()` / `decreaseOnHand()`** — the only way `quantityOnHand` ever changes. `decreaseOnHand()` throws `InsufficientStockError` rather than allowing a negative on-hand quantity.
- **`increaseReserved()`** — throws `InsufficientStockError` when the requested reservation would exceed `computeAvailableQuantity()` — a reservation can never be over-allocated beyond what is truly available (already accounting for existing reservations and damage).
- **`decreaseReserved()` / `decreaseDamaged()`** — both floor at `0` rather than going negative.
- **`getOrCreate()`** — every mutation method auto-creates a zeroed `StockLevel` on first use for a given (item, warehouse) pair, so callers never need a separate "initialize stock" step.

---

## Inventory Movements

`movement/engine.impl.ts`'s `createInventoryMovementEngine()` implements the required 7 movement types, each mutating stock through the injected `InventoryStockEngine` and then persisting exactly one immutable `MovementRecord` — **there is no update or delete on this engine's public surface**:

- **`receive()`** — increases on-hand. Publishes `inventory.received`.
- **`issue()`** — decreases on-hand (propagating `InsufficientStockError`). Publishes `inventory.issued`.
- **`transfer()`** — decreases on-hand at the source and increases it at the destination as one atomic pair of stock mutations, recorded as a single `MovementRecord` carrying both `fromWarehouseId` and `toWarehouseId`. Publishes `inventory.transferred`.
- **`adjust()`** — a signed correction (`quantityDelta`); positive increases on-hand, negative decreases it (subject to the same `InsufficientStockError` guard as `issue()`). Publishes `inventory.adjusted` with the signed quantity.
- **`returnStock()`** — increases on-hand, recorded with `movementType: 'return'`, but — since a return is a receipt from the stock ledger's point of view — publishes `inventory.received` (there is no separate "returned" event in the required set).
- **`reserve()`** / **`release()`** — increase/decrease reserved quantity, propagating the same `InsufficientStockError` guard on over-reservation. Publish `inventory.reserved` / `inventory.released`.

---

## Stock Valuation

`valuation/engine.impl.ts`'s `createStockValuationEngine()` implements the required 2 deterministic costing methods. **This module never implements accounting** — it only computes and records cost figures.

- **`computeFifoConsumption()`** (pure) — consumes a caller-supplied, oldest-first ordered list of cost layers for a requested quantity, spilling into successive layers as each is exhausted, and reports a `shortfall` (rather than throwing) when the layers can't fully cover the request — the stateful `recordIssue()` is what turns a non-zero shortfall into a thrown `NoCostLayersAvailableError`, keeping the pure calculation total and side-effect-free.
- **`computeWeightedAverageCost()`** (pure) — `((existingAvgCost × existingQty) + (newUnitCost × newQty)) / (existingQty + newQty)`; `0.00` when the resulting total quantity is `0`.
- **`recordReceipt()`** — appends a new FIFO cost layer **and** updates the running weighted-average cost in the same call — both methods stay available for every item/warehouse at all times; a caller picks which one to value an issue under only when calling `recordIssue()`.
- **`recordIssue()`** — for `fifo`, consumes layers oldest-first and reduces their `quantityRemaining` in place; for `weighted_average`, values the issue at the current running average and reduces its `totalQuantity`. Either way, persists one immutable `ValuationRecord` snapshot.

---

## Inventory Counting

`counting/engine.impl.ts`'s `createInventoryCountingEngine()` implements the required cycle/full count lifecycle with deterministic variance and reconciliation:

- **`computeVariance()`** (pure) — `countedQuantity - systemQuantity`.
- **`createCount()`** — snapshots each item's *current* system quantity (via Inventory Stock) into a new `draft` count — the system quantity is captured once, at creation time, and never recomputed.
- **`startCount()`** — `draft` → `in_progress`, stamping `startedAt`.
- **`recordCount()`** — only permitted while `in_progress`; records a counted quantity for one line and immediately computes its variance. Throws `CountLineNotFoundError` for an item not part of the count.
- **`completeCount()`** — `in_progress` → `completed`. For every line with a non-zero variance, calls this package's own Inventory Movements `adjust()` — reconciliation is intra-package composition, producing a real, immutable `MovementRecord` for every correction, exactly like any other adjustment. Publishes `inventory.count.completed` with the number of variant lines.

---

## Procurement Preparation

`procurement/engine.impl.ts`'s `createProcurementPreparationEngine()` implements deterministic reorder suggestions, shortage detection, and purchase-request generation. **No purchasing workflow** — every output is a recommendation or a plain data record.

- **`computeSuggestedReorderQuantity()`** (pure) — `max(0, (maximumStock ?? reorderPoint) - available)` — brings available quantity up to the configured maximum, or, absent one, back to the reorder point itself.
- **`computeReorderSuggestions()`** — every (item, warehouse) at or below its configured reorder point, each with a computed suggested quantity. Read-only — no event, since nothing has been recommended to anyone yet.
- **`detectShortages()`** — every (item, warehouse) below its configured minimum stock. Publishes `inventory.shortage.detected` once per detected shortage.
- **`generatePurchaseRequest()`** — persists a `PurchaseRequest` at `status: 'suggested'`. Publishes `inventory.reorder.recommended`. `acknowledgePurchaseRequest()` / `dismissPurchaseRequest()` are plain status updates — not an approval chain.

---

## Relationship Layer

`relationship-management/service.impl.ts`'s `createRelationshipManagement()` integrates all 7 required packages, each exclusively through its public API:

- **`getProductContext()`** — real Business DNA `products.getProduct()`.
- **`getOpportunityContext()`** — real Sales Engine `opportunities.get()`.
- **`recordInventoryValuationEntry()`** — composes real Finance Engine `generalLedger.createJournalEntry()` + `postJournalEntry()` into one balanced, posted journal entry (debiting the inventory account, crediting the offset account) — the one, explicit, opt-in place this package touches accounting.
- **`raiseInventoryApprovalWorkflow()`** — composes real Workflow Engine `defineWorkflow()` + `startWorkflow()`, idempotently caching the workflow definition per `(organizationId, requestType)` so it is defined at most once.
- **`notifyInventoryEvent()`** — creates and sends a real Communication Hub `'escalation'` notification.
- **`recordInventoryValueMetric()`** — real Analytics Engine `metrics.recordGauge()`.
- **`logInventoryDecisionToMemory()`** — real Institutional Memory `lifecycle.create()`, logging a `'decision'`-typed, `'operational'`-category knowledge entry.

Every method degrades to a documented `null` when its collaborator was not injected, so the Inventory Engine remains fully usable — and fully tested — completely offline.
