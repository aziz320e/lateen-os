/** @module market-research/repository */
import type { MarketId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Market, MarketStatus } from './types.js';

export interface MarketRepository extends Repository<Market, MarketId> {
  findByStatus(
    organizationId: OrganizationId,
    status: MarketStatus,
  ): Promise<readonly Market[]>;
}
