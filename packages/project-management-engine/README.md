# @lateen-os/project-management-engine

Project Management Engine — project/portfolio/program structure, task management, resource planning, deterministic scheduling (CPM), time tracking, budget tracking, material planning, project risks, and deliverables for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Project Management Engine is the canonical project-delivery layer for Lateen OS: it owns Project Structure (portfolios, programs, projects, phases, milestones — full lifecycle), Task Management (tasks, subtasks, dependencies, priorities, labels, due dates), Resource Planning (employee and AI-worker assignment, workload, capacity, utilization), the Scheduling Engine (deterministic Critical Path Method — no AI optimization), Time Tracking (work logs, actual vs. estimated hours, overtime), Budget Tracking (planned/actual/remaining/variance — never accounting itself), Material Planning (required/reserved quantities and shortages — never inventory management itself), Project Risks (a deterministic probability × impact risk register), and Deliverables (acceptance, approvals, completion) — and is the package that integrates CRM Engine, HR Engine, Finance Engine, Inventory Engine, Workflow Engine, Communication Hub, Analytics Engine, Business DNA, and Institutional Memory on behalf of the project domain, exclusively through each package's public API.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, **no LLM anywhere in this package** (every calculation — critical path/slack, risk scoring, allocation/capacity, cost variance, overtime detection — is fixed arithmetic over decimal-string amounts and day-count graphs, not model inference)
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createProjectRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Project Structure | `project` | Portfolios, programs, projects, phases, milestones — hierarchical; project lifecycle: create / update / archive / restore / start / pause / resume / complete / cancel |
| Task Management | `task` | Tasks and subtasks with dependencies (cycle-guarded), priorities, labels, due dates; lifecycle: planned / ready / in_progress / blocked / completed / cancelled |
| Resource Planning | `resource` | Employee and AI-worker assignment, deterministic workload/capacity/allocation/utilization. Composes with HR Engine (and, through it, AI Workforce) — never duplicates workforce logic |
| Scheduling Engine | `scheduling` | Deterministic Critical Path Method: early/late start & finish, slack, critical path, baseline schedule snapshots. **No AI optimization** |
| Time Tracking | `timetracking` | Immutable work logs, actual-hours aggregation, utilization against estimated hours, overtime flag |
| Budget Tracking | `budget` | Planned budget, actual cost, remaining budget, cost variance — this package's own numbers. Composes with Finance Engine for the one opt-in ledger posting. **Never implements accounting** |
| Material Planning | `material` | Required/reserved quantity bookkeeping and deterministic shortage detection. Composes with Inventory Engine for the real stock reservation. **Does not manage inventory directly** |
| Project Risks | `risk` | Risk register with deterministic probability × impact scoring and banding, mitigation tracking, guarded status lifecycle |
| Deliverables | `deliverable` | Deliverables with acceptance approvals and a guarded draft/in_review/accepted/rejected/completed lifecycle |
| Relationship Layer | `relationship-management` | Integrates CRM Engine, HR Engine, Finance Engine, Inventory Engine, Workflow Engine, Communication Hub, Analytics Engine, Business DNA, and Institutional Memory — see below |
| Query Layer | `queries` | Real, read-only `ProjectQueries` port — `findProjects` / `findTasks` / `findMilestones` / `findAssignments` / `findSchedules` / `findBudgets` / `findRisks` / `findDeliverables` / `searchProjects` |
| Event Bus | `events` | Typed `ProjectEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with CRM Engine, HR Engine, Finance Engine, Inventory Engine, Workflow Engine, Communication Hub, Analytics Engine, Business DNA, and Institutional Memory

Per the architecture rules, this package integrates with sibling packages **only through their public APIs** — never a repository, never a modification to those packages. Each of the 9 required packages has a real, genuine integration point in `relationship-management`:

- **CRM Engine** — `getCustomerContext()` fetches a real CRM Engine customer via `customers.get()`. Optional — injected as `Pick<CrmRuntime, 'customers'>`.
- **HR Engine** — `getEmployeeContext()` fetches a real HR Engine employee via `employees.get()`. `getAiWorkforceUtilizationContext()` composes AI Workforce data **only through HR Engine's own already-integrated capability** (`relationships.getAiWorkforceUtilizationContext()`) — this package never depends on `@lateen-os/ai-workforce` directly, and never duplicates workforce logic. Optional — injected as `Pick<HrRuntime, 'employees' | 'relationships'>`.
- **Finance Engine** — `recordProjectCostEntry()` composes a real, posted Finance Engine journal entry (`generalLedger.createJournalEntry()` + `postJournalEntry()`) for project spend. This is the only place this package touches accounting, and it never implements the accounting itself. Optional — injected as `Pick<FinanceRuntime, 'generalLedger'>`.
- **Inventory Engine** — `reserveProjectMaterial()` composes a real Inventory Engine stock reservation (`movements.reserve()`). This package never manages inventory directly. Optional — injected as `Pick<InventoryRuntime, 'movements'>`.
- **Workflow Engine** — `raiseProjectApprovalWorkflow()` composes real `defineWorkflow()` + `startWorkflow()` to start a genuine project-approval workflow instance (e.g. a budget approval). Optional — injected as `Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`.
- **Communication Hub** — `notifyProjectEvent()` creates and sends a real Communication Hub `'escalation'` notification. Optional — injected as `Pick<CommunicationRuntime, 'notifications'>`.
- **Analytics Engine** — `recordProjectMetric()` records a real gauge metric snapshot via `metrics.recordGauge()`. Optional — injected as `Pick<AnalyticsRuntime, 'metrics'>`.
- **Business DNA** — `getBusinessProfileContext()` fetches the real Business DNA business profile via `businessProfile.get()`. Optional — injected as `Pick<BusinessDnaRuntime, 'businessProfile'>`.
- **Institutional Memory** — `logProjectDecisionToMemory()` logs a real, immutable `'decision'` knowledge entry via `lifecycle.create()`. Optional — injected as `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.

Every optional collaborator degrades to a documented no-op (`null`) when not injected, so the Project Management Engine is fully usable — and fully tested — completely offline.

## Event bus

`ProjectEventMap` declares the 10 required events, each genuinely published by the real service that causes it:

`project.created`, `project.started`, `project.completed`, `project.cancelled`, `task.created`, `task.completed`, `resource.assigned`, `budget.updated`, `risk.created`, `deliverable.accepted`.

## Usage

```typescript
import { createProjectRuntime } from '@lateen-os/project-management-engine';

const projects = createProjectRuntime();

const project = await projects.projects.create('org-1', { code: 'PRJ-1', name: 'Website Revamp' });
await projects.projects.start('org-1', project.id);

const design = await projects.tasks.create('org-1', { projectId: project.id, title: 'Design homepage' });
const build = await projects.tasks.create('org-1', { projectId: project.id, title: 'Build homepage', dependsOnTaskIds: [design.id] });

const schedule = await projects.scheduling.computeSchedule('org-1', {
  projectId: project.id,
  projectStartDate: '2026-01-01',
  tasks: [
    { taskId: design.id, durationDays: 3, dependsOnTaskIds: [] },
    { taskId: build.id, durationDays: 5, dependsOnTaskIds: [design.id] },
  ],
});
await projects.scheduling.setBaseline('org-1', schedule.id);

await projects.resources.assign('org-1', { projectId: project.id, assigneeType: 'employee', assigneeId: 'employee-1', allocationPercentage: 60 });
const budget = await projects.budgets.createBudget('org-1', { projectId: project.id, currency: 'USD', plannedBudget: '25000.00' });
await projects.budgets.recordCost('org-1', budget.id, '4000.00');
```

Wiring in the real CRM Engine / HR Engine / Finance Engine / Inventory Engine / Workflow Engine / Communication Hub / Analytics Engine / Business DNA / Institutional Memory collaborators:

```typescript
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createHrRuntime } from '@lateen-os/hr-engine';
import { createFinanceRuntime } from '@lateen-os/finance-engine';
import { createInventoryRuntime } from '@lateen-os/inventory-engine';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';

const projects = createProjectRuntime({
  crm: createCrmRuntime(),
  hr: createHrRuntime(),
  finance: createFinanceRuntime(),
  inventory: createInventoryRuntime(),
  workflow: createWorkflowRuntime(),
  communicationHub: createCommunicationRuntime(),
  analytics: createAnalyticsRuntime(),
  businessDna: createBusinessDnaRuntime(),
  institutionalMemory: createInstitutionalMemoryRuntime(),
});
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
projects.events.subscribe('risk.created', (payload) => {
  console.log(`Risk ${payload.riskId} on project ${payload.projectId} scored ${payload.score}`);
});
```

## Structure

```
src/
├── shared/                     # IDs, decimal/date arithmetic, primitives
├── project/                    # Project Structure — portfolios, programs, projects, phases, milestones
├── task/                       # Task Management — tasks, subtasks, dependencies
├── resource/                   # Resource Planning — employee/AI-worker assignment
├── scheduling/                 # Scheduling Engine — deterministic CPM
├── timetracking/               # Time Tracking — work logs
├── budget/                     # Budget Tracking
├── material/                   # Material Planning
├── risk/                       # Project Risks
├── deliverable/                # Deliverables
├── relationship-management/    # CRM / HR / Finance / Inventory / Workflow / Communication Hub / Analytics / Business DNA / Institutional Memory integration
├── queries/                    # Real ProjectQueries read layer
├── events/                     # Typed ProjectEventMap
├── runtime.ts                  # createProjectRuntime() composition root
└── index.ts
```

See [PROJECT_MODEL.md](./PROJECT_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — `OrganizationId`; optional Relationship Layer collaborator
- `@lateen-os/crm-engine` — optional Relationship Layer collaborator
- `@lateen-os/hr-engine` — optional Relationship Layer collaborator (also the sole path to AI Workforce context)
- `@lateen-os/finance-engine` — optional Relationship Layer collaborator (project cost journal entries only)
- `@lateen-os/inventory-engine` — optional Relationship Layer collaborator (material reservation only)
- `@lateen-os/workflow-engine` — optional Relationship Layer collaborator
- `@lateen-os/communication-hub` — optional Relationship Layer collaborator
- `@lateen-os/analytics-engine` — optional Relationship Layer collaborator
- `@lateen-os/institutional-memory` — optional Relationship Layer collaborator
- `@lateen-os/ai-workforce` — **devDependency only**, used exclusively by `tests/integration.test.ts` to prove the HR Engine passthrough is genuine; never imported from `src/`

## Verification

```bash
pnpm --filter @lateen-os/project-management-engine build
pnpm --filter @lateen-os/project-management-engine typecheck
pnpm --filter @lateen-os/project-management-engine test
pnpm --filter @lateen-os/project-management-engine lint
```
