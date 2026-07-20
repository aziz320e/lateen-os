/** @module registry/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  AgentId,
  AgentRegistrationId,
  OrganizationId,
  RuntimeAgentId,
} from '../shared/identifiers.js';
import type { AgentProfile } from '../agent/types.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { AgentRegistrationId };

/** Descriptor for a registered runtime agent. */
export interface AgentDescriptor {
  readonly runtimeAgentId: RuntimeAgentId;
  readonly businessDnaAgentId: AgentId;
  readonly profile: AgentProfile;
  readonly registeredAt: Timestamp;
}

/** Single agent registration record. */
export interface AgentRegistration extends TenantAuditableEntity<AgentRegistrationId> {
  readonly descriptor: AgentDescriptor;
  readonly active: boolean;
}

/** Registry of all agents authorized to run in the organization. */
export interface AgentRegistry extends TenantAuditableEntity<OrganizationId> {
  readonly registrations: readonly AgentRegistration[];
  readonly version: number;
}

export type { OrganizationId };
