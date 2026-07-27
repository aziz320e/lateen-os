/** @module model-governance/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ModelGovernanceRecordId } from '../shared/identifiers.js';

export type { ModelGovernanceRecordId };

export type ModelGovernanceStatus = 'approved' | 'blocked' | 'deprecated';

/** Governance record for one AI model, including simple version tracking. */
export interface ModelGovernanceRecord extends TenantAuditableEntity<ModelGovernanceRecordId> {
  readonly modelId: string;
  readonly modelVersion?: string;
  readonly status: ModelGovernanceStatus;
  readonly reason?: string;
  /** Set when a deprecated model has a designated replacement. */
  readonly supersededByModelId?: string;
}
