# Project Model

> Real, implemented model for the Project Management Engine — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## Project Structure

`project/engine.impl.ts`'s `createProjectStructureEngine()` implements Portfolios, Programs, Projects, Phases, and Milestones:

- **Portfolios and Programs** — simple named containers (`active`/`archived` lifecycle only); a Program may optionally belong to a Portfolio, and a Project may optionally belong to either.
- **`create()`** — starts a project at `status: 'draft'`, `currentVersion: 1`. Throws `DuplicateProjectCodeError` if the code already exists in the organization — codes are unique per organization, never globally. Publishes `project.created`.
- **`start()` / `pause()` / `resume()` / `complete()` / `cancel()`** — the guarded ordinary lifecycle: `draft → active → on_hold → active → completed`, with `cancel()` reachable from `draft`, `active`, or `on_hold`. `complete()` stamps `actualEndDate`. `start()` and `complete()` publish `project.started` / `project.completed`; `cancel()` publishes `project.cancelled` with an optional reason.
- **`archive()` / `restore()`** — the same deliberate asymmetry used across the monorepo (Finance Engine's Chart of Accounts, HR Engine's Employee/Department, Inventory Engine's Inventory Catalog): `archived` has no outgoing edges in `PROJECT_TRANSITIONS`, so the ordinary lifecycle methods can never resurrect an archived project. `restore()` is a distinct operation that returns it to its `statusBeforeArchive`.
- **Phases** — an ordered (`sequence`), simple 3-state (`planned`/`active`/`completed`) stage within a project.
- **Milestones** — a dated checkpoint (`pending`/`reached`/`missed`), optionally scoped to one phase. `reachMilestone()` stamps `actualDate`.
- **Own aggregate namespace** — Business DNA's `Project`/`ProjectId` module is contracts-only (like its Employee/Department modules), so this package defines its own fresh `Project` aggregate rather than syncing against it.

---

## Task Management

`task/engine.impl.ts`'s `createTaskManagementEngine()` implements tasks and subtasks with dependencies, priorities, labels, and due dates:

- **`create()`** — starts a task at `status: 'planned'`, defaulting `priority` to `'medium'`. Every `dependsOnTaskIds` entry must already exist (`ProjectTaskNotFoundError` otherwise). Publishes `task.created`.
- **`wouldCreateCycle()`** (pure) — a graph traversal checked both at `create()` time and on every `addDependency()` call, so the task graph handed to the Scheduling Engine is always a genuine DAG. Throws `CircularTaskDependencyError`.
- **`markReady()` / `start()` / `block()` / `complete()` / `cancel()`** — the guarded lifecycle: `planned → ready → in_progress ⇄ blocked → completed`, with `cancel()` reachable from any non-terminal state.
- **`start()` is dependency-aware** — it checks every `dependsOnTaskId` and throws `TaskBlockedByDependencyError`, listing every incomplete dependency, if any are not yet `completed`. `complete()` publishes `task.completed`.
- **Subtasks** — a `parentTaskId` reference; `findSubtasks()` looks them up.

---

## Resource Planning

`resource/engine.impl.ts`'s `createResourcePlanningEngine()` implements deterministic workload, capacity, allocation, and utilization tracking. **Composes with HR Engine, and — only through HR Engine's own public integration — with AI Workforce. Never duplicates workforce logic.**

- **`computeTotalAllocation()`** (pure) — sums the allocation percentage of every currently-`active` assignment for an assignee.
- **`computeRemainingCapacity()` / `isOverAllocated()`** (pure) — fixed comparisons against a configurable capacity ceiling (`DEFAULT_CAPACITY_PERCENTAGE = 100`).
- **`assign()`** — throws `OverAllocationError` if the projected total allocation would exceed capacity; `updateAllocation()` re-checks capacity against every *other* active assignment for that assignee.
- **`assigneeId` is an opaque foreign key** — either an HR Engine `EmployeeId` or an AI Workforce worker id, resolved (never redefined) via the Relationship Layer's `getEmployeeContext()` / `getAiWorkforceUtilizationContext()`.
- **`complete()` / `cancel()`** — free up capacity for future assignments without altering historical records.

---

## Scheduling Engine

`scheduling/engine.impl.ts`'s `createSchedulingEngine()` implements deterministic Critical Path Method (CPM) scheduling. **No AI optimization anywhere** — every date, duration, slack, and critical-path flag is fixed graph arithmetic.

- **`computeCriticalPathSchedule()`** (pure) — takes a caller-supplied `{ taskId, durationDays, dependsOnTaskIds }[]` and a project start date; performs a forward pass (early start/finish), a backward pass (late start/finish), computes `slack = lateStart - earlyStart`, and flags `isCritical: slack === 0`. Resolves calendar `startDate`/`finishDate` via `addDaysIso()`. Throws on a cyclic graph — a defensive check, since Task Management's own `wouldCreateCycle()` guard is what prevents a cycle from ever reaching this function in practice.
- **`computeSchedule()`** — persists a new, non-baseline `Schedule` snapshot every time it's called, so a project can be re-scheduled repeatedly without losing history.
- **`setBaseline()` / `getBaseline()`** — at most one schedule per project may be the baseline; setting a new baseline automatically unmarks the previous one.
- **`getCriticalPath()`** — returns the stored snapshot's critical-path entries (`isCritical === true`) without recomputing.

---

## Time Tracking

`timetracking/engine.impl.ts`'s `createTimeTrackingEngine()` implements immutable work logs and deterministic hours aggregation.

- **`computeIsOvertime()`** (pure) — flags a single day's logged hours beyond `STANDARD_WORK_HOURS_PER_DAY = 8` (configurable per call).
- **`computeActualHours()`** (pure) — sums logged hours across a set of work logs.
- **`computeUtilizationPercentage()`** (pure) — `actualHours / estimatedHours × 100`, rounded to 2 decimal places; `0` when no estimate was set.
- **`logWork()`** — appends exactly one immutable `WorkLog`, computing `isOvertime` at write time — there is no update or delete on this engine's public surface, mirroring Inventory Engine's Movement ledger.

---

## Budget Tracking

`budget/engine.impl.ts`'s `createBudgetTrackingEngine()` implements planned budget, actual cost, remaining budget, and cost variance — all deterministic decimal-string arithmetic over this package's own project spend data. **Never implements accounting.**

- **`computeRemainingBudget()` / `computeCostVariance()`** (pure) — both `plannedBudget - actualCost`; a negative variance means over budget.
- **`createBudget()`** — starts at `actualCost: '0.00'`, `status: 'active'`. Publishes `budget.updated` with the computed remaining budget.
- **`recordCost()`** — accumulates `actualCost`; **`reviseBudget()`** changes `plannedBudget`. Both publish `budget.updated`.
- **`recordProjectCostEntry()`** (Relationship Layer) — the *only* place this package touches a real General Ledger, composing Finance Engine's own `generalLedger.createJournalEntry()` + `postJournalEntry()` into one balanced, posted entry. This engine module itself never posts anything.

---

## Material Planning

`material/engine.impl.ts`'s `createMaterialPlanningEngine()` implements required/reserved quantity bookkeeping and deterministic shortage detection. **Does not manage inventory directly.**

- **`computeShortage()`** (pure) — `max(0, requiredQuantity - reservedQuantity)`.
- **`createRequirement()`** — starts at `status: 'planned'`, `reservedQuantity: '0.00'`.
- **`recordReservation()`** — accumulates `reservedQuantity`; automatically transitions to `status: 'reserved'` once the shortage reaches zero.
- **`listShortages()`** — every requirement for a project with a non-zero computed shortage.
- **`reserveProjectMaterial()`** (Relationship Layer) — the *only* place this package touches real stock, composing Inventory Engine's own `movements.reserve()`. This engine module itself never mutates a stock level.

---

## Project Risks

`risk/engine.impl.ts`'s `createProjectRiskEngine()` implements a risk register with deterministic scoring. **No model-based prediction.**

- **`computeRiskScore()`** (pure) — `probability × impact`, each a 1–5 ordinal rating (max score 25).
- **`computeRiskLevel()`** (pure) — fixed banding: `low` (≤5), `medium` (≤12), `high` (≤20), `critical` (>20).
- **`create()`** — starts at `status: 'identified'`, computing the score immediately. Publishes `risk.created` with the score.
- **`startMitigation()` → `resolve()`**, **`accept()`**, **`markOccurred()`** — the guarded lifecycle: `identified → mitigating → resolved`, `identified → accepted`, and `occurred` reachable from `identified`, `mitigating`, or `accepted`.
- **`update()`** — recomputes `score` whenever `probability`/`impact` change, and records `mitigation` notes.

---

## Deliverables

`deliverable/engine.impl.ts`'s `createDeliverableEngine()` implements deliverables with acceptance approvals and completion tracking.

- **`create()`** — starts at `status: 'draft'` with an empty `approvals` list.
- **`submitForReview()` → `approve()` / `reject()`** — `draft → in_review → accepted | rejected`. `approve()` appends a `DeliverableApproval` (`approverId`, `approvedAt`, optional `comment`) and publishes `deliverable.accepted`.
- **`resubmit()`** — returns a `rejected` deliverable to `draft` so it can be revised and resubmitted via `submitForReview()`; this is a distinct operation, not an automatic side effect of `reject()`.
- **`complete()`** — `accepted → completed`, terminal.

---

## Relationship Layer

`relationship-management/service.impl.ts`'s `createRelationshipManagement()` integrates all 9 required packages, each exclusively through its public API:

- **`getCustomerContext()`** — real CRM Engine `customers.get()`.
- **`getEmployeeContext()`** — real HR Engine `employees.get()`.
- **`getAiWorkforceUtilizationContext()`** — real AI Workforce utilization, reached *only* through HR Engine's own already-integrated `relationships.getAiWorkforceUtilizationContext()` — this package has no direct dependency on `@lateen-os/ai-workforce` in production code.
- **`recordProjectCostEntry()`** — composes real Finance Engine `generalLedger.createJournalEntry()` + `postJournalEntry()` into one balanced, posted journal entry (debiting the project account, crediting the offset account) — the one, explicit, opt-in place this package touches accounting.
- **`reserveProjectMaterial()`** — real Inventory Engine `movements.reserve()`.
- **`raiseProjectApprovalWorkflow()`** — composes real Workflow Engine `defineWorkflow()` + `startWorkflow()`, idempotently caching the workflow definition per `(organizationId, requestType)` so it is defined at most once.
- **`notifyProjectEvent()`** — creates and sends a real Communication Hub `'escalation'` notification.
- **`recordProjectMetric()`** — real Analytics Engine `metrics.recordGauge()`.
- **`getBusinessProfileContext()`** — real Business DNA `businessProfile.get()`.
- **`logProjectDecisionToMemory()`** — real Institutional Memory `lifecycle.create()`, logging a `'decision'`-typed, `'operational'`-category knowledge entry.

Every method degrades to a documented `null` when its collaborator was not injected, so the Project Management Engine remains fully usable — and fully tested — completely offline.
