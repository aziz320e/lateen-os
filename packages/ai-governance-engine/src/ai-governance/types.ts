/** @module ai-governance/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AiGovernanceRecordId } from '../shared/identifiers.js';

export type { AiGovernanceRecordId };

/** The six AI target kinds this generic governance ledger covers. */
export type AiGovernanceTargetType = 'provider' | 'model' | 'agent' | 'worker' | 'brain' | 'runtime';

export type AiGovernanceStatus = 'approved' | 'blocked' | 'restricted';

/** A single, deterministic governance decision over one AI target. One active record per (targetType, targetId). */
export interface AiGovernanceRecord extends TenantAuditableEntity<AiGovernanceRecordId> {
  readonly targetType: AiGovernanceTargetType;
  readonly targetId: string;
  readonly status: AiGovernanceStatus;
  readonly reason?: string;
}
