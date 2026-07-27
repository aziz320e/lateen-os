/** @module market/repository */
import type { OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { MarketModel, MarketModelId } from './types.js';

/** Persistence port for the Market Model singleton (id === organizationId). */
export interface MarketModelRepository extends Repository<MarketModel, MarketModelId> {
  findByOrganization(organizationId: OrganizationId): Promise<MarketModel | null>;
}
