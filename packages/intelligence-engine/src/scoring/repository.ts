/** @module scoring/repository */
import type { IntelligenceScoreId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { IntelligenceScore, ScoringSubjectType } from './types.js';

export interface IntelligenceScoreRepository extends Repository<
  IntelligenceScore,
  IntelligenceScoreId
> {
  findBySubject(
    organizationId: OrganizationId,
    subjectType: ScoringSubjectType,
    subjectId: string,
  ): Promise<IntelligenceScore | null>;
}
