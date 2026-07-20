/** @module priority/repository */
import type { OrganizationId, PriorityScoreId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { PriorityLevel, PriorityScore } from './types.js';

export interface PriorityScoreRepository extends Repository<PriorityScore, PriorityScoreId> {
  findByLevel(
    organizationId: OrganizationId,
    level: PriorityLevel,
  ): Promise<readonly PriorityScore[]>;
}
