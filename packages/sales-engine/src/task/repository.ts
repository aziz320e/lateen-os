/** @module task/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, SalesOpportunityId, SalesTaskId } from '../shared/identifiers.js';
import type { SalesTask, SalesTaskStatus, SalesTaskType } from './types.js';

export interface SalesTaskRepository extends Repository<SalesTask, SalesTaskId> {
  findAll(organizationId: OrganizationId): Promise<readonly SalesTask[]>;
  findByStatus(organizationId: OrganizationId, status: SalesTaskStatus): Promise<readonly SalesTask[]>;
  findByType(organizationId: OrganizationId, taskType: SalesTaskType): Promise<readonly SalesTask[]>;
  findByOpportunity(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<readonly SalesTask[]>;
}
