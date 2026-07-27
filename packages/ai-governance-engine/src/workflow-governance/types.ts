/** @module workflow-governance/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { WorkflowGovernanceRecordId } from '../shared/identifiers.js';

export type { WorkflowGovernanceRecordId };

export type WorkflowGovernanceStatus = 'pending' | 'approved' | 'rejected';

/** Governance record for one workflow definition (by code) — approval, version policy, and an execution policy. */
export interface WorkflowGovernanceRecord extends TenantAuditableEntity<WorkflowGovernanceRecordId> {
  readonly workflowCode: string;
  readonly status: WorkflowGovernanceStatus;
  /** Empty means every version not explicitly denied is allowed. */
  readonly allowedVersions: readonly string[];
  readonly deniedVersions: readonly string[];
  readonly maxConcurrentInstances?: number;
  readonly reason?: string;
}
