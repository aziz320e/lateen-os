/** @module recommendation-engine/repository */
import type { OrganizationId, RecommendationCandidateId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { RecommendationCandidate, RecommendationCandidateStatus } from './types.js';

export interface RecommendationCandidateRepository extends Repository<
  RecommendationCandidate,
  RecommendationCandidateId
> {
  findByStatus(
    organizationId: OrganizationId,
    status: RecommendationCandidateStatus,
  ): Promise<readonly RecommendationCandidate[]>;
}
