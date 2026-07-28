/** Real, in-memory Performance Management repositories. @module performance/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { EvaluationRepository, ObjectiveRepository, ReviewPeriodRepository } from './repository.js';
import type { Evaluation, Objective, ReviewPeriod } from './types.js';

/** Creates a real, in-memory {@link ReviewPeriodRepository}. */
export function createReviewPeriodRepository(seed?: readonly ReviewPeriod[]): ReviewPeriodRepository {
  const repo = createInMemoryRepository<ReviewPeriod>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link ObjectiveRepository}. */
export function createObjectiveRepository(seed?: readonly Objective[]): ObjectiveRepository {
  const repo = createInMemoryRepository<Objective>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByEmployee(organizationId, employeeId) {
      return repo.list(organizationId).filter((objective) => objective.employeeId === employeeId);
    },
    async findByReviewPeriod(organizationId, reviewPeriodId) {
      return repo.list(organizationId).filter((objective) => objective.reviewPeriodId === reviewPeriodId);
    },
  };
}

/** Creates a real, in-memory {@link EvaluationRepository}. */
export function createEvaluationRepository(seed?: readonly Evaluation[]): EvaluationRepository {
  const repo = createInMemoryRepository<Evaluation>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByEmployee(organizationId, employeeId) {
      return repo.list(organizationId).filter((evaluation) => evaluation.employeeId === employeeId);
    },
  };
}
