/** @module agent/types */
import type { CapabilityId } from '../shared/identifiers.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AgentId, OrganizationId, RoleId, RuntimeAgentId } from '../shared/identifiers.js';

export type { RuntimeAgentId };

/** Aligns with Business DNA `WorkforceType`. */
export type RuntimeWorkforceType =
  | 'ceo_ai'
  | 'marketing_ai'
  | 'sales_ai'
  | 'operations_ai'
  | 'finance_ai'
  | 'product_manager_ai'
  | 'hr_ai'
  | 'rd_ai';

export type AgentStatus =
  | 'registered'
  | 'idle'
  | 'running'
  | 'paused'
  | 'suspended'
  | 'terminated'
  | 'archived';

export type AgentLifecycle =
  | 'created'
  | 'registered'
  | 'activated'
  | 'executing'
  | 'paused'
  | 'resumed'
  | 'suspended'
  | 'terminated';

export interface AgentRole {
  readonly roleId: RoleId;
  readonly code: string;
  readonly name: string;
}

export interface AgentCapability {
  readonly capabilityId: CapabilityId;
  readonly label?: string;
}

/** Runtime profile for an AI agent. */
export interface AgentProfile {
  readonly displayName: string;
  readonly description?: string;
  readonly workforceType: RuntimeWorkforceType;
  readonly proactiveEnabled: boolean;
  readonly reactiveEnabled: boolean;
}

/**
 * Runtime agent aggregate — every AI agent executes inside AI Runtime.
 * Links to Business DNA Agent via `businessDnaAgentId`.
 */
export interface Agent extends TenantAuditableEntity<RuntimeAgentId> {
  readonly businessDnaAgentId: AgentId;
  readonly profile: AgentProfile;
  readonly roles: readonly AgentRole[];
  readonly capabilities: readonly AgentCapability[];
  readonly status: AgentStatus;
  readonly lifecycle: AgentLifecycle;
}

export type { OrganizationId, AgentId };
