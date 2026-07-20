/** @module capability/repository */
import type { OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { CapabilityCode } from '../shared/primitives.js';
import type { Capability, CapabilityCategory, CapabilityId, CapabilityStatus } from './types.js';

export interface CapabilityRepository extends Repository<Capability, CapabilityId> {
  findByCode(organizationId: OrganizationId, code: CapabilityCode): Promise<Capability | null>;
  findByCategory(
    organizationId: OrganizationId,
    category: CapabilityCategory,
  ): Promise<readonly Capability[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: CapabilityStatus,
  ): Promise<readonly Capability[]>;
  findByTag(organizationId: OrganizationId, tag: string): Promise<readonly Capability[]>;
}
