/** @module discovery/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, ServiceRegistrationId } from '../shared/identifiers.js';
import type { ServiceRegistration } from './types.js';

export interface ServiceRegistrationRepository extends Repository<ServiceRegistration, ServiceRegistrationId> {
  findAll(organizationId: OrganizationId): Promise<readonly ServiceRegistration[]>;
  findByServiceName(organizationId: OrganizationId, serviceName: string): Promise<ServiceRegistration | null>;
}
