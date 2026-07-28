/**
 * @lateen-os/hr-engine — HR Engine
 *
 * Organization structure (departments/business units/divisions),
 * position management, employee management, the attendance engine,
 * leave management, payroll preparation, performance management, and
 * the training engine for Lateen OS. Real, deterministic, offline
 * implementation — see `runtime.ts`'s `createHrRuntime()` for the
 * composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as department from './department/index.js';
export * as position from './position/index.js';
export * as employee from './employee/index.js';
export * as attendance from './attendance/index.js';
export * as leave from './leave/index.js';
export * as payroll from './payroll/index.js';
export * as performance from './performance/index.js';
export * as training from './training/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createHrRuntime,
  type HrRuntime,
  type HrRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { Department, UnitType, DepartmentStatus } from './department/types.js';
export type { Position, PositionStatus } from './position/types.js';
export type { Employee, EmploymentType, EmploymentStatus } from './employee/types.js';
export type { WorkSession, WorkSessionStatus, AbsenceRecord, Holiday } from './attendance/types.js';
export type { LeaveRequest, LeaveType, LeaveRequestStatus, LeaveBalance } from './leave/types.js';
export type { PayrollRun, PayrollRunStatus, PayrollLineItem, PayrollAdjustment } from './payroll/types.js';
export type { ReviewPeriod, ReviewPeriodStatus, Objective, ObjectiveStatus, ObjectiveRating, Evaluation, EvaluationStatus } from './performance/types.js';
export type { Course, CourseStatus, Certification, EmployeeSkill, SkillProficiency, TrainingCompletion } from './training/types.js';

/** Real lifecycle/service ports. */
export { canTransitionDepartment, type OrganizationStructureEngine, type CreateDepartmentInput, type UpdateDepartmentInput } from './department/engine.impl.js';
export {
  canTransitionPosition,
  computeVacancy,
  type PositionManagementEngine,
  type CreatePositionInput,
  type UpdatePositionInput,
} from './position/engine.impl.js';
export {
  canTransitionEmployee,
  formatEmployeeNumber,
  type EmployeeManagementEngine,
  type HireEmployeeInput,
  type TransferEmployeeInput,
  type PromoteEmployeeInput,
  type TerminateEmployeeInput,
  type RehireEmployeeInput,
} from './employee/engine.impl.js';
export {
  STANDARD_WORK_MINUTES_PER_DAY,
  computeSessionDurationMinutes,
  computeOvertimeMinutes,
  computeLateMinutes,
  type AttendanceEngine,
  type ClockInInput,
  type ClockOutInput,
  type RecordAbsenceInput,
  type RegisterHolidayInput,
} from './attendance/engine.impl.js';
export {
  canTransitionLeaveRequest,
  computeDaysRequested,
  BALANCE_TRACKED_LEAVE_TYPES,
  DEFAULT_ALLOCATED_DAYS,
  type LeaveManagementEngine,
  type RequestLeaveInput,
  type UpsertLeaveBalanceInput,
} from './leave/engine.impl.js';
export {
  STANDARD_MONTHLY_HOURS,
  OVERTIME_MULTIPLIER,
  WORKING_DAYS_PER_MONTH,
  computePayrollLineItem,
  type PayrollPreparationEngine,
  type PreparePayrollInput,
} from './payroll/engine.impl.js';
export {
  PROMOTION_RATING_THRESHOLD,
  computeOverallRating,
  computePromotionRecommendation,
  type PerformanceManagementEngine,
  type CreateReviewPeriodInput,
  type CreateObjectiveInput,
  type CreateEvaluationInput,
} from './performance/engine.impl.js';
export {
  computeCertificationExpiry,
  type TrainingEngine,
  type CreateCourseInput,
  type CreateCertificationInput,
  type RecordSkillInput,
  type RecordCompletionInput,
} from './training/engine.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { DepartmentRepository } from './department/repository.js';
export type { PositionRepository } from './position/repository.js';
export type { EmployeeRepository } from './employee/repository.js';
export type { WorkSessionRepository, AbsenceRecordRepository, HolidayRepository } from './attendance/repository.js';
export type { LeaveRequestRepository, LeaveBalanceRepository } from './leave/repository.js';
export type { PayrollRunRepository } from './payroll/repository.js';
export type { ReviewPeriodRepository, ObjectiveRepository, EvaluationRepository } from './performance/repository.js';
export type { CourseRepository, CertificationRepository, EmployeeSkillRepository, TrainingCompletionRepository } from './training/repository.js';

/** Relationship Layer (Finance Engine / AI Workforce / Business DNA / Workflow Engine / Communication Hub / Analytics Engine / Institutional Memory integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { HrQueries } from './queries/hr-queries.js';

/** Typed event bus. */
export type { HrDomainEvent } from './events/hr-events.js';
export { HR_EVENT_NAMES } from './events/hr-events.js';
export type { HrEventBus } from './events/hr-event-bus.js';
