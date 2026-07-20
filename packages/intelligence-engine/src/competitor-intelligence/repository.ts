/** @module competitor-intelligence/repository */
import type { CompetitorId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Competitor, CompetitorStatus } from './types.js';

export interface CompetitorRepository extends Repository<Competitor, CompetitorId> {
  findByStatus(
    organizationId: OrganizationId,
    status: CompetitorStatus,
  ): Promise<readonly Competitor[]>;
}
