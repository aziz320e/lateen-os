/** @module aggregation/repository */
import type { Repository } from '../shared/repository.js';
import type { AggregationResultId, OrganizationId } from '../shared/identifiers.js';
import type { AggregationResult } from './types.js';

export interface AggregationResultRepository extends Repository<AggregationResult, AggregationResultId> {
  findAll(organizationId: OrganizationId): Promise<readonly AggregationResult[]>;
}
