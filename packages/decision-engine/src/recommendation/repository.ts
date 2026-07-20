/** @module recommendation/repository */
import type { DecisionId, OrganizationId, RecommendationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Recommendation, RecommendationStatus } from './types.js';

export interface RecommendationRepository extends Repository<Recommendation, RecommendationId> {
  findByDecision(
    organizationId: OrganizationId,
    decisionId: DecisionId,
  ): Promise<readonly Recommendation[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: RecommendationStatus,
  ): Promise<readonly Recommendation[]>;
}
