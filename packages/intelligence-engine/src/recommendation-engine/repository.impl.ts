/** Real in-memory {@link RecommendationCandidateRepository} implementation. @module recommendation-engine/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { RecommendationCandidateId } from '../shared/identifiers.js';
import type { RecommendationCandidate } from './types.js';
import type { RecommendationCandidateRepository } from './repository.js';

export function createRecommendationCandidateRepository(
  seed?: readonly RecommendationCandidate[],
): RecommendationCandidateRepository {
  const repo = createInMemoryRepository<RecommendationCandidate, RecommendationCandidateId>({ seed });
  return {
    ...repo,
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((candidate) => candidate.status === status);
    },
  };
}
