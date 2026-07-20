/** @module branch/repository */
import type { BranchId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Branch } from './types.js';

export interface BranchRepository extends Repository<Branch, BranchId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Branch | null>;
  findByOrganization(organizationId: OrganizationId): Promise<readonly Branch[]>;
}
