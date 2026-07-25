/** Real in-memory {@link RecommendationRepository} implementation. @module recommendation/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { RecommendationId } from '../shared/identifiers.js';
import type { Recommendation } from './types.js';
import type { RecommendationRepository } from './repository.js';

export function createRecommendationRepository(seed?: readonly Recommendation[]): RecommendationRepository {
  const repo = createInMemoryRepository<Recommendation, RecommendationId>({ seed });
  return {
    ...repo,
    async findByDecision(organizationId, decisionId) {
      return repo.list(organizationId).filter((rec) => rec.decisionId === decisionId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((rec) => rec.status === status);
    },
  };
}
