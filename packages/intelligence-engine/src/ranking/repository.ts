/** @module ranking/repository */
import type { OrganizationId, RankingResultId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { RankingResult, RankingStrategy } from './types.js';

export interface RankingResultRepository extends Repository<RankingResult, RankingResultId> {
  findByStrategy(
    organizationId: OrganizationId,
    strategy: RankingStrategy,
  ): Promise<readonly RankingResult[]>;
}
