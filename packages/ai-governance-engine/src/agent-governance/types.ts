/** @module agent-governance/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AgentGovernanceRecordId } from '../shared/identifiers.js';

export type { AgentGovernanceRecordId };

export type AgentGovernanceStatus = 'pending' | 'approved' | 'suspended' | 'retired';

/** Governance record for one runtime AI agent — registration, suspension, retirement, capability restrictions, and runtime permissions. */
export interface AgentGovernanceRecord extends TenantAuditableEntity<AgentGovernanceRecordId> {
  readonly runtimeAgentId: string;
  readonly status: AgentGovernanceStatus;
  readonly capabilityRestrictions: readonly string[];
  readonly runtimePermissions: readonly string[];
  readonly reason?: string;
}
