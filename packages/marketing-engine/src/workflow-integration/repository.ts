/** @module workflow-integration/repository */
import type { Repository } from '../shared/repository.js';
import type { CampaignId, OrganizationId, WorkflowRequestId } from '../shared/identifiers.js';
import type { MarketingWorkflowType, WorkflowRequest, WorkflowRequestStatus } from './types.js';

export interface WorkflowRequestRepository extends Repository<WorkflowRequest, WorkflowRequestId> {
  findAll(organizationId: OrganizationId): Promise<readonly WorkflowRequest[]>;
  findByStatus(organizationId: OrganizationId, status: WorkflowRequestStatus): Promise<readonly WorkflowRequest[]>;
  findByType(organizationId: OrganizationId, requestType: MarketingWorkflowType): Promise<readonly WorkflowRequest[]>;
  findByCampaign(organizationId: OrganizationId, campaignId: CampaignId): Promise<readonly WorkflowRequest[]>;
}
