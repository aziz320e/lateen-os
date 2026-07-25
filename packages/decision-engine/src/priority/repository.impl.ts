/** Real in-memory {@link PriorityScoreRepository} implementation. @module priority/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { PriorityScoreId } from '../shared/identifiers.js';
import type { PriorityScore } from './types.js';
import type { PriorityScoreRepository } from './repository.js';

export function createPriorityScoreRepository(seed?: readonly PriorityScore[]): PriorityScoreRepository {
  const repo = createInMemoryRepository<PriorityScore, PriorityScoreId>({ seed });
  return {
    ...repo,
    async findByLevel(organizationId, level) {
      return repo.list(organizationId).filter((score) => score.level === level);
    },
  };
}
