/**
 * Project Runtime — the package's composition root. Wires every real
 * in-memory repository and service together: Project Structure
 * (portfolios, programs, projects, phases, milestones), Task
 * Management (composed with dependency-cycle guards), Resource
 * Planning, the Scheduling Engine (deterministic CPM), Time Tracking,
 * Budget Tracking, Material Planning, Project Risks, Deliverables,
 * the Relationship Layer (the only integration point with CRM Engine,
 * HR Engine, Finance Engine, Inventory Engine, Workflow Engine,
 * Communication Hub, Analytics Engine, Business DNA, and
 * Institutional Memory), the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link ProjectRuntime} surface.
 *
 * @module runtime
 */
import { createBudgetTrackingEngine, createProjectBudgetRepository, type BudgetTrackingEngine } from './budget/index.js';
import { createDeliverableEngine, createDeliverableRepository, type DeliverableEngine } from './deliverable/index.js';
import { createProjectEventBus, type ProjectEventBus } from './events/index.js';
import { createMaterialPlanningEngine, createMaterialRequirementRepository, type MaterialPlanningEngine } from './material/index.js';
import {
  createMilestoneRepository,
  createPhaseRepository,
  createPortfolioRepository,
  createProgramRepository,
  createProjectRepository,
  createProjectStructureEngine,
  type ProjectStructureEngine,
} from './project/index.js';
import { createProjectQueries, type ProjectQueries } from './queries/index.js';
import { createRelationshipManagement, type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';
import { createResourceAssignmentRepository, createResourcePlanningEngine, type ResourcePlanningEngine } from './resource/index.js';
import { createProjectRiskEngine, createProjectRiskRepository, type ProjectRiskEngine } from './risk/index.js';
import { createScheduleRepository, createSchedulingEngine, type SchedulingEngine } from './scheduling/index.js';
import { nowIso } from './shared/id.js';
import { createProjectTaskRepository, createTaskManagementEngine, type TaskManagementEngine } from './task/index.js';
import { createTimeTrackingEngine, createWorkLogRepository, type TimeTrackingEngine } from './timetracking/index.js';

export interface ProjectRuntimeDeps {
  readonly eventBus?: ProjectEventBus;
  readonly now?: () => string;
  readonly crm?: RelationshipManagementDeps['crm'];
  readonly hr?: RelationshipManagementDeps['hr'];
  readonly finance?: RelationshipManagementDeps['finance'];
  readonly inventory?: RelationshipManagementDeps['inventory'];
  readonly workflow?: RelationshipManagementDeps['workflow'];
  readonly communicationHub?: RelationshipManagementDeps['communicationHub'];
  readonly analytics?: RelationshipManagementDeps['analytics'];
  readonly businessDna?: RelationshipManagementDeps['businessDna'];
  readonly institutionalMemory?: RelationshipManagementDeps['institutionalMemory'];
}

export interface ProjectRuntime {
  readonly projects: ProjectStructureEngine;
  readonly tasks: TaskManagementEngine;
  readonly resources: ResourcePlanningEngine;
  readonly scheduling: SchedulingEngine;
  readonly timeTracking: TimeTrackingEngine;
  readonly budgets: BudgetTrackingEngine;
  readonly materials: MaterialPlanningEngine;
  readonly risks: ProjectRiskEngine;
  readonly deliverables: DeliverableEngine;
  readonly relationships: RelationshipManagement;
  readonly queries: ProjectQueries;
  /** Typed event bus — subscribe to project/task/resource/budget/risk/deliverable events. */
  readonly events: ProjectEventBus;
}

/** Creates a real, in-memory {@link ProjectRuntime}. */
export function createProjectRuntime(deps: ProjectRuntimeDeps = {}): ProjectRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createProjectEventBus();

  const portfolioRepository = createPortfolioRepository();
  const programRepository = createProgramRepository();
  const projectRepository = createProjectRepository();
  const phaseRepository = createPhaseRepository();
  const milestoneRepository = createMilestoneRepository();

  const taskRepository = createProjectTaskRepository();
  const assignmentRepository = createResourceAssignmentRepository();
  const scheduleRepository = createScheduleRepository();
  const workLogRepository = createWorkLogRepository();
  const budgetRepository = createProjectBudgetRepository();
  const materialRepository = createMaterialRequirementRepository();
  const riskRepository = createProjectRiskRepository();
  const deliverableRepository = createDeliverableRepository();

  const projects = createProjectStructureEngine(portfolioRepository, programRepository, projectRepository, phaseRepository, milestoneRepository, eventBus, now);
  const tasks = createTaskManagementEngine(taskRepository, eventBus, now);
  const resources = createResourcePlanningEngine(assignmentRepository, eventBus, now);
  const scheduling = createSchedulingEngine(scheduleRepository, now);
  const timeTracking = createTimeTrackingEngine(workLogRepository, now);
  const budgets = createBudgetTrackingEngine(budgetRepository, eventBus, now);
  const materials = createMaterialPlanningEngine(materialRepository, now);
  const risks = createProjectRiskEngine(riskRepository, eventBus, now);
  const deliverables = createDeliverableEngine(deliverableRepository, eventBus, now);

  const relationships = createRelationshipManagement({
    crm: deps.crm,
    hr: deps.hr,
    finance: deps.finance,
    inventory: deps.inventory,
    workflow: deps.workflow,
    communicationHub: deps.communicationHub,
    analytics: deps.analytics,
    businessDna: deps.businessDna,
    institutionalMemory: deps.institutionalMemory,
  });

  const queries = createProjectQueries({
    portfolioRepository,
    programRepository,
    projectRepository,
    phaseRepository,
    milestoneRepository,
    taskRepository,
    assignmentRepository,
    scheduleRepository,
    budgetRepository,
    riskRepository,
    deliverableRepository,
  });

  return {
    projects,
    tasks,
    resources,
    scheduling,
    timeTracking,
    budgets,
    materials,
    risks,
    deliverables,
    relationships,
    queries,
    events: eventBus,
  };
}
