/** @module compliance-analytics/repository */
import type { Repository } from '../shared/repository.js';
import type { ComplianceAnalyticsId, OrganizationId } from '../shared/identifiers.js';
import type { ComplianceAnalyticsSnapshot } from './types.js';

export interface ComplianceAnalyticsRepository extends Repository<ComplianceAnalyticsSnapshot, ComplianceAnalyticsId> {
  findAll(organizationId: OrganizationId): Promise<readonly ComplianceAnalyticsSnapshot[]>;
}
