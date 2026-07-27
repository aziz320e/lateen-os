/** @module trend/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, TrendResultId } from '../shared/identifiers.js';
import type { TrendResult } from './types.js';

export interface TrendResultRepository extends Repository<TrendResult, TrendResultId> {
  findAll(organizationId: OrganizationId): Promise<readonly TrendResult[]>;
}
