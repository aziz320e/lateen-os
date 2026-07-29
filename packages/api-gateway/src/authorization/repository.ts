/** @module authorization/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, PolicyId } from '../shared/identifiers.js';
import type { Policy } from './types.js';

export interface PolicyRepository extends Repository<Policy, PolicyId> {
  findAll(organizationId: OrganizationId): Promise<readonly Policy[]>;
}
