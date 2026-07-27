/** @module task/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { SalesOpportunityId, SalesTaskId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { SalesTaskId };

export type SalesTaskType = 'proposal_approval' | 'contract_review' | 'follow_up_reminder';

export type SalesTaskStatus = 'pending' | 'completed' | 'cancelled';

/** A deterministic sales task, optionally backed by a real Workflow Engine instance. */
export interface SalesTask extends TenantAuditableEntity<SalesTaskId> {
  readonly taskType: SalesTaskType;
  readonly opportunityId: SalesOpportunityId;
  readonly status: SalesTaskStatus;
  readonly notes?: string;
  readonly dueAt?: ISODateTime;
  readonly approved?: boolean;
  readonly completedAt?: ISODateTime;
  /** Set when a real Workflow Engine collaborator was injected at task-generation time. */
  readonly workflowDefinitionId?: string;
  readonly workflowInstanceId?: string;
}

export type { OrganizationId } from '../shared/identifiers.js';
