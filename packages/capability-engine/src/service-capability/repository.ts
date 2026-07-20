/** @module service-capability/repository */
import type {
  CapabilityId,
  OrganizationId,
  ServiceCapabilityId,
  ServiceId,
} from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { ServiceCapability, ServiceCapabilityStatus } from './types.js';

export interface ServiceCapabilityRepository extends Repository<
  ServiceCapability,
  ServiceCapabilityId
> {
  findByService(
    organizationId: OrganizationId,
    serviceId: ServiceId,
  ): Promise<readonly ServiceCapability[]>;
  findByCapability(
    organizationId: OrganizationId,
    capabilityId: CapabilityId,
  ): Promise<readonly ServiceCapability[]>;
  findByServiceAndCapability(
    organizationId: OrganizationId,
    serviceId: ServiceId,
    capabilityId: CapabilityId,
  ): Promise<ServiceCapability | null>;
  findByStatus(
    organizationId: OrganizationId,
    status: ServiceCapabilityStatus,
  ): Promise<readonly ServiceCapability[]>;
}
