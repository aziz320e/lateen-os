/** Real in-memory {@link RankingResultRepository} implementation. @module ranking/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { RankingResultId } from '../shared/identifiers.js';
import type { RankingResult } from './types.js';
import type { RankingResultRepository } from './repository.js';

export function createRankingResultRepository(seed?: readonly RankingResult[]): RankingResultRepository {
  const repo = createInMemoryRepository<RankingResult, RankingResultId>({ seed });
  return {
    ...repo,
    async findByStrategy(organizationId, strategy) {
      return repo.list(organizationId).filter((result) => result.strategy === strategy);
    },
  };
}
