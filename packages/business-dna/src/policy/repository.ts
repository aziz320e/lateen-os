/** @module policy/repository */
import type { OrganizationId, PolicyId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Policy, PolicyType } from './types.js';

export interface PolicyRepository extends Repository<Policy, PolicyId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Policy | null>;
  findByType(organizationId: OrganizationId, type: PolicyType): Promise<readonly Policy[]>;
  findAll(organizationId: OrganizationId): Promise<readonly Policy[]>;
}
