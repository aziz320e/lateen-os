/** Real, in-memory Project Structure repositories. @module project/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { MilestoneRepository, PhaseRepository, PortfolioRepository, ProgramRepository, ProjectRepository } from './repository.js';
import type { Milestone, Phase, Portfolio, Program, Project } from './types.js';

/** Creates a real, in-memory {@link PortfolioRepository}. */
export function createPortfolioRepository(seed?: readonly Portfolio[]): PortfolioRepository {
  const repo = createInMemoryRepository<Portfolio>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link ProgramRepository}. */
export function createProgramRepository(seed?: readonly Program[]): ProgramRepository {
  const repo = createInMemoryRepository<Program>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByPortfolio(organizationId, portfolioId) {
      return repo.list(organizationId).filter((program) => program.portfolioId === portfolioId);
    },
  };
}

/** Creates a real, in-memory {@link ProjectRepository}. */
export function createProjectRepository(seed?: readonly Project[]): ProjectRepository {
  const repo = createInMemoryRepository<Project>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByProgram(organizationId, programId) {
      return repo.list(organizationId).filter((project) => project.programId === programId);
    },
    async findByPortfolio(organizationId, portfolioId) {
      return repo.list(organizationId).filter((project) => project.portfolioId === portfolioId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((project) => project.status === status);
    },
    async findByCode(organizationId, code) {
      return repo.list(organizationId).find((project) => project.code === code) ?? null;
    },
  };
}

/** Creates a real, in-memory {@link PhaseRepository}. */
export function createPhaseRepository(seed?: readonly Phase[]): PhaseRepository {
  const repo = createInMemoryRepository<Phase>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByProject(organizationId, projectId) {
      return repo.list(organizationId).filter((phase) => phase.projectId === projectId);
    },
  };
}

/** Creates a real, in-memory {@link MilestoneRepository}. */
export function createMilestoneRepository(seed?: readonly Milestone[]): MilestoneRepository {
  const repo = createInMemoryRepository<Milestone>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByProject(organizationId, projectId) {
      return repo.list(organizationId).filter((milestone) => milestone.projectId === projectId);
    },
    async findByPhase(organizationId, phaseId) {
      return repo.list(organizationId).filter((milestone) => milestone.phaseId === phaseId);
    },
  };
}
