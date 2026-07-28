/**
 * Real {@link ProjectQueries} implementation — a CQRS read layer
 * composed over the Project Management Engine repositories.
 * Repositories are taken as constructor dependencies but never
 * returned to callers.
 *
 * @module queries/project-queries.impl
 */
import type { ProjectBudgetRepository } from '../budget/repository.js';
import type { DeliverableRepository } from '../deliverable/repository.js';
import type { MilestoneRepository, PhaseRepository, PortfolioRepository, ProgramRepository, ProjectRepository } from '../project/repository.js';
import type { ResourceAssignmentRepository } from '../resource/repository.js';
import type { ProjectRiskRepository } from '../risk/repository.js';
import type { ScheduleRepository } from '../scheduling/repository.js';
import type { ProjectTaskRepository } from '../task/repository.js';
import type { ProjectQueries } from './project-queries.js';
import type {
  FindAssignmentsQuery,
  FindAssignmentsResult,
  FindBudgetsQuery,
  FindBudgetsResult,
  FindDeliverablesQuery,
  FindDeliverablesResult,
  FindMilestonesQuery,
  FindMilestonesResult,
  FindProjectsQuery,
  FindProjectsResult,
  FindRisksQuery,
  FindRisksResult,
  FindSchedulesQuery,
  FindSchedulesResult,
  FindTasksQuery,
  FindTasksResult,
  SearchProjectsMatch,
  SearchProjectsQuery,
  SearchProjectsResult,
} from './types.js';

export interface ProjectQueriesDeps {
  readonly portfolioRepository: PortfolioRepository;
  readonly programRepository: ProgramRepository;
  readonly projectRepository: ProjectRepository;
  readonly phaseRepository: PhaseRepository;
  readonly milestoneRepository: MilestoneRepository;
  readonly taskRepository: ProjectTaskRepository;
  readonly assignmentRepository: ResourceAssignmentRepository;
  readonly scheduleRepository: ScheduleRepository;
  readonly budgetRepository: ProjectBudgetRepository;
  readonly riskRepository: ProjectRiskRepository;
  readonly deliverableRepository: DeliverableRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link ProjectQueries} read port over the given repositories. */
export function createProjectQueries(deps: ProjectQueriesDeps): ProjectQueries {
  return {
    async findProjects(query: FindProjectsQuery): Promise<FindProjectsResult> {
      let projects = query.programId
        ? await deps.projectRepository.findByProgram(query.organizationId, query.programId)
        : query.portfolioId
          ? await deps.projectRepository.findByPortfolio(query.organizationId, query.portfolioId)
          : await deps.projectRepository.findAll(query.organizationId);
      if (query.status) projects = projects.filter((project) => project.status === query.status);
      return { projects: paginate(projects, query.offset, query.limit), total: projects.length };
    },

    async findTasks(query: FindTasksQuery): Promise<FindTasksResult> {
      let tasks = query.projectId
        ? await deps.taskRepository.findByProject(query.organizationId, query.projectId)
        : await deps.taskRepository.findAll(query.organizationId);
      if (query.status) tasks = tasks.filter((task) => task.status === query.status);
      if (query.priority) tasks = tasks.filter((task) => task.priority === query.priority);
      return { tasks: paginate(tasks, query.offset, query.limit), total: tasks.length };
    },

    async findMilestones(query: FindMilestonesQuery): Promise<FindMilestonesResult> {
      let milestones = query.projectId
        ? await deps.milestoneRepository.findByProject(query.organizationId, query.projectId)
        : await deps.milestoneRepository.findAll(query.organizationId);
      if (query.status) milestones = milestones.filter((milestone) => milestone.status === query.status);
      return { milestones: paginate(milestones, query.offset, query.limit), total: milestones.length };
    },

    async findAssignments(query: FindAssignmentsQuery): Promise<FindAssignmentsResult> {
      let assignments = query.projectId
        ? await deps.assignmentRepository.findByProject(query.organizationId, query.projectId)
        : query.assigneeId
          ? await deps.assignmentRepository.findByAssignee(query.organizationId, query.assigneeId)
          : await deps.assignmentRepository.findAll(query.organizationId);
      if (query.projectId && query.assigneeId) {
        assignments = assignments.filter((assignment) => assignment.assigneeId === query.assigneeId);
      }
      return { assignments: paginate(assignments, query.offset, query.limit), total: assignments.length };
    },

    async findSchedules(query: FindSchedulesQuery): Promise<FindSchedulesResult> {
      const schedules = query.projectId
        ? await deps.scheduleRepository.findByProject(query.organizationId, query.projectId)
        : await deps.scheduleRepository.findAll(query.organizationId);
      return { schedules: paginate(schedules, query.offset, query.limit), total: schedules.length };
    },

    async findBudgets(query: FindBudgetsQuery): Promise<FindBudgetsResult> {
      let budgets = query.projectId
        ? await deps.budgetRepository.findByProject(query.organizationId, query.projectId)
        : await deps.budgetRepository.findAll(query.organizationId);
      if (query.status) budgets = budgets.filter((budget) => budget.status === query.status);
      return { budgets: paginate(budgets, query.offset, query.limit), total: budgets.length };
    },

    async findRisks(query: FindRisksQuery): Promise<FindRisksResult> {
      let risks = query.projectId
        ? await deps.riskRepository.findByProject(query.organizationId, query.projectId)
        : await deps.riskRepository.findAll(query.organizationId);
      if (query.status) risks = risks.filter((risk) => risk.status === query.status);
      return { risks: paginate(risks, query.offset, query.limit), total: risks.length };
    },

    async findDeliverables(query: FindDeliverablesQuery): Promise<FindDeliverablesResult> {
      let deliverables = query.projectId
        ? await deps.deliverableRepository.findByProject(query.organizationId, query.projectId)
        : await deps.deliverableRepository.findAll(query.organizationId);
      if (query.status) deliverables = deliverables.filter((deliverable) => deliverable.status === query.status);
      return { deliverables: paginate(deliverables, query.offset, query.limit), total: deliverables.length };
    },

    async searchProjects(query: SearchProjectsQuery): Promise<SearchProjectsResult> {
      const [projects, tasks, milestones, deliverables] = await Promise.all([
        deps.projectRepository.findAll(query.organizationId),
        deps.taskRepository.findAll(query.organizationId),
        deps.milestoneRepository.findAll(query.organizationId),
        deps.deliverableRepository.findAll(query.organizationId),
      ]);

      const matches: SearchProjectsMatch[] = [];
      for (const project of projects) {
        const score = Math.max(scoreLabel(project.name, query.keyword), scoreLabel(project.code, query.keyword));
        if (score > 0) matches.push({ recordType: 'project', id: project.id, label: project.name, score });
      }
      for (const task of tasks) {
        const score = scoreLabel(task.title, query.keyword);
        if (score > 0) matches.push({ recordType: 'task', id: task.id, label: task.title, score });
      }
      for (const milestone of milestones) {
        const score = scoreLabel(milestone.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'milestone', id: milestone.id, label: milestone.name, score });
      }
      for (const deliverable of deliverables) {
        const score = scoreLabel(deliverable.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'deliverable', id: deliverable.id, label: deliverable.name, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
