# HR Model

> Real, implemented model for the HR Engine — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## Organization Structure

`department/engine.impl.ts`'s `createOrganizationStructureEngine()` implements the required create/update/archive/restore lifecycle across the 3 unit types (`department`, `business_unit`, `division`):

- **`create()`** — starts a unit at `status: 'active'`, `currentVersion: 1`, optionally nested under a `parentDepartmentId` and optionally headed by a `managerId`.
- **`update()`** — rejected on an archived unit (`InvalidDepartmentTransitionError`) — `restore()` first.
- **`archive()`** / **`restore()`** — the same deliberate asymmetry used across the monorepo (Finance Engine's Chart of Accounts, AI Governance Engine's Governance Policy engine): `archived` has no outgoing edges in `DEPARTMENT_TRANSITIONS`, so there is no ordinary transition back to `active`. `restore()` is the distinct operation that does.
- **`getChildren()` / `getDescendants()` / `getAncestors()`** — real reporting-hierarchy traversal over `parentDepartmentId`, breadth-first down, walk-up for ancestors.
- **`findByManager()`** — every unit headed by a given employee — the manager-relationship half of Organization Structure (the other half, an employee's own `managerId`, lives in Employee Management).

---

## Position Management

`position/engine.impl.ts`'s `createPositionManagementEngine()` implements positions with job grades, salary grades, and deterministic vacancy tracking:

- **`computeVacancy()`** (pure) — `max(0, headcount - filledCount)`.
- **`create()`** — starts `status: 'active'` with `filledCount: 0`.
- **`incrementFilledCount()`** / **`decrementFilledCount()`** — the only way `filledCount` ever changes. `incrementFilledCount()` throws `NoVacancyError` when the position has no remaining vacancy — this is the guard that makes over-hiring into a position structurally impossible. These are called exclusively by Employee Management, never directly by an application.
- **`listVacancies()`** — every position with `computeVacancy() > 0`, regardless of `status` (an archived position with unfilled slots still reports a vacancy — closing out headcount is a separate, explicit `update()`).

---

## Employee Management

`employee/engine.impl.ts`'s `createEmployeeManagementEngine()` implements the required lifecycle — `hire`, `transfer`, `promote`, `terminate`, `rehire` — guarded by `EMPLOYEE_TRANSITIONS` over the 4 `EmploymentStatus` values (`active`, `on_leave`, `suspended`, `terminated`):

- **`formatEmployeeNumber()`** (pure) — a deterministic, zero-padded, prefixed employee number (`EMP-00001`) derived from how many employees already exist in the organization.
- **`hire()`** — validates the department exists, calls Position Management's `incrementFilledCount()` (propagating `NoVacancyError` if the position is full), and only then persists the new `Employee` at `status: 'active'`. Publishes `employee.hired`.
- **`transfer()`** — changes department/position/manager. A position change decrements the old position and increments the new one — never both at once incorrectly, and never silently skipped. Rejected once `terminated`. Publishes `employee.transferred`.
- **`promote()`** — the same position-swap mechanics as `transfer()`, plus an optional salary change; only permitted while `active`. Publishes `employee.promoted`.
- **`terminate()`** — guarded by `EMPLOYEE_TRANSITIONS` (`active`/`on_leave`/`suspended` → `terminated`), frees the position via `decrementFilledCount()`, stamps `terminationDate`. Publishes `employee.terminated`.
- **`rehire()`** — the same deliberate asymmetry as `archive()`/`restore()`: `terminated` has no outgoing edges in `EMPLOYEE_TRANSITIONS`, so `rehire()` is a distinct operation, re-validating the department, re-filling a (possibly different) position, and clearing `terminationDate`.
- **`setOnLeave()` / `suspend()` / `reactivate()`** — the remaining guarded transitions between `active`, `on_leave`, and `suspended`.
- **`findDirectReports()` / `getManagementChain()`** — the employee-level half of the reporting hierarchy: direct reports via `managerId`, and the full chain of managers up to the top of the organization.

---

## Attendance Engine

`attendance/engine.impl.ts`'s `createAttendanceEngine()` implements clock in/out and deterministic time computations — no AI, no heuristics, every figure is fixed arithmetic over the recorded timestamps:

- **`computeSessionDurationMinutes()`** (pure) — whole minutes between clock-in and clock-out, never negative.
- **`computeOvertimeMinutes()`** (pure) — minutes beyond the standard 480-minute (8-hour) work day, configurable, never negative.
- **`computeLateMinutes()`** (pure) — minutes after a `scheduledStartAt`, `0` when on time, early, or when no schedule was given.
- **`clockIn()`** — throws `OpenWorkSessionExistsError` if the employee already has an open session — an employee can never be clocked in twice.
- **`clockOut()`** — closes the session, computing duration/overtime/lateness in one deterministic pass, and publishes `attendance.recorded`. Throws `WorkSessionAlreadyClosedError` on a session that is already closed.
- **`recordAbsence()`** / **`registerHoliday()`** / **`isHoliday()`** — absence records and an organization-wide holiday calendar.

---

## Leave Management

`leave/engine.impl.ts`'s `createLeaveManagementEngine()` implements the required 5 leave types (`annual`, `sick`, `unpaid`, `maternity_paternity`, `emergency`) and the required 5-status lifecycle (`requested`, `approved`, `rejected`, `cancelled`, `completed`):

- **`computeDaysRequested()`** (pure) — inclusive day count spanning `startDate`..`endDate`.
- **`BALANCE_TRACKED_LEAVE_TYPES`** — only `annual` and `sick` are balance-checked; `unpaid`, `maternity_paternity`, and `emergency` never consult or deduct a balance.
- **`requestLeave()`** — for a balance-tracked type, throws `InsufficientLeaveBalanceError` if the requested days exceed the remaining balance (a lazily-materialized default — `DEFAULT_ALLOCATED_DAYS`: 21 annual / 10 sick days/year — until an explicit `upsertLeaveBalance()` override). Publishes `leave.requested`.
- **`approveLeave()`** — `requested` → `approved`; deducts the balance-tracked type's `usedDays`. Publishes `leave.approved`.
- **`rejectLeave()`** — `requested` → `rejected`.
- **`cancelLeave()`** — `requested`/`approved` → `cancelled`; restores the balance deduction if the request had already been approved.
- **`completeLeave()`** — `approved` → `completed`.

---

## Payroll Preparation

`payroll/engine.impl.ts`'s `createPayrollPreparationEngine()` computes deterministic gross/net pay by composing this package's own Employee, Attendance, and Leave data — **preparation only; it never posts to a General Ledger or creates any accounting record**:

- **`computePayrollLineItem()`** (pure) — `hourlyRate = baseSalary / STANDARD_MONTHLY_HOURS (160)`, `overtimePay = hourlyRate × overtimeHours × OVERTIME_MULTIPLIER (1.5)`; `dailyRate = baseSalary / WORKING_DAYS_PER_MONTH (22)`, `leaveDeduction = dailyRate × leaveDeductionDays`; `grossPay = baseSalary + Σallowances + overtimePay`; `netPay = grossPay - Σdeductions - leaveDeduction`.
- **`preparePayroll()`** — for each employee: reads their `baseSalary` from Employee Management, sums `overtimeMinutes` from every closed Attendance work session whose `clockInAt` falls within the period, sums `daysRequested` from every `approved`/`completed` `unpaid` Leave request whose `startDate` falls within the period, and applies any caller-supplied allowances/deductions. Persists one `PayrollRun` at `status: 'draft'` and publishes `payroll.prepared`.
- **`finalizePayrollRun()`** — `draft` → `finalized`; throws `PayrollRunFinalizedError` if already finalized. Finalizing locks the numbers; it still does not post anything — that is `relationship-management`'s job, calling Finance Engine's own public API.

---

## Performance Management

`performance/engine.impl.ts`'s `createPerformanceManagementEngine()` implements review periods, weighted objectives, and evaluations with a deterministic overall rating:

- **`computeOverallRating()`** (pure) — a weighted average of `ObjectiveRating`s, each weighted by its objective's `weightPct`; `0` when there are no ratings or the matched weights sum to `0`.
- **`computePromotionRecommendation()`** (pure) — `overallRating >= PROMOTION_RATING_THRESHOLD (4, out of 5)`, a fixed, explainable rule — never a model's judgment.
- **`createEvaluation()`** — computes `overallRating` and `promotionRecommended` immediately from the employee's objectives and persists a `draft` evaluation.
- **`completeEvaluation()`** — `draft` → `completed`, publishing `performance.completed`.

---

## Training Engine

`training/engine.impl.ts`'s `createTrainingEngine()` implements courses, certifications, employee skills, and deterministic completion tracking:

- **`computeCertificationExpiry()`** (pure) — `validityMonths` after `completedAt`; `undefined` (never expires) when the certification has no `validityMonths`.
- **`recordSkill()`** — an upsert keyed by `(employeeId, skillName)` — recording a skill twice updates proficiency in place rather than duplicating the record.
- **`recordCompletion()`** — validates the course (and, if given, the certification) exist, computes `expiresAt` when applicable, and publishes `training.completed`.

---

## Relationship Layer

`relationship-management/service.impl.ts`'s `createRelationshipManagement()` integrates all 7 required packages, each exclusively through its public API:

- **`getBusinessProfileContext()`** — real Business DNA `businessProfile.get()`.
- **`recordPayrollTaxWithholding()`** — real Finance Engine `tax.calculateAndRecord()` — the one, explicit, opt-in place this package touches accounting.
- **`getAiWorkforceUtilizationContext()`** — real AI Workforce `findWorkers()`, reduced to busy/active counts and a utilization percentage — mirrors the same pattern Analytics Engine uses for its own AI Workforce integration.
- **`raiseHrApprovalWorkflow()`** — composes real Workflow Engine `defineWorkflow()` + `startWorkflow()`, idempotently caching the workflow definition per `(organizationId, requestType)` so it is defined at most once.
- **`notifyHrEvent()`** — creates and sends a real Communication Hub `'escalation'` notification.
- **`recordWorkforceUtilizationKpi()`** — real Analytics Engine `kpis.recordWorkforceUtilization()`.
- **`logHrDecisionToMemory()`** — real Institutional Memory `lifecycle.create()`, logging a `'decision'`-typed, `'people'`-category knowledge entry.

Every method degrades to a documented `null` when its collaborator was not injected, so the HR Engine remains fully usable — and fully tested — completely offline.
