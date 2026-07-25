/** Real in-memory {@link DecisionContextRepository} implementation. @module context/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DecisionContextId } from '../shared/identifiers.js';
import type { DecisionContext } from './types.js';
import type { DecisionContextRepository } from './repository.js';

export function createDecisionContextRepository(seed?: readonly DecisionContext[]): DecisionContextRepository {
  const repo = createInMemoryRepository<DecisionContext, DecisionContextId>({ seed });
  return {
    ...repo,
    async findByDecision(organizationId, decisionId) {
      return repo.list(organizationId).find((context) => context.decisionId === decisionId) ?? null;
    },
  };
}
