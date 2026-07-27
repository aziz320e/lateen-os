/** Real, in-memory {@link DecisionRepository} implementation. @module decision/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DecisionRepository } from './repository.js';
import type { Decision } from './types.js';

/** Creates a real, in-memory {@link DecisionRepository}. */
export function createDecisionRepository(seed?: readonly Decision[]): DecisionRepository {
  const repo = createInMemoryRepository<Decision>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findBySubject(organizationId, subjectId) {
      return repo.list(organizationId).filter((decision) => decision.subjectId === subjectId);
    },
    async findByReviewer(organizationId, reviewerId) {
      return repo.list(organizationId).filter((decision) => decision.reviewerId === reviewerId);
    },
  };
}
