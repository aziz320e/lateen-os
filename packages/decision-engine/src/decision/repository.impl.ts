/** Real in-memory {@link DecisionRepository} implementation. @module decision/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DecisionId } from '../shared/identifiers.js';
import type { Decision } from './types.js';
import type { DecisionRepository } from './repository.js';

export function createDecisionRepository(seed?: readonly Decision[]): DecisionRepository {
  const repo = createInMemoryRepository<Decision, DecisionId>({ seed });
  return {
    ...repo,
    async findByCategory(organizationId, category) {
      return repo.list(organizationId).filter((decision) => decision.category === category);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((decision) => decision.status === status);
    },
  };
}
