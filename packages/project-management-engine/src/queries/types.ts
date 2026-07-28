/** @module queries/types */
import type { ProjectBudget, ProjectBudgetId, ProjectBudgetStatus } from '../budget/types.js';
import type { Deliverable, DeliverableId, DeliverableStatus } from '../deliverable/types.js';
import type { Milestone, MilestoneId, MilestoneStatus, PhaseId, PortfolioId, ProgramId, Project, ProjectId, ProjectStatus } from '../project/types.js';
import type { ResourceAssignment, ResourceAssignmentId } from '../resource/types.js';
import type { ProjectRisk, ProjectRiskId, RiskStatus } from '../risk/types.js';
import type { Schedule, ScheduleId } from '../scheduling/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { ProjectTask, ProjectTaskId, TaskPriority, TaskStatus } from '../task/types.js';

export interface FindProjectsQuery extends OrganizationScopedQuery {
  readonly portfolioId?: PortfolioId;
  readonly programId?: ProgramId;
  readonly status?: ProjectStatus;
}

export interface FindProjectsResult {
  readonly projects: readonly Project[];
  readonly total: number;
}

export interface FindTasksQuery extends OrganizationScopedQuery {
  readonly projectId?: ProjectId;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
}

export interface FindTasksResult {
  readonly tasks: readonly ProjectTask[];
  readonly total: number;
}

export interface FindMilestonesQuery extends OrganizationScopedQuery {
  readonly projectId?: ProjectId;
  readonly status?: MilestoneStatus;
}

export interface FindMilestonesResult {
  readonly milestones: readonly Milestone[];
  readonly total: number;
}

export interface FindAssignmentsQuery extends OrganizationScopedQuery {
  readonly projectId?: ProjectId;
  readonly assigneeId?: string;
}

export interface FindAssignmentsResult {
  readonly assignments: readonly ResourceAssignment[];
  readonly total: number;
}

export interface FindSchedulesQuery extends OrganizationScopedQuery {
  readonly projectId?: ProjectId;
}

export interface FindSchedulesResult {
  readonly schedules: readonly Schedule[];
  readonly total: number;
}

export interface FindBudgetsQuery extends OrganizationScopedQuery {
  readonly projectId?: ProjectId;
  readonly status?: ProjectBudgetStatus;
}

export interface FindBudgetsResult {
  readonly budgets: readonly ProjectBudget[];
  readonly total: number;
}

export interface FindRisksQuery extends OrganizationScopedQuery {
  readonly projectId?: ProjectId;
  readonly status?: RiskStatus;
}

export interface FindRisksResult {
  readonly risks: readonly ProjectRisk[];
  readonly total: number;
}

export interface FindDeliverablesQuery extends OrganizationScopedQuery {
  readonly projectId?: ProjectId;
  readonly status?: DeliverableStatus;
}

export interface FindDeliverablesResult {
  readonly deliverables: readonly Deliverable[];
  readonly total: number;
}

export interface SearchProjectsQuery extends OrganizationScopedQuery {
  readonly keyword: string;
}

export type SearchProjectsRecordType = 'project' | 'task' | 'milestone' | 'deliverable';

export interface SearchProjectsMatch {
  readonly recordType: SearchProjectsRecordType;
  readonly id: ProjectId | ProjectTaskId | MilestoneId | DeliverableId | PhaseId | ResourceAssignmentId | ScheduleId | ProjectBudgetId | ProjectRiskId;
  readonly label: string;
  readonly score: number;
}

export interface SearchProjectsResult {
  readonly matches: readonly SearchProjectsMatch[];
  readonly total: number;
}

export type { OrganizationId };
