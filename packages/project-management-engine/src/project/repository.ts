/** @module project/repository */
import type { Repository } from '../shared/repository.js';
import type { MilestoneId, OrganizationId, PhaseId, PortfolioId, ProgramId, ProjectId } from '../shared/identifiers.js';
import type { Milestone, Phase, Portfolio, Program, Project, ProjectStatus } from './types.js';

export interface PortfolioRepository extends Repository<Portfolio, PortfolioId> {
  findAll(organizationId: OrganizationId): Promise<readonly Portfolio[]>;
}

export interface ProgramRepository extends Repository<Program, ProgramId> {
  findAll(organizationId: OrganizationId): Promise<readonly Program[]>;
  findByPortfolio(organizationId: OrganizationId, portfolioId: PortfolioId): Promise<readonly Program[]>;
}

export interface ProjectRepository extends Repository<Project, ProjectId> {
  findAll(organizationId: OrganizationId): Promise<readonly Project[]>;
  findByProgram(organizationId: OrganizationId, programId: ProgramId): Promise<readonly Project[]>;
  findByPortfolio(organizationId: OrganizationId, portfolioId: PortfolioId): Promise<readonly Project[]>;
  findByStatus(organizationId: OrganizationId, status: ProjectStatus): Promise<readonly Project[]>;
  findByCode(organizationId: OrganizationId, code: string): Promise<Project | null>;
}

export interface PhaseRepository extends Repository<Phase, PhaseId> {
  findAll(organizationId: OrganizationId): Promise<readonly Phase[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly Phase[]>;
}

export interface MilestoneRepository extends Repository<Milestone, MilestoneId> {
  findAll(organizationId: OrganizationId): Promise<readonly Milestone[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly Milestone[]>;
  findByPhase(organizationId: OrganizationId, phaseId: PhaseId): Promise<readonly Milestone[]>;
}
