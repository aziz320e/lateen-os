/** @module discovery/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ServiceRegistrationId } from '../shared/identifiers.js';

export type { ServiceRegistrationId };

export type ServiceStatus = 'available' | 'unavailable';

/** A registered backend service the gateway can dispatch to — `serviceName` matches a `Route.targetService`. */
export interface ServiceRegistration extends TenantAuditableEntity<ServiceRegistrationId> {
  readonly serviceName: string;
  readonly status: ServiceStatus;
}
