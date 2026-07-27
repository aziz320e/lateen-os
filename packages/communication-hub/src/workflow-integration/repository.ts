/** @module workflow-integration/repository */
import type { Repository } from '../shared/repository.js';
import type { ConversationId, OrganizationId, WorkflowRequestId } from '../shared/identifiers.js';
import type { CommunicationWorkflowType, WorkflowRequest, WorkflowRequestStatus } from './types.js';

export interface WorkflowRequestRepository extends Repository<WorkflowRequest, WorkflowRequestId> {
  findAll(organizationId: OrganizationId): Promise<readonly WorkflowRequest[]>;
  findByStatus(organizationId: OrganizationId, status: WorkflowRequestStatus): Promise<readonly WorkflowRequest[]>;
  findByType(organizationId: OrganizationId, requestType: CommunicationWorkflowType): Promise<readonly WorkflowRequest[]>;
  findByConversation(organizationId: OrganizationId, conversationId: ConversationId): Promise<readonly WorkflowRequest[]>;
}
