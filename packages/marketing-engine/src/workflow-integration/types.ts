/** @module workflow-integration/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CampaignId, WorkflowRequestId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { WorkflowRequestId };

/** Deterministic marketing workflow request type. */
export type MarketingWorkflowType = 'campaign_approval' | 'asset_review' | 'publishing' | 'follow_up';

export type WorkflowRequestStatus = 'pending' | 'completed' | 'cancelled';

/** A deterministic workflow request, optionally backed by a real Workflow Engine instance. */
export interface WorkflowRequest extends TenantAuditableEntity<WorkflowRequestId> {
  readonly requestType: MarketingWorkflowType;
  readonly campaignId: CampaignId;
  readonly status: WorkflowRequestStatus;
  readonly notes?: string;
  readonly dueAt?: ISODateTime;
  readonly approved?: boolean;
  readonly completedAt?: ISODateTime;
  /** Set when a real Workflow Engine collaborator was injected at request-generation time. */
  readonly workflowDefinitionId?: string;
  readonly workflowInstanceId?: string;
}

export type { OrganizationId } from '../shared/identifiers.js';
