/**
 * HR Runtime — the package's composition root. Wires every real
 * in-memory repository and service together: Organization Structure
 * (departments/business units/divisions), Position Management,
 * Employee Management (composed with Position Management for
 * headcount), the Attendance Engine, Leave Management, Payroll
 * Preparation (composed with Employee/Attendance/Leave), Performance
 * Management, the Training Engine, the Relationship Layer (the only
 * integration point with Finance Engine, AI Workforce, Business DNA,
 * Workflow Engine, Communication Hub, Analytics Engine, and
 * Institutional Memory), the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link HrRuntime} surface.
 *
 * @module runtime
 */
import { createAbsenceRecordRepository, createAttendanceEngine, createHolidayRepository, createWorkSessionRepository, type AttendanceEngine } from './attendance/index.js';
import { createDepartmentRepository, createOrganizationStructureEngine, type OrganizationStructureEngine } from './department/index.js';
import { createEmployeeManagementEngine, createEmployeeRepository, type EmployeeManagementEngine } from './employee/index.js';
import { createHrEventBus, type HrEventBus } from './events/index.js';
import { createLeaveBalanceRepository, createLeaveManagementEngine, createLeaveRequestRepository, type LeaveManagementEngine } from './leave/index.js';
import { createPayrollPreparationEngine, createPayrollRunRepository, type PayrollPreparationEngine } from './payroll/index.js';
import {
  createEvaluationRepository,
  createObjectiveRepository,
  createPerformanceManagementEngine,
  createReviewPeriodRepository,
  type PerformanceManagementEngine,
} from './performance/index.js';
import { createPositionManagementEngine, createPositionRepository, type PositionManagementEngine } from './position/index.js';
import { createHrQueries, type HrQueries } from './queries/index.js';
import { createRelationshipManagement, type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';
import { nowIso } from './shared/id.js';
import {
  createCertificationRepository,
  createCourseRepository,
  createEmployeeSkillRepository,
  createTrainingCompletionRepository,
  createTrainingEngine,
  type TrainingEngine,
} from './training/index.js';

export interface HrRuntimeDeps {
  readonly eventBus?: HrEventBus;
  readonly now?: () => string;
  readonly finance?: RelationshipManagementDeps['finance'];
  readonly aiWorkforce?: RelationshipManagementDeps['aiWorkforce'];
  readonly businessDna?: RelationshipManagementDeps['businessDna'];
  readonly workflow?: RelationshipManagementDeps['workflow'];
  readonly communicationHub?: RelationshipManagementDeps['communicationHub'];
  readonly analytics?: RelationshipManagementDeps['analytics'];
  readonly institutionalMemory?: RelationshipManagementDeps['institutionalMemory'];
}

export interface HrRuntime {
  readonly organizationStructure: OrganizationStructureEngine;
  readonly positions: PositionManagementEngine;
  readonly employees: EmployeeManagementEngine;
  readonly attendance: AttendanceEngine;
  readonly leave: LeaveManagementEngine;
  readonly payroll: PayrollPreparationEngine;
  readonly performance: PerformanceManagementEngine;
  readonly training: TrainingEngine;
  readonly relationships: RelationshipManagement;
  readonly queries: HrQueries;
  /** Typed event bus — subscribe to employee/attendance/leave/performance/training/payroll events. */
  readonly events: HrEventBus;
}

/** Creates a real, in-memory {@link HrRuntime}. */
export function createHrRuntime(deps: HrRuntimeDeps = {}): HrRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createHrEventBus();

  const departmentRepository = createDepartmentRepository();
  const positionRepository = createPositionRepository();
  const employeeRepository = createEmployeeRepository();
  const workSessionRepository = createWorkSessionRepository();
  const absenceRepository = createAbsenceRecordRepository();
  const holidayRepository = createHolidayRepository();
  const leaveRequestRepository = createLeaveRequestRepository();
  const leaveBalanceRepository = createLeaveBalanceRepository();
  const payrollRunRepository = createPayrollRunRepository();
  const reviewPeriodRepository = createReviewPeriodRepository();
  const objectiveRepository = createObjectiveRepository();
  const evaluationRepository = createEvaluationRepository();
  const courseRepository = createCourseRepository();
  const certificationRepository = createCertificationRepository();
  const employeeSkillRepository = createEmployeeSkillRepository();
  const trainingCompletionRepository = createTrainingCompletionRepository();

  const organizationStructure = createOrganizationStructureEngine(departmentRepository, now);
  const positions = createPositionManagementEngine(positionRepository, now);
  const employees = createEmployeeManagementEngine(employeeRepository, departmentRepository, positions, eventBus, now);
  const attendance = createAttendanceEngine(workSessionRepository, absenceRepository, holidayRepository, eventBus, now);
  const leave = createLeaveManagementEngine(leaveRequestRepository, leaveBalanceRepository, eventBus, now);
  const payroll = createPayrollPreparationEngine(payrollRunRepository, employeeRepository, workSessionRepository, leaveRequestRepository, eventBus, now);
  const performance = createPerformanceManagementEngine(reviewPeriodRepository, objectiveRepository, evaluationRepository, eventBus, now);
  const training = createTrainingEngine(courseRepository, certificationRepository, employeeSkillRepository, trainingCompletionRepository, eventBus, now);

  const relationships = createRelationshipManagement({
    finance: deps.finance,
    aiWorkforce: deps.aiWorkforce,
    businessDna: deps.businessDna,
    workflow: deps.workflow,
    communicationHub: deps.communicationHub,
    analytics: deps.analytics,
    institutionalMemory: deps.institutionalMemory,
  });

  const queries = createHrQueries({
    employeeRepository,
    departmentRepository,
    workSessionRepository,
    leaveRequestRepository,
    payrollRunRepository,
    evaluationRepository,
    trainingCompletionRepository,
    courseRepository,
  });

  return {
    organizationStructure,
    positions,
    employees,
    attendance,
    leave,
    payroll,
    performance,
    training,
    relationships,
    queries,
    events: eventBus,
  };
}
