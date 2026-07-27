/** @module communication-analytics/repository */
import type { Repository } from '../shared/repository.js';
import type { CommunicationAnalyticsId, OrganizationId } from '../shared/identifiers.js';
import type { CommunicationAnalyticsSnapshot } from './types.js';

export interface CommunicationAnalyticsRepository extends Repository<CommunicationAnalyticsSnapshot, CommunicationAnalyticsId> {
  findAll(organizationId: OrganizationId): Promise<readonly CommunicationAnalyticsSnapshot[]>;
}
