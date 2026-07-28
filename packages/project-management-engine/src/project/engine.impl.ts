/**
 * Real Project Structure engine — portfolios, programs, projects,
 * phases, and milestones, with a guarded
 * create/update/archive/restore/start/pause/resume/complete/cancel
 * lifecycle for projects, plus simple lifecycles for the surrounding
 * hierarchy.
 *
 * @module project/engine.impl
 */
import type { ProjectEventBus } from '../events/project-event-bus.js';
import {
  DuplicateProjectCodeError,
  InvalidMilestoneTransitionError,
  InvalidPhaseTransitionError,
  InvalidProjectTransitionError,
  MilestoneNotFoundError,
  PhaseNotFoundError,
  PortfolioNotFoundError,
  ProgramNotFoundError,
  ProjectNotFoundError,
} from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MilestoneId, OrganizationId, PhaseId, PortfolioId, ProgramId, ProjectId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { MilestoneRepository, PhaseRepository, PortfolioRepository, ProgramRepository, ProjectRepository } from './repository.js';
import type { Milestone, MilestoneStatus, Phase, PhaseStatus, Portfolio, Program, Project, ProjectStatus } from './types.js';

const PROJECT_TRANSITIONS: Readonly<Record<ProjectStatus, readonly ProjectStatus[]>> = {
  draft: ['active', 'cancelled', 'archived'],
  active: ['on_hold', 'completed', 'cancelled', 'archived'],
  on_hold: ['active', 'cancelled', 'archived'],
  completed: ['archived'],
  cancelled: ['archived'],
  // Archived is a dead end for ordinary transitions — restore() is a distinct
  // operation (below) that returns a project to its pre-archive status.
  archived: [],
};

/** Whether a project may transition from one status to another via the ordinary lifecycle (not `restore()`). */
export function canTransitionProject(from: ProjectStatus, to: ProjectStatus): boolean {
  return PROJECT_TRANSITIONS[from].includes(to);
}

const PHASE_TRANSITIONS: Readonly<Record<PhaseStatus, readonly PhaseStatus[]>> = {
  planned: ['active'],
  active: ['completed'],
  completed: [],
};

/** Whether a phase may transition from one status to another. */
export function canTransitionPhase(from: PhaseStatus, to: PhaseStatus): boolean {
  return PHASE_TRANSITIONS[from].includes(to);
}

const MILESTONE_TRANSITIONS: Readonly<Record<MilestoneStatus, readonly MilestoneStatus[]>> = {
  pending: ['reached', 'missed'],
  reached: [],
  missed: [],
};

/** Whether a milestone may transition from one status to another. */
export function canTransitionMilestone(from: MilestoneStatus, to: MilestoneStatus): boolean {
  return MILESTONE_TRANSITIONS[from].includes(to);
}

export interface CreatePortfolioInput {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
}

export interface UpdatePortfolioInput {
  readonly name?: string;
  readonly description?: string;
}

export interface CreateProgramInput {
  readonly code: string;
  readonly name: string;
  readonly portfolioId?: PortfolioId;
  readonly description?: string;
}

export interface UpdateProgramInput {
  readonly name?: string;
  readonly description?: string;
  readonly portfolioId?: PortfolioId;
}

export interface CreateProjectInput {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly portfolioId?: PortfolioId;
  readonly programId?: ProgramId;
  readonly customerId?: string;
  readonly ownerId?: string;
  readonly startDate?: ISODate;
  readonly targetEndDate?: ISODate;
}

export interface UpdateProjectInput {
  readonly name?: string;
  readonly description?: string;
  readonly ownerId?: string;
  readonly startDate?: ISODate;
  readonly targetEndDate?: ISODate;
}

export interface CancelProjectInput {
  readonly reason?: string;
}

export interface CreatePhaseInput {
  readonly projectId: ProjectId;
  readonly name: string;
  readonly sequence: number;
  readonly startDate?: ISODate;
  readonly endDate?: ISODate;
}

export interface CreateMilestoneInput {
  readonly projectId: ProjectId;
  readonly phaseId?: PhaseId;
  readonly name: string;
  readonly targetDate: ISODate;
}

export interface ProjectStructureEngine {
  createPortfolio(organizationId: OrganizationId, input: CreatePortfolioInput): Promise<Portfolio>;
  updatePortfolio(organizationId: OrganizationId, portfolioId: PortfolioId, input: UpdatePortfolioInput): Promise<Portfolio>;
  archivePortfolio(organizationId: OrganizationId, portfolioId: PortfolioId): Promise<Portfolio>;
  restorePortfolio(organizationId: OrganizationId, portfolioId: PortfolioId): Promise<Portfolio>;
  getPortfolio(organizationId: OrganizationId, portfolioId: PortfolioId): Promise<Portfolio | null>;
  listPortfolios(organizationId: OrganizationId): Promise<readonly Portfolio[]>;

  createProgram(organizationId: OrganizationId, input: CreateProgramInput): Promise<Program>;
  updateProgram(organizationId: OrganizationId, programId: ProgramId, input: UpdateProgramInput): Promise<Program>;
  archiveProgram(organizationId: OrganizationId, programId: ProgramId): Promise<Program>;
  restoreProgram(organizationId: OrganizationId, programId: ProgramId): Promise<Program>;
  getProgram(organizationId: OrganizationId, programId: ProgramId): Promise<Program | null>;
  listPrograms(organizationId: OrganizationId): Promise<readonly Program[]>;
  findProgramsByPortfolio(organizationId: OrganizationId, portfolioId: PortfolioId): Promise<readonly Program[]>;

  create(organizationId: OrganizationId, input: CreateProjectInput): Promise<Project>;
  update(organizationId: OrganizationId, projectId: ProjectId, input: UpdateProjectInput): Promise<Project>;
  start(organizationId: OrganizationId, projectId: ProjectId): Promise<Project>;
  pause(organizationId: OrganizationId, projectId: ProjectId): Promise<Project>;
  resume(organizationId: OrganizationId, projectId: ProjectId): Promise<Project>;
  complete(organizationId: OrganizationId, projectId: ProjectId): Promise<Project>;
  cancel(organizationId: OrganizationId, projectId: ProjectId, input?: CancelProjectInput): Promise<Project>;
  archive(organizationId: OrganizationId, projectId: ProjectId): Promise<Project>;
  restore(organizationId: OrganizationId, projectId: ProjectId): Promise<Project>;
  get(organizationId: OrganizationId, projectId: ProjectId): Promise<Project | null>;
  list(organizationId: OrganizationId): Promise<readonly Project[]>;
  findByProgram(organizationId: OrganizationId, programId: ProgramId): Promise<readonly Project[]>;
  findByPortfolio(organizationId: OrganizationId, portfolioId: PortfolioId): Promise<readonly Project[]>;
  findByStatus(organizationId: OrganizationId, status: ProjectStatus): Promise<readonly Project[]>;
  findByCode(organizationId: OrganizationId, code: string): Promise<Project | null>;

  createPhase(organizationId: OrganizationId, input: CreatePhaseInput): Promise<Phase>;
  startPhase(organizationId: OrganizationId, phaseId: PhaseId): Promise<Phase>;
  completePhase(organizationId: OrganizationId, phaseId: PhaseId): Promise<Phase>;
  getPhase(organizationId: OrganizationId, phaseId: PhaseId): Promise<Phase | null>;
  listPhasesForProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly Phase[]>;

  createMilestone(organizationId: OrganizationId, input: CreateMilestoneInput): Promise<Milestone>;
  reachMilestone(organizationId: OrganizationId, milestoneId: MilestoneId, actualDate: ISODate): Promise<Milestone>;
  missMilestone(organizationId: OrganizationId, milestoneId: MilestoneId): Promise<Milestone>;
  getMilestone(organizationId: OrganizationId, milestoneId: MilestoneId): Promise<Milestone | null>;
  listMilestonesForProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly Milestone[]>;
}

/** Creates a real {@link ProjectStructureEngine}. */
export function createProjectStructureEngine(
  portfolioRepository: PortfolioRepository,
  programRepository: ProgramRepository,
  projectRepository: ProjectRepository,
  phaseRepository: PhaseRepository,
  milestoneRepository: MilestoneRepository,
  eventBus?: ProjectEventBus,
  now: () => string = nowIso,
): ProjectStructureEngine {
  async function requirePortfolio(organizationId: OrganizationId, portfolioId: PortfolioId): Promise<Portfolio> {
    const portfolio = await portfolioRepository.findById(organizationId, portfolioId);
    if (!portfolio) throw new PortfolioNotFoundError(portfolioId);
    return portfolio;
  }

  async function requireProgram(organizationId: OrganizationId, programId: ProgramId): Promise<Program> {
    const program = await programRepository.findById(organizationId, programId);
    if (!program) throw new ProgramNotFoundError(programId);
    return program;
  }

  async function requireProject(organizationId: OrganizationId, projectId: ProjectId): Promise<Project> {
    const project = await projectRepository.findById(organizationId, projectId);
    if (!project) throw new ProjectNotFoundError(projectId);
    return project;
  }

  async function requirePhase(organizationId: OrganizationId, phaseId: PhaseId): Promise<Phase> {
    const phase = await phaseRepository.findById(organizationId, phaseId);
    if (!phase) throw new PhaseNotFoundError(phaseId);
    return phase;
  }

  async function requireMilestone(organizationId: OrganizationId, milestoneId: MilestoneId): Promise<Milestone> {
    const milestone = await milestoneRepository.findById(organizationId, milestoneId);
    if (!milestone) throw new MilestoneNotFoundError(milestoneId);
    return milestone;
  }

  async function transitionProject(organizationId: OrganizationId, projectId: ProjectId, to: ProjectStatus): Promise<Project> {
    const project = await requireProject(organizationId, projectId);
    if (!canTransitionProject(project.status, to)) {
      throw new InvalidProjectTransitionError(projectId, project.status, to);
    }
    const updated: Project = {
      ...project,
      status: to,
      statusBeforeArchive: to === 'archived' ? project.status : project.statusBeforeArchive,
      actualEndDate: to === 'completed' ? now().slice(0, 10) : project.actualEndDate,
      currentVersion: project.currentVersion + 1,
      updatedAt: now(),
    };
    await projectRepository.save(updated);
    return updated;
  }

  return {
    async createPortfolio(organizationId, input) {
      const timestamp = now();
      const portfolio: Portfolio = {
        id: generateId('portfolio'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        code: input.code,
        name: input.name,
        description: input.description,
        status: 'active',
      };
      await portfolioRepository.save(portfolio);
      return portfolio;
    },

    async updatePortfolio(organizationId, portfolioId, input) {
      const portfolio = await requirePortfolio(organizationId, portfolioId);
      const updated: Portfolio = { ...portfolio, name: input.name ?? portfolio.name, description: input.description ?? portfolio.description, updatedAt: now() };
      await portfolioRepository.save(updated);
      return updated;
    },

    async archivePortfolio(organizationId, portfolioId) {
      const portfolio = await requirePortfolio(organizationId, portfolioId);
      const updated: Portfolio = { ...portfolio, status: 'archived', updatedAt: now() };
      await portfolioRepository.save(updated);
      return updated;
    },

    async restorePortfolio(organizationId, portfolioId) {
      const portfolio = await requirePortfolio(organizationId, portfolioId);
      const updated: Portfolio = { ...portfolio, status: 'active', updatedAt: now() };
      await portfolioRepository.save(updated);
      return updated;
    },

    async getPortfolio(organizationId, portfolioId) {
      return portfolioRepository.findById(organizationId, portfolioId);
    },

    async listPortfolios(organizationId) {
      return portfolioRepository.findAll(organizationId);
    },

    async createProgram(organizationId, input) {
      const timestamp = now();
      const program: Program = {
        id: generateId('program'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        code: input.code,
        name: input.name,
        portfolioId: input.portfolioId,
        description: input.description,
        status: 'active',
      };
      await programRepository.save(program);
      return program;
    },

    async updateProgram(organizationId, programId, input) {
      const program = await requireProgram(organizationId, programId);
      const updated: Program = {
        ...program,
        name: input.name ?? program.name,
        description: input.description ?? program.description,
        portfolioId: input.portfolioId ?? program.portfolioId,
        updatedAt: now(),
      };
      await programRepository.save(updated);
      return updated;
    },

    async archiveProgram(organizationId, programId) {
      const program = await requireProgram(organizationId, programId);
      const updated: Program = { ...program, status: 'archived', updatedAt: now() };
      await programRepository.save(updated);
      return updated;
    },

    async restoreProgram(organizationId, programId) {
      const program = await requireProgram(organizationId, programId);
      const updated: Program = { ...program, status: 'active', updatedAt: now() };
      await programRepository.save(updated);
      return updated;
    },

    async getProgram(organizationId, programId) {
      return programRepository.findById(organizationId, programId);
    },

    async listPrograms(organizationId) {
      return programRepository.findAll(organizationId);
    },

    async findProgramsByPortfolio(organizationId, portfolioId) {
      return programRepository.findByPortfolio(organizationId, portfolioId);
    },

    async create(organizationId, input) {
      const existing = await projectRepository.findByCode(organizationId, input.code);
      if (existing) throw new DuplicateProjectCodeError(input.code);

      const timestamp = now();
      const project: Project = {
        id: generateId('project'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        code: input.code,
        name: input.name,
        description: input.description,
        portfolioId: input.portfolioId,
        programId: input.programId,
        customerId: input.customerId,
        ownerId: input.ownerId,
        startDate: input.startDate,
        targetEndDate: input.targetEndDate,
        status: 'draft',
        currentVersion: 1,
      };
      await projectRepository.save(project);
      eventBus?.publish('project.created', { organizationId, projectId: project.id, name: project.name });
      return project;
    },

    async update(organizationId, projectId, input) {
      const project = await requireProject(organizationId, projectId);
      if (project.status === 'archived') {
        throw new InvalidProjectTransitionError(projectId, project.status, project.status);
      }
      const updated: Project = {
        ...project,
        name: input.name ?? project.name,
        description: input.description ?? project.description,
        ownerId: input.ownerId ?? project.ownerId,
        startDate: input.startDate ?? project.startDate,
        targetEndDate: input.targetEndDate ?? project.targetEndDate,
        currentVersion: project.currentVersion + 1,
        updatedAt: now(),
      };
      await projectRepository.save(updated);
      return updated;
    },

    async start(organizationId, projectId) {
      const updated = await transitionProject(organizationId, projectId, 'active');
      eventBus?.publish('project.started', { organizationId, projectId });
      return updated;
    },

    async pause(organizationId, projectId) {
      return transitionProject(organizationId, projectId, 'on_hold');
    },

    async resume(organizationId, projectId) {
      return transitionProject(organizationId, projectId, 'active');
    },

    async complete(organizationId, projectId) {
      const updated = await transitionProject(organizationId, projectId, 'completed');
      eventBus?.publish('project.completed', { organizationId, projectId });
      return updated;
    },

    async cancel(organizationId, projectId, input) {
      const updated = await transitionProject(organizationId, projectId, 'cancelled');
      eventBus?.publish('project.cancelled', { organizationId, projectId, reason: input?.reason });
      return updated;
    },

    async archive(organizationId, projectId) {
      return transitionProject(organizationId, projectId, 'archived');
    },

    async restore(organizationId, projectId) {
      const project = await requireProject(organizationId, projectId);
      if (project.status !== 'archived') {
        throw new InvalidProjectTransitionError(projectId, project.status, project.statusBeforeArchive ?? 'draft');
      }
      const to = project.statusBeforeArchive ?? 'draft';
      const updated: Project = { ...project, status: to, currentVersion: project.currentVersion + 1, updatedAt: now() };
      await projectRepository.save(updated);
      return updated;
    },

    async get(organizationId, projectId) {
      return projectRepository.findById(organizationId, projectId);
    },

    async list(organizationId) {
      return projectRepository.findAll(organizationId);
    },

    async findByProgram(organizationId, programId) {
      return projectRepository.findByProgram(organizationId, programId);
    },

    async findByPortfolio(organizationId, portfolioId) {
      return projectRepository.findByPortfolio(organizationId, portfolioId);
    },

    async findByStatus(organizationId, status) {
      return projectRepository.findByStatus(organizationId, status);
    },

    async findByCode(organizationId, code) {
      return projectRepository.findByCode(organizationId, code);
    },

    async createPhase(organizationId, input) {
      const timestamp = now();
      const phase: Phase = {
        id: generateId('phase'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: input.projectId,
        name: input.name,
        sequence: input.sequence,
        startDate: input.startDate,
        endDate: input.endDate,
        status: 'planned',
      };
      await phaseRepository.save(phase);
      return phase;
    },

    async startPhase(organizationId, phaseId) {
      const phase = await requirePhase(organizationId, phaseId);
      if (!canTransitionPhase(phase.status, 'active')) {
        throw new InvalidPhaseTransitionError(phaseId, phase.status, 'active');
      }
      const updated: Phase = { ...phase, status: 'active', updatedAt: now() };
      await phaseRepository.save(updated);
      return updated;
    },

    async completePhase(organizationId, phaseId) {
      const phase = await requirePhase(organizationId, phaseId);
      if (!canTransitionPhase(phase.status, 'completed')) {
        throw new InvalidPhaseTransitionError(phaseId, phase.status, 'completed');
      }
      const updated: Phase = { ...phase, status: 'completed', updatedAt: now() };
      await phaseRepository.save(updated);
      return updated;
    },

    async getPhase(organizationId, phaseId) {
      return phaseRepository.findById(organizationId, phaseId);
    },

    async listPhasesForProject(organizationId, projectId) {
      return phaseRepository.findByProject(organizationId, projectId);
    },

    async createMilestone(organizationId, input) {
      const timestamp = now();
      const milestone: Milestone = {
        id: generateId('milestone'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: input.projectId,
        phaseId: input.phaseId,
        name: input.name,
        targetDate: input.targetDate,
        status: 'pending',
      };
      await milestoneRepository.save(milestone);
      return milestone;
    },

    async reachMilestone(organizationId, milestoneId, actualDate) {
      const milestone = await requireMilestone(organizationId, milestoneId);
      if (!canTransitionMilestone(milestone.status, 'reached')) {
        throw new InvalidMilestoneTransitionError(milestoneId, milestone.status, 'reached');
      }
      const updated: Milestone = { ...milestone, status: 'reached', actualDate, updatedAt: now() };
      await milestoneRepository.save(updated);
      return updated;
    },

    async missMilestone(organizationId, milestoneId) {
      const milestone = await requireMilestone(organizationId, milestoneId);
      if (!canTransitionMilestone(milestone.status, 'missed')) {
        throw new InvalidMilestoneTransitionError(milestoneId, milestone.status, 'missed');
      }
      const updated: Milestone = { ...milestone, status: 'missed', updatedAt: now() };
      await milestoneRepository.save(updated);
      return updated;
    },

    async getMilestone(organizationId, milestoneId) {
      return milestoneRepository.findById(organizationId, milestoneId);
    },

    async listMilestonesForProject(organizationId, projectId) {
      return milestoneRepository.findByProject(organizationId, projectId);
    },
  };
}
