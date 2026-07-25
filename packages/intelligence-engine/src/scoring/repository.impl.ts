/** Real in-memory {@link IntelligenceScoreRepository} implementation. @module scoring/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { IntelligenceScoreId } from '../shared/identifiers.js';
import type { IntelligenceScore } from './types.js';
import type { IntelligenceScoreRepository } from './repository.js';

export function createIntelligenceScoreRepository(seed?: readonly IntelligenceScore[]): IntelligenceScoreRepository {
  const repo = createInMemoryRepository<IntelligenceScore, IntelligenceScoreId>({ seed });
  return {
    ...repo,
    async findBySubject(organizationId, subjectType, subjectId) {
      return (
        repo
          .list(organizationId)
          .find((score) => score.subjectType === subjectType && score.subjectId === subjectId) ?? null
      );
    },
  };
}
