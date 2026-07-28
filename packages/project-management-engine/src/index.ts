/**
 * @lateen-os/project-management-engine — Project Management Engine
 *
 * Project Structure (portfolios, programs, projects, phases,
 * milestones), Task Management, Resource Planning, the Scheduling
 * Engine (deterministic CPM), Time Tracking, Budget Tracking,
 * Material Planning, Project Risks, and Deliverables for Lateen OS.
 * Real, deterministic, offline implementation — see `runtime.ts`'s
 * `createProjectRuntime()` for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as project from './project/index.js';
export * as task from './task/index.js';
export * as resource from './resource/index.js';
export * as scheduling from './scheduling/index.js';
export * as timeTracking from './timetracking/index.js';
export * as budget from './budget/index.js';
export * as material from './material/index.js';
export * as risk from './risk/index.js';
export * as deliverable from './deliverable/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createProjectRuntime,
  type ProjectRuntime,
  type ProjectRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { Portfolio, PortfolioStatus, Program, ProgramStatus, Project, ProjectStatus, Phase, PhaseStatus, Milestone, MilestoneStatus } from './project/types.js';
export type { ProjectTask, TaskStatus, TaskPriority } from './task/types.js';
export type { ResourceAssignment, ResourceAssignmentStatus, AssigneeType } from './resource/types.js';
export type { Schedule, ScheduleEntry } from './scheduling/types.js';
export type { WorkLog } from './timetracking/types.js';
export type { ProjectBudget, ProjectBudgetStatus } from './budget/types.js';
export type { MaterialRequirement, MaterialRequirementStatus } from './material/types.js';
export type { ProjectRisk, RiskStatus, RiskLevel } from './risk/types.js';
export type { Deliverable, DeliverableStatus, DeliverableApproval } from './deliverable/types.js';

/** Real lifecycle/service ports. */
export {
  canTransitionProject,
  canTransitionPhase,
  canTransitionMilestone,
  type ProjectStructureEngine,
  type CreatePortfolioInput,
  type UpdatePortfolioInput,
  type CreateProgramInput,
  type UpdateProgramInput,
  type CreateProjectInput,
  type UpdateProjectInput,
  type CancelProjectInput,
  type CreatePhaseInput,
  type CreateMilestoneInput,
} from './project/engine.impl.js';
export {
  canTransitionTask,
  wouldCreateCycle,
  type TaskManagementEngine,
  type CreateProjectTaskInput,
  type UpdateProjectTaskInput,
} from './task/engine.impl.js';
export {
  DEFAULT_CAPACITY_PERCENTAGE,
  computeTotalAllocation,
  computeRemainingCapacity,
  isOverAllocated,
  type ResourcePlanningEngine,
  type AssignResourceInput,
} from './resource/engine.impl.js';
export {
  computeCriticalPathSchedule,
  type SchedulingEngine,
  type ScheduleTaskInput,
  type ComputeScheduleInput,
} from './scheduling/engine.impl.js';
export {
  STANDARD_WORK_HOURS_PER_DAY,
  computeIsOvertime,
  computeActualHours,
  computeUtilizationPercentage,
  type TimeTrackingEngine,
  type LogWorkInput,
} from './timetracking/engine.impl.js';
export {
  computeRemainingBudget,
  computeCostVariance,
  type BudgetTrackingEngine,
  type CreateProjectBudgetInput,
} from './budget/engine.impl.js';
export {
  computeShortage,
  type MaterialPlanningEngine,
  type CreateMaterialRequirementInput,
} from './material/engine.impl.js';
export {
  canTransitionRisk,
  computeRiskScore,
  computeRiskLevel,
  type ProjectRiskEngine,
  type CreateProjectRiskInput,
  type UpdateProjectRiskInput,
} from './risk/engine.impl.js';
export {
  canTransitionDeliverable,
  type DeliverableEngine,
  type CreateDeliverableInput,
  type UpdateDeliverableInput,
  type ApproveDeliverableInput,
} from './deliverable/engine.impl.js';


/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { PortfolioRepository, ProgramRepository, ProjectRepository, PhaseRepository, MilestoneRepository } from './project/repository.js';
export type { ProjectTaskRepository } from './task/repository.js';
export type { ResourceAssignmentRepository } from './resource/repository.js';
export type { ScheduleRepository } from './scheduling/repository.js';
export type { WorkLogRepository } from './timetracking/repository.js';
export type { ProjectBudgetRepository } from './budget/repository.js';
export type { MaterialRequirementRepository } from './material/repository.js';
export type { ProjectRiskRepository } from './risk/repository.js';
export type { DeliverableRepository } from './deliverable/repository.js';

/** Relationship Layer (CRM Engine / HR Engine / Finance Engine / Inventory Engine / Workflow Engine / Communication Hub / Analytics Engine / Business DNA / Institutional Memory integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { ProjectQueries } from './queries/project-queries.js';

/** Typed event bus. */
export type { ProjectDomainEvent } from './events/project-events.js';
export { PROJECT_EVENT_NAMES } from './events/project-events.js';
export type { ProjectEventBus } from './events/project-event-bus.js';
