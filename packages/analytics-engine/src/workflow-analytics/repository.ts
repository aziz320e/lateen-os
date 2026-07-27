/** @module workflow-analytics/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, WorkflowAnalyticsId } from '../shared/identifiers.js';
import type { WorkflowAnalyticsSnapshot } from './types.js';

export interface WorkflowAnalyticsRepository extends Repository<WorkflowAnalyticsSnapshot, WorkflowAnalyticsId> {
  findAll(organizationId: OrganizationId): Promise<readonly WorkflowAnalyticsSnapshot[]>;
}
