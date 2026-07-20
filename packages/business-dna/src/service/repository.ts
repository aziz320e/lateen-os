/** @module service/repository */
import type { OrganizationId, ServiceId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Service } from './types.js';

export interface ServiceRepository extends Repository<Service, ServiceId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Service | null>;
}
