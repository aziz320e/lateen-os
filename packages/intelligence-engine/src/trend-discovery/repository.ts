/** @module trend-discovery/repository */
import type { OrganizationId, TrendId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Trend, TrendCategory, TrendStatus } from './types.js';

export interface TrendRepository extends Repository<Trend, TrendId> {
  findByCategory(
    organizationId: OrganizationId,
    category: TrendCategory,
  ): Promise<readonly Trend[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: TrendStatus,
  ): Promise<readonly Trend[]>;
}
