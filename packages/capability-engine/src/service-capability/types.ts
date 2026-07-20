/** @module service-capability/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  CapabilityId,
  OrganizationId,
  ServiceCapabilityId,
  ServiceId,
} from '../shared/identifiers.js';

export type { ServiceCapabilityId };

export type ServiceCapabilityStatus = 'active' | 'inactive' | 'archived';

/**
 * Links a Business DNA Service to a Capability it consumes during delivery.
 * A service may consume one or more capabilities.
 */
export interface ServiceCapability extends TenantAuditableEntity<ServiceCapabilityId> {
  readonly serviceId: ServiceId;
  readonly capabilityId: CapabilityId;
  readonly status: ServiceCapabilityStatus;
  readonly quantity?: string;
  readonly notes?: string;
}

export type { OrganizationId, ServiceId, CapabilityId };
