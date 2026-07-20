/** @module machine-capability/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  CapabilityId,
  MachineCapabilityId,
  MachineId,
  OrganizationId,
} from '../shared/identifiers.js';

export type { MachineCapabilityId };

export type MachineCapabilityStatus = 'active' | 'inactive' | 'archived';

/**
 * Links a Business DNA Machine to a Capability it can provide.
 * A capability may be provided by one or more machines.
 */
export interface MachineCapability extends TenantAuditableEntity<MachineCapabilityId> {
  readonly machineId: MachineId;
  readonly capabilityId: CapabilityId;
  readonly status: MachineCapabilityStatus;
  readonly priority?: number;
  readonly notes?: string;
}

export type { OrganizationId, MachineId, CapabilityId };
