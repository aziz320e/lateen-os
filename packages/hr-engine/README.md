# @lateen-os/hr-engine

HR Engine — organization structure, employee management, position management, the attendance engine, leave management, payroll preparation, performance management, and the training engine for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The HR Engine is the canonical human-resources layer for Lateen OS: it owns Organization Structure (departments, business units, divisions, reporting hierarchy), Position Management, Employee Management (the guarded hire/transfer/promote/terminate/rehire lifecycle), the Attendance Engine, Leave Management, Payroll Preparation, Performance Management, and the Training Engine — and is the package that integrates Finance Engine, AI Workforce, Business DNA, Workflow Engine, Communication Hub, Analytics Engine, and Institutional Memory on behalf of the HR domain, exclusively through each package's public API.

Business DNA's own `Employee`/`Department` types are contracts-only (no runtime service, not queryable) — the HR Engine is the real, authoritative implementation of both concepts, with its own identifier namespace and its own repositories.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, **no LLM anywhere in this package** (every calculation — overtime/lateness, leave-day counts, payroll gross/net, performance weighted ratings — is fixed arithmetic, not model inference)
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createHrRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Organization Structure | `department` | Departments, business units, and divisions; hierarchy (reporting hierarchy) via `parentDepartmentId`; manager relationships via `managerId`; lifecycle: create / update / archive / restore |
| Position Management | `position` | Positions, job grades, salary grades, and deterministic vacancy tracking (`headcount - filledCount`), kept in sync by Employee Management |
| Employee Management | `employee` | Profile, employee number, employment status/type, and the guarded lifecycle: `hire` / `transfer` / `promote` / `terminate` / `rehire`, plus `setOnLeave` / `suspend` / `reactivate` |
| Attendance Engine | `attendance` | Clock in/out, work sessions, deterministic overtime and late-arrival computation, absences, and holidays |
| Leave Management | `leave` | Annual, sick, unpaid, maternity/paternity, and emergency leave; the required 5-status lifecycle (`requested` → `approved`/`rejected`/`cancelled` → `completed`); balance tracking for annual/sick leave |
| Payroll Preparation | `payroll` | Deterministic gross/net pay composed from base salary, allowances, deductions, Attendance overtime, and Leave unpaid-day deductions. **Preparation only** — never posts to a General Ledger itself |
| Performance Management | `performance` | Review periods, weighted objectives, evaluations with a deterministic overall rating and promotion recommendation |
| Training Engine | `training` | Courses, certifications (with deterministic expiry), employee skills, and completion tracking |
| Relationship Layer | `relationship-management` | Integrates Finance Engine, AI Workforce, Business DNA, Workflow Engine, Communication Hub, Analytics Engine, and Institutional Memory — see below |
| Query Layer | `queries` | Real, read-only `HrQueries` port — `findEmployees` / `findDepartments` / `findAttendance` / `findLeaveRequests` / `findPayrollData` / `findPerformance` / `findTraining` / `searchHr` |
| Event Bus | `events` | Typed `HrEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with Finance Engine, AI Workforce, Business DNA, Workflow Engine, Communication Hub, Analytics Engine, and Institutional Memory

Per the architecture rules, this package integrates with sibling packages **only through their public APIs** — never a repository, never a modification to those packages. Each of the 7 required packages has a real, genuine integration point in `relationship-management`:

- **Finance Engine** — `recordPayrollTaxWithholding()` calls the real Finance Engine tax service (`tax.calculateAndRecord()`) to compute payroll withholding. This is the only place the HR Engine touches accounting, and it never posts a ledger entry itself — Payroll Preparation's own engine only produces numbers. Optional — injected as `Pick<FinanceRuntime, 'tax'>`.
- **AI Workforce** — `getAiWorkforceUtilizationContext()` computes real busy/active digital-worker utilization via `findWorkers()`, for a combined human + AI workforce view. Optional — injected as `Pick<WorkforceQueries, 'findWorkers'>`.
- **Business DNA** — `getBusinessProfileContext()` reads the real Business DNA business profile. Optional — injected as `Pick<BusinessDnaRuntime, 'businessProfile'>`.
- **Workflow Engine** — `raiseHrApprovalWorkflow()` composes real `defineWorkflow()` + `startWorkflow()` to start a genuine HR-approval workflow instance (e.g. termination approval). Optional — injected as `Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`.
- **Communication Hub** — `notifyHrEvent()` creates and sends a real Communication Hub `'escalation'` notification. Optional — injected as `Pick<CommunicationRuntime, 'notifications'>`.
- **Analytics Engine** — `recordWorkforceUtilizationKpi()` records a real KPI snapshot via `kpis.recordWorkforceUtilization()`. Optional — injected as `Pick<AnalyticsRuntime, 'kpis'>`.
- **Institutional Memory** — `logHrDecisionToMemory()` logs a real, immutable `'decision'` knowledge entry via `lifecycle.create()`. Optional — injected as `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.

Every optional collaborator degrades to a documented no-op (`null`) when not injected, so the HR Engine is fully usable — and fully tested — completely offline.

## Event bus

`HrEventMap` declares the 10 required events, each genuinely published by the real service that causes it:

`employee.hired`, `employee.transferred`, `employee.promoted`, `employee.terminated`, `attendance.recorded`, `leave.requested`, `leave.approved`, `performance.completed`, `training.completed`, `payroll.prepared`.

## Usage

```typescript
import { createHrRuntime } from '@lateen-os/hr-engine';

const hr = createHrRuntime();

const department = await hr.organizationStructure.create('org-1', { code: 'ENG', name: 'Engineering', unitType: 'department' });
const position = await hr.positions.create('org-1', {
  title: 'Software Engineer',
  departmentId: department.id,
  jobGrade: 'G3',
  salaryGrade: 'S3',
  baseSalary: '6000.00',
  currency: 'USD',
  headcount: 5,
});

const employee = await hr.employees.hire('org-1', {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  departmentId: department.id,
  positionId: position.id,
  employmentType: 'full_time',
  baseSalary: '6000.00',
  currency: 'USD',
  hireDate: '2026-01-01',
});

const session = await hr.attendance.clockIn('org-1', employee.id, { at: '2026-01-15T09:00:00.000Z' });
await hr.attendance.clockOut('org-1', session.id, { at: '2026-01-15T19:00:00.000Z' });

const payrollRun = await hr.payroll.preparePayroll('org-1', {
  periodStart: '2026-01-01',
  periodEnd: '2026-01-31',
  currency: 'USD',
  employeeIds: [employee.id],
});
```

Wiring in the real Finance Engine / AI Workforce / Business DNA / Workflow Engine / Communication Hub / Analytics Engine / Institutional Memory collaborators:

```typescript
import { createFinanceRuntime } from '@lateen-os/finance-engine';
import { createWorkforceRuntime } from '@lateen-os/ai-workforce';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';

const aiWorkforce = createWorkforceRuntime();

const hr = createHrRuntime({
  finance: createFinanceRuntime(),
  aiWorkforce: aiWorkforce.queries,
  businessDna: createBusinessDnaRuntime(),
  workflow: createWorkflowRuntime(),
  communicationHub: createCommunicationRuntime(),
  analytics: createAnalyticsRuntime(),
  institutionalMemory: createInstitutionalMemoryRuntime(),
});
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
hr.events.subscribe('leave.approved', (payload) => {
  console.log(`Leave request ${payload.leaveRequestId} approved for ${payload.employeeId}`);
});
```

## Structure

```
src/
├── shared/                     # IDs, decimal/date arithmetic, primitives
├── department/                 # Organization Structure — departments/business units/divisions, hierarchy, lifecycle
├── position/                   # Position Management — job grades, salary grades, vacancy tracking
├── employee/                   # Employee Management — guarded hire/transfer/promote/terminate/rehire lifecycle
├── attendance/                 # Attendance Engine — clock in/out, overtime, lateness, absences, holidays
├── leave/                      # Leave Management — 5 leave types, guarded lifecycle, balance tracking
├── payroll/                    # Payroll Preparation (composed with Employee/Attendance/Leave)
├── performance/                # Performance Management — review periods, objectives, evaluations
├── training/                   # Training Engine — courses, certifications, skills, completions
├── relationship-management/    # Finance / AI Workforce / Business DNA / Workflow / Communication Hub / Analytics / Institutional Memory integration
├── queries/                    # Real HrQueries read layer
├── events/                     # Typed HrEventMap
├── runtime.ts                  # createHrRuntime() composition root
└── index.ts
```

See [HR_MODEL.md](./HR_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — `OrganizationId`; optional Relationship Layer collaborator
- `@lateen-os/finance-engine` — optional Relationship Layer collaborator (Payroll tax withholding only)
- `@lateen-os/ai-workforce` — optional Relationship Layer collaborator
- `@lateen-os/workflow-engine` — optional Relationship Layer collaborator
- `@lateen-os/communication-hub` — optional Relationship Layer collaborator
- `@lateen-os/analytics-engine` — optional Relationship Layer collaborator
- `@lateen-os/institutional-memory` — optional Relationship Layer collaborator

## Verification

```bash
pnpm --filter @lateen-os/hr-engine build
pnpm --filter @lateen-os/hr-engine typecheck
pnpm --filter @lateen-os/hr-engine test
pnpm --filter @lateen-os/hr-engine lint
```
