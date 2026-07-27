/** @module governance-analytics/repository */
import type { Repository } from '../shared/repository.js';
import type { GovernanceAnalyticsId, OrganizationId } from '../shared/identifiers.js';
import type { GovernanceAnalyticsSnapshot } from './types.js';

export interface GovernanceAnalyticsRepository extends Repository<GovernanceAnalyticsSnapshot, GovernanceAnalyticsId> {
  findAll(organizationId: OrganizationId): Promise<readonly GovernanceAnalyticsSnapshot[]>;
}
